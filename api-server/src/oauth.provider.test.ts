import crypto from "node:crypto";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  InvalidGrantError,
  InvalidRequestError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { MCP_TOKEN_AUDIENCE, mongoose, type OAuthGrantDoc } from "utils";
import { CustomerModel, OAuthAuthCodeModel, OAuthClientModel, OAuthGrantModel } from "./db.js";
import {
  approveAuthorization,
  describeConsentRequest,
  listCompanyConnectedClients,
  listConnectedClients,
  listRevocableCustomerIds,
  oauthProvider,
  revokeGrant,
} from "./oauth.provider.js";
import { requireAuth, signToken } from "./middleware/auth.middleware.js";
import oauthRoutes from "./routes/oauth.routes.js";

function newObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

const CUSTOMER_ID = newObjectId();
const CUSTOMER_EMAIL = "dev@example.com";
const COMPANY_ID = newObjectId();
const MANAGER_ID = newObjectId();
const OTHER_COMPANY_ID = newObjectId();
const OTHER_MANAGER_ID = newObjectId();
const OTHER_COMPANY_EMPLOYEE_ID = newObjectId();
const REDIRECT_URI = "http://localhost:41234/callback";
const CODE_CHALLENGE = "hLDQ2Rl0Wl0m0k0KPqZ0eZ0mQe0mQe0mQe0mQe0mQe0";

const client: OAuthClientInformationFull = {
  client_id: "client-1",
  client_name: "Claude Code",
  redirect_uris: [REDIRECT_URI],
};

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  // Mongoose builds indexes in the background on first use, so without waiting here a
  // test could write before the unique keys it is meant to run against exist.
  await Promise.all(
    [CustomerModel, OAuthClientModel, OAuthGrantModel, OAuthAuthCodeModel].map((model) =>
      model.createIndexes(),
    ),
  );
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function approveAndGetCode(): Promise<string> {
  const redirectTo = await approveAuthorization({
    customerId: CUSTOMER_ID,
    clientId: client.client_id,
    redirectUri: REDIRECT_URI,
    codeChallenge: CODE_CHALLENGE,
    scopes: ["full"],
  });

  const code = new URL(redirectTo).searchParams.get("code");
  if (!code) throw new Error("approveAuthorization returned no code");
  return code;
}

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );

  await CustomerModel.create([
    {
      _id: CUSTOMER_ID,
      firstName: "Dana",
      lastName: "Levi",
      email: CUSTOMER_EMAIL,
      roleTitle: "Developer",
      passwordHash: "a-password-hash",
      role: "employee",
      companyId: COMPANY_ID,
    },
    {
      _id: MANAGER_ID,
      firstName: "Avi",
      lastName: "Cohen",
      email: "avi@example.com",
      roleTitle: "Engineering Manager",
      passwordHash: "a-manager-password-hash",
      role: "manager",
      companyId: COMPANY_ID,
    },
    {
      _id: OTHER_MANAGER_ID,
      firstName: "Rina",
      lastName: "Katz",
      email: "rina@other.example.com",
      roleTitle: "Engineering Manager",
      passwordHash: "another-password-hash",
      role: "manager",
      companyId: OTHER_COMPANY_ID,
    },
    {
      _id: OTHER_COMPANY_EMPLOYEE_ID,
      firstName: "Noa",
      lastName: "Barak",
      email: "noa@other.example.com",
      roleTitle: "Developer",
      passwordHash: "yet-another-password-hash",
      role: "employee",
      companyId: OTHER_COMPANY_ID,
    },
  ]);

  await OAuthClientModel.create({
    clientId: client.client_id,
    clientName: client.client_name,
    redirectUris: client.redirect_uris,
    clientSecret: null,
    clientSecretExpiresAt: null,
  });
});

interface GrantOverrides {
  _id?: string;
  clientId?: string;
  lastUsedAt?: Date | null;
  createdAt?: Date;
}

function seedGrant(customerId: string, overrides: GrantOverrides = {}): Promise<OAuthGrantDoc> {
  return OAuthGrantModel.create({
    customerId,
    clientId: client.client_id,
    refreshTokenHash: "a-secret-hash",
    scopes: ["full"],
    lastUsedAt: null,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    ...overrides,
  });
}

describe("authorize", () => {
  test("sends the browser to the frontend consent screen with everything it must hand back", async () => {
    let location = "";
    const res = {
      redirect(_status: number, url: string) {
        location = url;
      },
    } as unknown as Response;

    await oauthProvider.authorize(
      client,
      {
        redirectUri: REDIRECT_URI,
        codeChallenge: CODE_CHALLENGE,
        state: "state-123",
        scopes: ["full"],
      },
      res,
    );

    const consentUrl = new URL(location);
    expect(consentUrl.origin).toBe("http://localhost:5173");
    expect(consentUrl.pathname).toBe("/oauth/authorize");
    expect(consentUrl.searchParams.get("client_id")).toBe(client.client_id);
    expect(consentUrl.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(consentUrl.searchParams.get("code_challenge")).toBe(CODE_CHALLENGE);
    expect(consentUrl.searchParams.get("state")).toBe("state-123");
  });
});

describe("describeConsentRequest", () => {
  test("names the client and confirms a registered redirect_uri", async () => {
    await expect(describeConsentRequest(client.client_id, REDIRECT_URI)).resolves.toEqual({
      clientId: client.client_id,
      clientName: "Claude Code",
      redirectUri: REDIRECT_URI,
      isRedirectUriRegistered: true,
    });
  });

  // The consent screen's deny path navigates to this URI, so a false here is the only
  // thing standing between us and an open redirect on our own origin.
  test("reports a redirect_uri the client never registered as unregistered", async () => {
    const consent = await describeConsentRequest(
      client.client_id,
      "https://attacker.example.com/callback",
    );

    expect(consent?.isRedirectUriRegistered).toBe(false);
  });

  // The route turns this null into a 404.
  test("returns null for an unknown client", async () => {
    await expect(describeConsentRequest("client-does-not-exist", REDIRECT_URI)).resolves.toBeNull();
  });

  test("reports a null clientName rather than inventing one", async () => {
    await OAuthClientModel.create({
      clientId: "anonymous-client",
      clientName: null,
      redirectUris: [REDIRECT_URI],
    });

    const consent = await describeConsentRequest("anonymous-client", REDIRECT_URI);

    expect(consent?.clientName).toBeNull();
  });
});

describe("authorization code", () => {
  test("is single-use — a second exchange of the same code is rejected", async () => {
    const code = await approveAndGetCode();

    await oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI);

    await expect(
      oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI),
    ).rejects.toBeInstanceOf(InvalidGrantError);
  });

  test("expires within a minute of being issued", async () => {
    const code = await approveAndGetCode();

    // Only Date is faked, and only after the code is written: the driver's pool and
    // heartbeat timers have to keep running or the queries below never settle.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.advanceTimersByTime(61_000);

      await expect(
        oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI),
      ).rejects.toBeInstanceOf(InvalidGrantError);
    } finally {
      vi.useRealTimers();
    }
  });

  test("cannot be redeemed against a different redirect_uri than it was issued for", async () => {
    const code = await approveAndGetCode();

    await expect(
      oauthProvider.exchangeAuthorizationCode(
        client,
        code,
        undefined,
        "http://localhost:41234/other",
      ),
    ).rejects.toBeInstanceOf(InvalidGrantError);
  });

  test("may be redeemed by a client that omits redirect_uri at token exchange", async () => {
    const code = await approveAndGetCode();

    await expect(oauthProvider.exchangeAuthorizationCode(client, code)).resolves.toBeTruthy();
  });

  test("cannot be redeemed by a client other than the one it was issued to", async () => {
    const code = await approveAndGetCode();
    const otherClient: OAuthClientInformationFull = {
      client_id: "client-2",
      redirect_uris: [REDIRECT_URI],
    };

    await expect(
      oauthProvider.exchangeAuthorizationCode(otherClient, code, undefined, REDIRECT_URI),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    await expect(
      oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI),
    ).resolves.toBeTruthy();
  });

  // A grant written for an account that no longer exists would survive the cleanup in
  // employees.routes.ts, so no grant may be created before the customer is confirmed.
  test("redeemed after the account was deleted leaves no grant behind", async () => {
    const code = await approveAndGetCode();
    await CustomerModel.deleteMany({});

    await expect(
      oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(0);
  });

  test("is not issued for a redirect_uri the client never registered", async () => {
    await expect(
      approveAuthorization({
        customerId: CUSTOMER_ID,
        clientId: client.client_id,
        redirectUri: "https://attacker.example.com/callback",
        codeChallenge: CODE_CHALLENGE,
        scopes: ["full"],
      }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
    await expect(OAuthAuthCodeModel.countDocuments()).resolves.toBe(0);
  });
});

describe("challengeForAuthorizationCode", () => {
  test("returns the PKCE challenge the code was issued with", async () => {
    const code = await approveAndGetCode();

    await expect(oauthProvider.challengeForAuthorizationCode(client, code)).resolves.toEqual(
      CODE_CHALLENGE,
    );
  });

  test("rejects an expired code", async () => {
    const code = await approveAndGetCode();

    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.advanceTimersByTime(61_000);

      await expect(
        oauthProvider.challengeForAuthorizationCode(client, code),
      ).rejects.toBeInstanceOf(InvalidGrantError);
    } finally {
      vi.useRealTimers();
    }
  });

  test("rejects a code belonging to a different client", async () => {
    const code = await approveAndGetCode();
    const otherClient: OAuthClientInformationFull = {
      client_id: "client-2",
      redirect_uris: [REDIRECT_URI],
    };

    await expect(
      oauthProvider.challengeForAuthorizationCode(otherClient, code),
    ).rejects.toBeInstanceOf(InvalidGrantError);
  });
});

describe("refresh token", () => {
  test("is stored hashed, never in plaintext", async () => {
    const code = await approveAndGetCode();

    const tokens = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    const expectedHash = crypto
      .createHash("sha256")
      .update(tokens.refresh_token!)
      .digest("hex");
    const grants = await OAuthGrantModel.find().lean();
    const stored = grants.map((grant) => grant.refreshTokenHash);
    expect(stored).toEqual([expectedHash]);
    expect(stored).not.toContain(tokens.refresh_token);
  });

  test("rotates on use, and the token it replaced stops working", async () => {
    const code = await approveAndGetCode();
    const issued = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    const refreshed = await oauthProvider.exchangeRefreshToken(client, issued.refresh_token!);

    expect(refreshed.refresh_token).not.toEqual(issued.refresh_token);
    await expect(
      oauthProvider.exchangeRefreshToken(client, issued.refresh_token!),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    await expect(
      oauthProvider.exchangeRefreshToken(client, refreshed.refresh_token!),
    ).resolves.toBeTruthy();
  });

  // Rotation must not commit unless the replacement token can actually be handed back,
  // or the client is left holding a dead token with nothing to replace it.
  test("is left intact when minting the new access token fails", async () => {
    const code = await approveAndGetCode();
    const issued = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );
    const hashBefore = (await OAuthGrantModel.findOne().lean())?.refreshTokenHash;

    await CustomerModel.deleteMany({});

    await expect(
      oauthProvider.exchangeRefreshToken(client, issued.refresh_token!),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    expect((await OAuthGrantModel.findOne().lean())?.refreshTokenHash).toEqual(hashBefore);
  });

  test("stops working once the grant is revoked", async () => {
    const code = await approveAndGetCode();
    const issued = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    await oauthProvider.revokeToken!(client, { token: issued.refresh_token! });

    await expect(
      oauthProvider.exchangeRefreshToken(client, issued.refresh_token!),
    ).rejects.toBeInstanceOf(InvalidGrantError);
  });
});

describe("access token", () => {
  test("carries the MCP audience and identifies the customer", async () => {
    const code = await approveAndGetCode();

    const tokens = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    const payload = jwt.decode(tokens.access_token) as {
      aud: string;
      customerId: string;
      email: string;
    };
    expect(payload.aud).toEqual(MCP_TOKEN_AUDIENCE);
    expect(payload.customerId).toEqual(CUSTOMER_ID);
    expect(payload.email).toEqual(CUSTOMER_EMAIL);
  });

  test("verifies with the scopes it was granted", async () => {
    const code = await approveAndGetCode();
    const tokens = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    const authInfo = await oauthProvider.verifyAccessToken(tokens.access_token);

    expect(authInfo.scopes).toEqual(["full"]);
    expect(authInfo.clientId).toEqual(client.client_id);
    expect(authInfo.extra?.customerId).toEqual(CUSTOMER_ID);
  });

  // The mirror of requireAuth's audience check: neither token type works as the other.
  test("verification rejects a login token", async () => {
    const loginToken = signToken({ customerId: CUSTOMER_ID, email: CUSTOMER_EMAIL });

    await expect(oauthProvider.verifyAccessToken(loginToken)).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });
});

describe("connected clients", () => {
  const OTHER_CUSTOMER_ID = newObjectId();

  test("names the client and its registered addresses, which only the join knows", async () => {
    const grant = await seedGrant(CUSTOMER_ID, {
      lastUsedAt: new Date("2026-08-04T09:00:00.000Z"),
    });

    await expect(listConnectedClients(CUSTOMER_ID)).resolves.toEqual([
      {
        id: String(grant._id),
        clientId: client.client_id,
        clientName: "Claude Code",
        redirectUris: [REDIRECT_URI],
        connectedAt: "2026-08-01T10:00:00.000Z",
        lastUsedAt: "2026-08-04T09:00:00.000Z",
      },
    ]);
  });

  test("returns nobody else's connections", async () => {
    await seedGrant(CUSTOMER_ID);
    await seedGrant(OTHER_CUSTOMER_ID, { clientId: "client-2" });

    const clients = await listConnectedClients(CUSTOMER_ID);

    expect(clients).toHaveLength(1);
    expect(clients[0]?.clientId).toBe(client.client_id);
  });

  // The hash is a bearer credential in everything but name — a rendered list is one
  // screenshot away from being shared.
  test("never carries the refresh token hash", async () => {
    await seedGrant(CUSTOMER_ID);

    const [connectedClient] = await listConnectedClients(CUSTOMER_ID);

    expect(JSON.stringify(connectedClient)).not.toContain("a-secret-hash");
    expect(connectedClient).not.toHaveProperty("refreshTokenHash");
  });

  // The registration is permanent today, but the access is what matters: a row the
  // list cannot describe is still a row the user has to be able to cut.
  test("still lists a grant whose client registration is gone", async () => {
    const grant = await seedGrant(CUSTOMER_ID, { clientId: "client-deleted" });

    await expect(listConnectedClients(CUSTOMER_ID)).resolves.toEqual([
      {
        id: String(grant._id),
        clientId: "client-deleted",
        clientName: null,
        redirectUris: [],
        connectedAt: "2026-08-01T10:00:00.000Z",
        lastUsedAt: null,
      },
    ]);
  });

  test("puts the newest connection first", async () => {
    const older = await seedGrant(CUSTOMER_ID, { createdAt: new Date("2026-07-01T10:00:00.000Z") });
    const newer = await seedGrant(CUSTOMER_ID, {
      clientId: "client-2",
      createdAt: new Date("2026-08-03T10:00:00.000Z"),
    });

    const clients = await listConnectedClients(CUSTOMER_ID);

    expect(clients.map((connected) => connected.id)).toEqual([
      String(newer._id),
      String(older._id),
    ]);
  });

  test("revoking removes the grant, so the refresh token stops working", async () => {
    const grant = await seedGrant(CUSTOMER_ID);

    await expect(revokeGrant(String(grant._id), [CUSTOMER_ID])).resolves.toBe(true);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(0);
  });

  // False is what the route turns into a 404 — a 403 would confirm the grant exists.
  test("revoking someone else's connection reports it as missing and leaves it alone", async () => {
    const grant = await seedGrant(OTHER_CUSTOMER_ID);

    await expect(revokeGrant(String(grant._id), [CUSTOMER_ID])).resolves.toBe(false);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(1);
  });

  test("revoking a grant that is already gone reports it as missing", async () => {
    await expect(revokeGrant(newObjectId(), [CUSTOMER_ID])).resolves.toBe(false);
  });

  // An empty allowance must delete nothing. The predicate is the only tenancy check
  // there is, so a caller allowed to touch nobody has to reach nothing.
  test("revoking with an empty allowance deletes nothing", async () => {
    const grant = await seedGrant(CUSTOMER_ID);

    await expect(revokeGrant(String(grant._id), [])).resolves.toBe(false);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(1);
  });
});

describe("company connections", () => {
  test("names the person behind each connection", async () => {
    const grant = await seedGrant(CUSTOMER_ID, {
      lastUsedAt: new Date("2026-08-04T09:00:00.000Z"),
    });

    await expect(listCompanyConnectedClients(COMPANY_ID)).resolves.toEqual([
      {
        id: String(grant._id),
        clientId: client.client_id,
        clientName: "Claude Code",
        redirectUris: [REDIRECT_URI],
        connectedAt: "2026-08-01T10:00:00.000Z",
        lastUsedAt: "2026-08-04T09:00:00.000Z",
        employee: {
          id: CUSTOMER_ID,
          firstName: "Dana",
          lastName: "Levi",
          email: CUSTOMER_EMAIL,
        },
      },
    ]);
  });

  test("lists nothing from another company", async () => {
    await seedGrant(CUSTOMER_ID);
    await seedGrant(OTHER_COMPANY_EMPLOYEE_ID);
    await seedGrant(OTHER_MANAGER_ID);

    const clients = await listCompanyConnectedClients(COMPANY_ID);

    expect(clients).toHaveLength(1);
    expect(clients[0]?.employee.email).toBe(CUSTOMER_EMAIL);
  });

  // The response is built from Customer documents, so a spread would leak the login
  // credential alongside the connection it was meant to describe.
  test("never carries token material or a password hash", async () => {
    await seedGrant(CUSTOMER_ID);

    const clients = await listCompanyConnectedClients(COMPANY_ID);

    expect(JSON.stringify(clients)).not.toContain("a-secret-hash");
    expect(JSON.stringify(clients)).not.toContain("a-password-hash");
    expect(clients[0]).not.toHaveProperty("refreshTokenHash");
  });

  test("keeps one person's connections together, newest first", async () => {
    const olderOwn = await seedGrant(CUSTOMER_ID, {
      createdAt: new Date("2026-07-01T10:00:00.000Z"),
    });
    const colleagueGrant = await seedGrant(MANAGER_ID, { clientId: "client-2" });
    const newerOwn = await seedGrant(CUSTOMER_ID, {
      clientId: "client-2",
      createdAt: new Date("2026-08-03T10:00:00.000Z"),
    });

    const clients = await listCompanyConnectedClients(COMPANY_ID);

    expect(clients.map((connected) => connected.id)).toEqual([
      String(colleagueGrant._id),
      String(newerOwn._id),
      String(olderOwn._id),
    ]);
  });

  test("a manager may cut a connection belonging to someone they manage", async () => {
    const grant = await seedGrant(CUSTOMER_ID);

    const revocable = await listRevocableCustomerIds(MANAGER_ID);

    await expect(revokeGrant(String(grant._id), revocable)).resolves.toBe(true);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(0);
  });

  // The predicate the delete carries is the whole tenancy check — if the roster ever
  // stopped scoping it, this is the test that fails.
  test("a manager of another company cuts nothing and the connection survives", async () => {
    const grant = await seedGrant(CUSTOMER_ID);

    const revocable = await listRevocableCustomerIds(OTHER_MANAGER_ID);

    expect(revocable).not.toContain(CUSTOMER_ID);
    await expect(revokeGrant(String(grant._id), revocable)).resolves.toBe(false);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(1);
  });

  // A token outlives the account it was signed for, and that caller must not end up with
  // a wider allowance than the one they had while the account existed.
  test("a caller whose account is gone may still cut only their own", async () => {
    await CustomerModel.deleteMany({});

    await expect(listRevocableCustomerIds(CUSTOMER_ID)).resolves.toEqual([CUSTOMER_ID]);
  });

  // The registration is permanent today, but the access is what matters: a row the list
  // cannot describe is still a row the manager has to be able to cut.
  test("still lists a grant whose client registration is gone, with its owner named", async () => {
    const grant = await seedGrant(CUSTOMER_ID, { clientId: "client-deleted" });

    await expect(listCompanyConnectedClients(COMPANY_ID)).resolves.toEqual([
      {
        id: String(grant._id),
        clientId: "client-deleted",
        clientName: null,
        redirectUris: [],
        connectedAt: "2026-08-01T10:00:00.000Z",
        lastUsedAt: null,
        employee: {
          id: CUSTOMER_ID,
          firstName: "Dana",
          lastName: "Levi",
          email: CUSTOMER_EMAIL,
        },
      },
    ]);
  });

  test("an employee may cut only their own connection", async () => {
    const colleagueGrant = await seedGrant(MANAGER_ID);

    const revocable = await listRevocableCustomerIds(CUSTOMER_ID);

    expect(revocable).toEqual([CUSTOMER_ID]);
    await expect(revokeGrant(String(colleagueGrant._id), revocable)).resolves.toBe(false);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(1);
  });
});

// Over a real socket rather than the handler alone: the 404 for a malformed id comes
// from router.param, which only runs when the request is routed.
describe("/api/oauth/grants routes", () => {
  const GRANT_ID = "68e0f0c2e4b0a1a2b3c4d5e6";
  const UNUSED_GRANT_ID = "68e0f0c2e4b0a1a2b3c4d5ff";

  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = express();
    app.use(oauthRoutes);
    server = app.listen(0);
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.close();
    await once(server, "close");
  });

  function authHeader(customerId: string): Record<string, string> {
    return {
      authorization: `Bearer ${signToken({ customerId, email: CUSTOMER_EMAIL })}`,
    };
  }

  function disconnect(grantId: string, callerId = CUSTOMER_ID): Promise<globalThis.Response> {
    return fetch(`${baseUrl}/api/oauth/grants/${grantId}`, {
      method: "DELETE",
      headers: authHeader(callerId),
    });
  }

  function listCompanyGrants(callerId: string): Promise<globalThis.Response> {
    return fetch(`${baseUrl}/api/oauth/grants/company`, { headers: authHeader(callerId) });
  }

  test("answers 204 and removes the grant", async () => {
    await seedGrant(CUSTOMER_ID, { _id: GRANT_ID });

    const response = await disconnect(GRANT_ID);

    expect(response.status).toBe(204);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(0);
  });

  test("answers 404 for a connection this account does not have", async () => {
    const response = await disconnect(UNUSED_GRANT_ID);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Connection not found" });
  });

  // A CastError reaching Mongoose would surface as a 500 and tell a prober that the id
  // shape, not the connection, was the problem. The message is what separates this 404
  // from the handler's — it is the only proof the param check ran at all.
  test("answers 404 for an id that is not an ObjectId at all", async () => {
    const response = await disconnect("not-an-object-id");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Not found" });
  });

  test("refuses an unauthenticated caller before looking anything up", async () => {
    const response = await fetch(`${baseUrl}/api/oauth/grants/${GRANT_ID}`, { method: "DELETE" });

    expect(response.status).toBe(401);
  });

  test("lets a manager disconnect someone in their own company", async () => {
    await seedGrant(CUSTOMER_ID, { _id: GRANT_ID });

    const response = await disconnect(GRANT_ID, MANAGER_ID);

    expect(response.status).toBe(204);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(0);
  });

  // 404 rather than 403: a manager elsewhere must not learn this connection exists.
  test("answers 404 for a manager of another company and leaves the grant alone", async () => {
    await seedGrant(CUSTOMER_ID, { _id: GRANT_ID });

    const response = await disconnect(GRANT_ID, OTHER_MANAGER_ID);

    expect(response.status).toBe(404);
    await expect(OAuthGrantModel.countDocuments()).resolves.toBe(1);
  });

  test("gives a manager their own company's connections and nobody else's", async () => {
    await seedGrant(CUSTOMER_ID, { _id: GRANT_ID });
    await seedGrant(OTHER_COMPANY_EMPLOYEE_ID, { _id: UNUSED_GRANT_ID });

    const response = await listCompanyGrants(MANAGER_ID);
    const body = (await response.json()) as { id: string; employee: { email: string } }[];

    expect(response.status).toBe(200);
    expect(body.map((connection) => connection.id)).toEqual([GRANT_ID]);
    expect(body[0]?.employee.email).toBe(CUSTOMER_EMAIL);
    expect(JSON.stringify(body)).not.toContain("a-secret-hash");
  });

  test("refuses the company list to an employee", async () => {
    const response = await listCompanyGrants(CUSTOMER_ID);

    expect(response.status).toBe(403);
  });
});

describe("requireAuth", () => {
  function runRequireAuth(token: string) {
    const outcome = { statusCode: 0, passed: false };
    const res = {
      status(code: number) {
        outcome.statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    } as unknown as Response;
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;

    requireAuth(req, res, () => {
      outcome.passed = true;
    });

    return outcome;
  }

  test("rejects an MCP access token", async () => {
    const code = await approveAndGetCode();
    const tokens = await oauthProvider.exchangeAuthorizationCode(
      client,
      code,
      undefined,
      REDIRECT_URI,
    );

    const outcome = runRequireAuth(tokens.access_token);

    expect(outcome.passed).toBe(false);
    expect(outcome.statusCode).toBe(401);
  });

  test("still accepts a login token", () => {
    const outcome = runRequireAuth(
      signToken({ customerId: CUSTOMER_ID, email: CUSTOMER_EMAIL }),
    );

    expect(outcome.passed).toBe(true);
    expect(outcome.statusCode).toBe(0);
  });
});
