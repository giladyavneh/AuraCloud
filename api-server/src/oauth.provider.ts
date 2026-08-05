import crypto from "node:crypto";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { redirectUriMatches } from "@modelcontextprotocol/sdk/server/auth/handlers/authorize.js";
import {
  InvalidClientError,
  InvalidGrantError,
  InvalidRequestError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { MCP_TOKEN_AUDIENCE, type OAuthClient } from "utils";
import { CustomerModel, OAuthAuthCodeModel, OAuthClientModel, OAuthGrantModel } from "./db.js";
import { FRONTEND_URL, JWT_SECRET } from "./config.js";

export interface ApprovalRequest {
  customerId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  state?: string;
}

export interface ConsentRequestInfo {
  clientId: string;
  clientName: string | null;
  redirectUri: string;
  isRedirectUriRegistered: boolean;
}

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const AUTHORIZATION_CODE_TTL_SECONDS = 60;
const CONSENT_PATH = "/oauth/authorize";

function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isRedirectUriRegistered(client: OAuthClient, redirectUri: string): boolean {
  return client.redirectUris.some((registered) => redirectUriMatches(redirectUri, registered));
}

function toClientInformation(client: OAuthClient): OAuthClientInformationFull {
  return {
    client_id: client.clientId,
    client_name: client.clientName ?? undefined,
    redirect_uris: client.redirectUris,
    client_secret: client.clientSecret ?? undefined,
    client_secret_expires_at: client.clientSecretExpiresAt ?? undefined,
  };
}

/**
 * Callers must mint before they write the grant. Minting can fail (the account may be
 * gone, the read may error), and a rotation that has already committed leaves the client
 * holding a dead refresh token with no replacement — an unrecoverable grant.
 */
async function mintAccessToken(
  customerId: string,
  clientId: string,
  scopes: string[],
): Promise<string> {
  const customer = await CustomerModel.findById(customerId).lean();
  if (!customer) throw new InvalidGrantError("The authorizing account no longer exists");

  return jwt.sign({ customerId, email: customer.email, clientId, scopes }, JWT_SECRET, {
    audience: MCP_TOKEN_AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

function toTokenResponse(accessToken: string, refreshToken: string, scopes: string[]): OAuthTokens {
  const tokens: OAuthTokens = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
  };
  if (scopes.length > 0) tokens.scope = scopes.join(" ");

  return tokens;
}

export const oauthClientsStore: OAuthRegisteredClientsStore = {
  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    const client = await OAuthClientModel.findOne({ clientId }).lean();
    return client ? toClientInformation(client) : undefined;
  },

  async registerClient(
    client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">,
  ): Promise<OAuthClientInformationFull> {
    // The SDK's registration handler generates the client id and attaches it before
    // calling in, but types the argument as if it had not.
    const registered = client as OAuthClientInformationFull;

    await OAuthClientModel.create({
      clientId: registered.client_id,
      clientName: registered.client_name ?? null,
      redirectUris: registered.redirect_uris,
      clientSecret: registered.client_secret ?? null,
      clientSecretExpiresAt: registered.client_secret_expires_at ?? null,
    });

    return registered;
  },
};

export const oauthProvider: OAuthServerProvider = {
  get clientsStore(): OAuthRegisteredClientsStore {
    return oauthClientsStore;
  },

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    // ponytail: RFC 8707 `resource` is dropped — not forwarded to consent, not stored, not
    // bound into the token. Harmless while mcp-server is the only resource server; with a
    // second one, carry it onto OAuthAuthCode and into the token audience so a token cannot
    // be replayed against a resource it was not minted for.
    const consentUrl = new URL(CONSENT_PATH, FRONTEND_URL);
    consentUrl.searchParams.set("client_id", client.client_id);
    consentUrl.searchParams.set("redirect_uri", params.redirectUri);
    consentUrl.searchParams.set("code_challenge", params.codeChallenge);
    if (params.state) consentUrl.searchParams.set("state", params.state);
    if (params.scopes?.length) consentUrl.searchParams.set("scope", params.scopes.join(" "));

    res.redirect(302, consentUrl.href);
  },

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const authCode = await OAuthAuthCodeModel.findOne({
      code: authorizationCode,
      clientId: client.client_id,
    }).lean();
    if (!authCode || authCode.expiresAt.getTime() <= Date.now()) {
      throw new InvalidGrantError("Authorization code is invalid or expired");
    }

    return authCode.codeChallenge;
  },

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    // Deleting as we read is what makes the code single-use: a replay finds nothing,
    // and two concurrent exchanges cannot both win the delete.
    const authCode = await OAuthAuthCodeModel.findOneAndDelete({
      code: authorizationCode,
      clientId: client.client_id,
    }).lean();
    if (!authCode || authCode.expiresAt.getTime() <= Date.now()) {
      throw new InvalidGrantError("Authorization code is invalid or expired");
    }
    // Omitting redirect_uri is legal when it was absent from the authorization request
    // too (RFC 6749 §4.1.3), so only a present-and-different value is a mismatch.
    if (redirectUri !== undefined && redirectUri !== authCode.redirectUri) {
      throw new InvalidGrantError("redirect_uri does not match the authorization request");
    }

    const accessToken = await mintAccessToken(
      authCode.customerId,
      client.client_id,
      authCode.scopes,
    );

    const refreshToken = randomToken();
    await OAuthGrantModel.findOneAndUpdate(
      { customerId: authCode.customerId, clientId: client.client_id },
      {
        refreshTokenHash: hashToken(refreshToken),
        scopes: authCode.scopes,
        lastUsedAt: new Date(),
      },
      { upsert: true },
    );

    return toTokenResponse(accessToken, refreshToken, authCode.scopes);
  },

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
  ): Promise<OAuthTokens> {
    const presentedHash = hashToken(refreshToken);
    const grant = await OAuthGrantModel.findOne({
      clientId: client.client_id,
      refreshTokenHash: presentedHash,
    }).lean();
    if (!grant) throw new InvalidGrantError("Refresh token is invalid or has been revoked");

    const accessToken = await mintAccessToken(grant.customerId, client.client_id, grant.scopes);

    const rotatedToken = randomToken();
    // Conditioning the write on the presented hash is what makes rotation safe: the old
    // token stops matching the moment the new one lands, so a replay — or the loser of a
    // race between two concurrent refreshes — finds no grant to update.
    const rotated = await OAuthGrantModel.findOneAndUpdate(
      { clientId: client.client_id, refreshTokenHash: presentedHash },
      { refreshTokenHash: hashToken(rotatedToken), lastUsedAt: new Date() },
    ).lean();
    if (!rotated) throw new InvalidGrantError("Refresh token is invalid or has been revoked");

    return toTokenResponse(accessToken, rotatedToken, grant.scopes);
  },

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { audience: MCP_TOKEN_AUDIENCE }) as {
        customerId: string;
        clientId: string;
        scopes?: string[];
        exp?: number;
      };

      return {
        token,
        clientId: payload.clientId,
        scopes: payload.scopes ?? [],
        expiresAt: payload.exp,
        extra: { customerId: payload.customerId },
      };
    } catch {
      throw new InvalidTokenError("Access token is invalid or expired");
    }
  },

  async revokeToken(
    client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest,
  ): Promise<void> {
    // Only refresh tokens can be revoked: access tokens are stateless, so an issued one
    // stays valid until it expires. That is the one-hour lag the TTL is chosen for.
    await OAuthGrantModel.deleteOne({
      clientId: client.client_id,
      refreshTokenHash: hashToken(request.token),
    });
  },
};

/**
 * What the consent screen needs to describe the request, and — the part that matters —
 * whether the redirect target is one the client actually registered. The consent screen's
 * deny path navigates to that URI, so without this answer our own origin would redirect
 * anywhere an attacker put in the query string.
 *
 * Returns null for an unknown client so the caller can 404 it.
 */
export async function describeConsentRequest(
  clientId: string,
  redirectUri: string,
): Promise<ConsentRequestInfo | null> {
  const client = await OAuthClientModel.findOne({ clientId }).lean();
  if (!client) return null;

  return {
    clientId,
    clientName: client.clientName ?? null,
    redirectUri,
    isRedirectUriRegistered: isRedirectUriRegistered(client, redirectUri),
  };
}

/** Throws an OAuthError if the client or its redirect URI does not check out. */
export async function approveAuthorization(request: ApprovalRequest): Promise<string> {
  const client = await OAuthClientModel.findOne({ clientId: request.clientId }).lean();
  if (!client) throw new InvalidClientError("Unknown client");

  // These parameters travel through the browser, so the redirect target has to be
  // re-checked against the registration before a code is minted for it.
  if (!isRedirectUriRegistered(client, request.redirectUri)) {
    throw new InvalidRequestError("Unregistered redirect_uri");
  }

  const code = randomToken();
  await OAuthAuthCodeModel.create({
    code,
    customerId: request.customerId,
    clientId: request.clientId,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    scopes: request.scopes,
    expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_TTL_SECONDS * 1000),
  });

  const redirectTo = new URL(request.redirectUri);
  redirectTo.searchParams.set("code", code);
  if (request.state) redirectTo.searchParams.set("state", request.state);

  return redirectTo.href;
}
