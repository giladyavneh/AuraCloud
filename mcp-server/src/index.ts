// Bootstrap first: IPv4 DNS fix + stdout-to-stderr console redirect.
import "./bootstrap.js";

import dotenv from "dotenv";
import { fileURLToPath } from "url";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { connectMongo } from "utils";
import { resolveUserContext } from "./identity.js";
import { buildServer } from "./server.js";

// Load mcp-server/.env (symlinked to the repo root .env) relative to this
// file so it works regardless of the client's working directory.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

const main = async (): Promise<void> => {
  await connectMongo();
  const ctx = await resolveUserContext();
  const server = buildServer(ctx);
  await server.connect(new StdioServerTransport());
  console.error(`AuraCloud MCP server ready (user: ${ctx.email}, awsUserId: ${ctx.linkedAwsUserId})`);
};

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
