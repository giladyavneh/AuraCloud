// Bootstrap first: IPv4 DNS fix + stdout-to-stderr console redirect.
import "./bootstrap.js";

import dotenv from "dotenv";
import { fileURLToPath } from "url";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { connectMongo } from "utils";
import { resolveUserContext } from "./identity.js";
import { buildServer } from "./server.js";
import { createShutdown } from "./shutdown.js";

// Load mcp-server/.env (symlinked to the repo root .env) relative to this
// file so it works regardless of the client's working directory.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
// Fallback: teammates already keep MONGO_URI in api-server/.env for the stack —
// reuse it when mcp-server/.env is absent (dotenv never overrides set values).
dotenv.config({ path: fileURLToPath(new URL("../../api-server/.env", import.meta.url)), quiet: true });

const main = async (): Promise<void> => {
  await connectMongo();
  const ctx = await resolveUserContext();
  const server = buildServer(ctx);
  await server.connect(new StdioServerTransport());
  console.error(`AuraCloud MCP server ready (user: ${ctx.email}, awsUserId: ${ctx.linkedAwsUserId})`);

  // Exit when the client disconnects — otherwise the open Mongo socket keeps
  // the process alive forever after stdin closes.
  const shutdown = createShutdown();
  process.stdin.once("end", shutdown);
  process.stdin.once("close", shutdown);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
