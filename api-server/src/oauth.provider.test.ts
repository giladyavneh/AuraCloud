import crypto from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import {
  InvalidGrantError,
  InvalidRequestError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { MCP_TOKEN_AUDIENCE } from "utils";

type FakeDoc = Record<string, unknown>;

/** Awaitable stand-in for a Mongoose query, which is both a promise and `.lean()`-able. */
function fakeQuery<T>(value: T): Promise<T> & { lean: () => Promise<T> } {
  const query = Promise.resolve(value) as Promise<T> & { lean: () => Promise<T> };
  query.lean = () => Promise.resolve(value);
  return query;
}

function matches(doc: FakeDoc, filter: FakeDoc): boolean {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}

/** Just enough of a Mongoose model to exercise the provider without a database. */
class FakeModel {
  readonly docs: FakeDoc[] = [];

  create(doc: FakeDoc) {
    const stored = { ...doc };
    this.docs.push(stored);
    return fakeQuery(stored);
  }

  findById(id: string) {
    return fakeQuery(this.docs.find((doc) => doc._id === id) ?? null);
  }

  findOne(filter: FakeDoc) {
    return fakeQuery(this.docs.find((doc) => matches(doc, filter)) ?? null);
  }

  findOneAndDelete(filter: FakeDoc) {
    const index = this.docs.findIndex((doc) => matches(doc, filter));
    if (index === -1) return fakeQuery(null);
    const [removed] = this.docs.splice(index, 1);
    return fakeQuery(removed ?? null);
  }

  findOneAndUpdate(filter: FakeDoc, update: FakeDoc, options?: { upsert?: boolean }) {
    const existing = this.docs.find((doc) => matches(doc, filter));
    if (!existing) {
      if (options?.upsert) this.docs.push({ ...filter, ...update });
      return fakeQuery(null);
    }

    const before = { ...existing };
    Object.assign(existing, update);
    return fakeQuery(before);
  }

  deleteOne(filter: FakeDoc) {
    const index = this.docs.findIndex((doc) => matches(doc, filter));
    if (index !== -1) this.docs.splice(index, 1);
    return fakeQuery({ deletedCount: index === -1 ? 0 : 1 });
  }
}

const CustomerModel = new FakeModel();
const OAuthClientModel = new FakeModel();
const OAuthGrantModel = new FakeModel();
const OAuthAuthCodeModel = new FakeModel();

vi.mock("./db.js", () => ({
  CustomerModel,
  OAuthClientModel,
  OAuthGrantModel,
  OAuthAuthCodeModel,
}));

const { approveAuthorization, describeConsentRequest, oauthProvider } = await import(
  "./oauth.provider.js"
);
const { requireAuth, signToken } = await import("./middleware/auth.middleware.js");

const CUSTOMER_ID = "customer-1";
const CUSTOMER_EMAIL = "dev@example.com";
const REDIRECT_URI = "http://localhost:41234/callback";
const CODE_CHALLENGE = "hLDQ2Rl0Wl0m0k0KPqZ0eZ0mQe0mQe0mQe0mQe0mQe0";

const client: OAuthClientInformationFull = {
  client_id: "client-1",
  client_name: "Claude Code",
  redirect_uris: [REDIRECT_URI],
};

function resetCollections(): void {
  for (const model of [CustomerModel, OAuthClientModel, OAuthGrantModel, OAuthAuthCodeModel]) {
    model.docs.length = 0;
  }
}

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

beforeEach(() => {
  resetCollections();
  CustomerModel.docs.push({ _id: CUSTOMER_ID, email: CUSTOMER_EMAIL });
  OAuthClientModel.docs.push({
    clientId: client.client_id,
    clientName: client.client_name,
    redirectUris: client.redirect_uris,
    clientSecret: null,
    clientSecretExpiresAt: null,
  });
});

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
    OAuthClientModel.docs.push({
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
    vi.useFakeTimers();
    try {
      const code = await approveAndGetCode();
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
    CustomerModel.docs.length = 0;

    await expect(
      oauthProvider.exchangeAuthorizationCode(client, code, undefined, REDIRECT_URI),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    expect(OAuthGrantModel.docs).toHaveLength(0);
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
    expect(OAuthAuthCodeModel.docs).toHaveLength(0);
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
    vi.useFakeTimers();
    try {
      const code = await approveAndGetCode();
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
    const stored = OAuthGrantModel.docs.map((grant) => grant.refreshTokenHash);
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
    const hashBefore = OAuthGrantModel.docs[0]?.refreshTokenHash;

    CustomerModel.docs.length = 0;

    await expect(
      oauthProvider.exchangeRefreshToken(client, issued.refresh_token!),
    ).rejects.toBeInstanceOf(InvalidGrantError);
    expect(OAuthGrantModel.docs[0]?.refreshTokenHash).toEqual(hashBefore);
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
