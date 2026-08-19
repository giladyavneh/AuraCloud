import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;

// No default secret: a shared fallback would let anyone forge tokens across environments.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but was not set");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;

export const BCRYPT_ROUNDS = 10;

// Where the OAuth consent screen lives — users are redirected here mid-authorization.
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

// The OAuth issuer identifier clients discover us by. Must be the URL they can reach
// api-server on, since it is also the base for the advertised endpoint URLs.
export const ISSUER_URL = process.env.ISSUER_URL ?? `http://localhost:${PORT}`;

// mcp-server, the resource server these tokens are for. api-server only issues them.
export const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:3001/mcp";

// Internal Aura infrastructure identities — single source of truth lives in
// utils/src/consts.ts (shared with mcp-server); re-exported here so routes can
// keep importing from config.
