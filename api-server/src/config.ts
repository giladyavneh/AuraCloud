import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;

// No default secret: a shared fallback would let anyone forge tokens across environments.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required but was not set");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;

export const BCRYPT_ROUNDS = 10;

// Internal Aura infrastructure identities — single source of truth lives in
// utils/src/consts.ts (shared with mcp-server); re-exported here so routes can
// keep importing from config.
export { INTERNAL_AWS_USER_ARNS } from "utils";
