import jwt from "jsonwebtoken";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import type { OAuthProtectedResourceMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { MCP_TOKEN_AUDIENCE } from "utils";

/** Subset of the access token's claims — only customerId is consumed here. */
export interface McpTokenPayload {
  customerId?: string;
}

/**
 * The audience option is what keeps an api-server login token from being spent here:
 * only tokens minted by the OAuth flow carry the claim. Throws on anything else.
 * The algorithm is pinned so the guarantee survives a change of key material.
 */
export const verifyMcpToken = (token: string, secret: string): McpTokenPayload =>
  jwt.verify(token, secret, {
    audience: MCP_TOKEN_AUDIENCE,
    algorithms: ["HS256"],
  }) as McpTokenPayload;

export const buildProtectedResourceMetadata = (
  resourceUrl: string,
  issuerUrl: string,
): OAuthProtectedResourceMetadata => ({
  resource: new URL(resourceUrl).href,
  authorization_servers: [new URL(issuerUrl).href],
});

const metadataUrl = (resourceUrl: string): string =>
  getOAuthProtectedResourceMetadataUrl(new URL(resourceUrl));

/**
 * Where the metadata document must be served. Derived, not written twice: the path
 * carries the resource's own path (RFC 9728), so a hardcoded route would stop matching
 * the advertised URL the moment the resource moves off /mcp.
 */
export const metadataPath = (resourceUrl: string): string =>
  new URL(metadataUrl(resourceUrl)).pathname;

/**
 * Where to mount the metadata document: the derived path, plus the bare one for clients
 * that only know our origin. Derived first is load-bearing — Express matches `use` on
 * prefix, so mounting the bare path first swallows the longer URL and leaves the handler
 * a path it has no route for, 404ing the very URL the 401 challenge advertises.
 */
export const metadataMountPaths = (resourceUrl: string): string[] => [
  ...new Set([metadataPath(resourceUrl), "/.well-known/oauth-protected-resource"]),
];

/** RFC 9728 — a rejected client reads this to find where to run the OAuth flow. */
export const bearerChallenge = (resourceUrl: string): string =>
  `Bearer resource_metadata="${metadataUrl(resourceUrl)}"`;
