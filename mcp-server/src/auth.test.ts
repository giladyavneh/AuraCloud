import jwt from "jsonwebtoken";
import { describe, expect, test } from "vitest";
import { MCP_TOKEN_AUDIENCE } from "utils";
import {
  bearerChallenge,
  buildProtectedResourceMetadata,
  metadataMountPaths,
  metadataPath,
  verifyMcpToken,
} from "./auth.js";

const SECRET = "test-jwt-secret";
const RESOURCE_URL = "http://localhost:3001/mcp";
const ISSUER_URL = "http://localhost:3000";

describe("verifyMcpToken", () => {
  test("accepts a token carrying the MCP audience", () => {
    const token = jwt.sign({ customerId: "abc123" }, SECRET, { audience: MCP_TOKEN_AUDIENCE });

    expect(verifyMcpToken(token, SECRET).customerId).toBe("abc123");
  });

  test("rejects a login token, which carries no audience", () => {
    const token = jwt.sign({ customerId: "abc123", email: "dev@aura.test" }, SECRET);

    expect(() => verifyMcpToken(token, SECRET)).toThrow();
  });

  test("rejects a token minted for a different audience", () => {
    const token = jwt.sign({ customerId: "abc123" }, SECRET, { audience: "some-other-service" });

    expect(() => verifyMcpToken(token, SECRET)).toThrow();
  });

  test("accepts a multi-audience token that includes ours", () => {
    const token = jwt.sign({ customerId: "abc123" }, SECRET, {
      audience: [MCP_TOKEN_AUDIENCE, "some-other-service"],
    });

    expect(verifyMcpToken(token, SECRET).customerId).toBe("abc123");
  });

  test("rejects an unsigned token", () => {
    const encode = (part: object): string =>
      Buffer.from(JSON.stringify(part)).toString("base64url");
    const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({
      customerId: "abc123",
      aud: MCP_TOKEN_AUDIENCE,
    })}.`;

    expect(() => verifyMcpToken(token, SECRET)).toThrow();
  });

  test("rejects a token signed with the wrong secret", () => {
    const token = jwt.sign({ customerId: "abc123" }, "not-our-secret", {
      audience: MCP_TOKEN_AUDIENCE,
    });

    expect(() => verifyMcpToken(token, SECRET)).toThrow();
  });

  test("rejects an expired token", () => {
    const token = jwt.sign({ customerId: "abc123" }, SECRET, {
      audience: MCP_TOKEN_AUDIENCE,
      expiresIn: -1,
    });

    expect(() => verifyMcpToken(token, SECRET)).toThrow();
  });
});

describe("protected resource metadata", () => {
  test("names this server as the resource and api-server as the authorization server", () => {
    expect(buildProtectedResourceMetadata(RESOURCE_URL, ISSUER_URL)).toEqual({
      resource: "http://localhost:3001/mcp",
      // Trailing slash: api-server advertises the issuer normalised the same way.
      authorization_servers: ["http://localhost:3000/"],
    });
  });

  test("the 401 challenge points at the metadata document", () => {
    expect(bearerChallenge(RESOURCE_URL)).toBe(
      'Bearer resource_metadata="http://localhost:3001/.well-known/oauth-protected-resource/mcp"',
    );
  });

  // The route in http.ts registers metadataPath(RESOURCE_URL), so these two agreeing is
  // what keeps the advertised URL from 404ing once the resource moves off /mcp.
  test("the served path carries the resource's own path", () => {
    expect(metadataPath(RESOURCE_URL)).toBe("/.well-known/oauth-protected-resource/mcp");
    expect(metadataPath("http://localhost:3001/api/mcp")).toBe(
      "/.well-known/oauth-protected-resource/api/mcp",
    );
    expect(metadataPath("http://mcp.test")).toBe("/.well-known/oauth-protected-resource");
  });

  test("the served path is the advertised path, for any resource URL", () => {
    for (const resourceUrl of [RESOURCE_URL, "http://localhost:3001/api/mcp", "http://mcp.test"]) {
      const advertised = bearerChallenge(resourceUrl).match(/resource_metadata="([^"]+)"/)?.[1];

      expect(new URL(advertised ?? "").pathname).toBe(metadataPath(resourceUrl));
      expect(metadataMountPaths(resourceUrl)).toContain(metadataPath(resourceUrl));
    }
  });

  // Regression: mounting the bare path first made it swallow the derived one as a prefix,
  // so the URL the 401 advertises 404'd. Nothing but ordering prevents that.
  test("mounts the derived path before the bare one", () => {
    expect(metadataMountPaths("http://localhost:3001/api/mcp")).toEqual([
      "/.well-known/oauth-protected-resource/api/mcp",
      "/.well-known/oauth-protected-resource",
    ]);
  });

  test("mounts a pathless resource once", () => {
    expect(metadataMountPaths("http://mcp.test")).toEqual([
      "/.well-known/oauth-protected-resource",
    ]);
  });
});
