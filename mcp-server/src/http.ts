// Bootstrap first: IPv4 DNS fix + stdout-to-stderr console redirect (keeps
// logging behavior identical to the stdio entry; HTTP responses are unaffected).
import "./bootstrap.js";

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import express, { type NextFunction, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { connectMongo, mongoose } from "utils";
import { metadataHandler } from "@modelcontextprotocol/sdk/server/auth/handlers/metadata.js";
import {
  bearerChallenge,
  buildProtectedResourceMetadata,
  metadataMountPaths,
  verifyMcpToken,
  type McpTokenPayload,
} from "./auth.js";
import { IdentityError, resolveUserContextByCustomerId } from "./identity.js";
import { buildServer } from "./server.js";
import { createShutdown } from "./shutdown.js";

// Same env resolution chain as the stdio entry: mcp-server/.env if a teammate keeps
// one, then api-server/.env — which is the symlink to the repo-root .env, and so is
// what actually supplies the values today. Note: ESM hoists the imports above, so
// these calls run after module load — dotenv never overrides values already set.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
dotenv.config({ path: fileURLToPath(new URL("../../api-server/.env", import.meta.url)), quiet: true });

const PORT = Number(process.env.MCP_HTTP_PORT) || 3001;

// The resource identifier clients present tokens to, and the api-server that issues
// them. Both must match what api-server advertises, or discovery sends clients to the
// wrong place. Read after the dotenv calls above, so .env values are already in scope.
const RESOURCE_URL = process.env.MCP_SERVER_URL ?? `http://localhost:${PORT}/mcp`;
// Deliberately not derived from process.env.PORT, which api-server uses for its own
// issuer default: PORT is whatever the *current* process was launched with, and dotenv
// never overrides an already-set value — so borrowing it here advertised :3001, this
// server's own port, as the authorization server. Set ISSUER_URL when api-server moves.
const ISSUER_URL = process.env.ISSUER_URL ?? "http://localhost:3000";

const rpcError = (res: Response, httpStatus: number, message: string): void => {
  // RFC 9110 requires WWW-Authenticate on 401s (and MCP's auth spec makes it a MUST).
  if (httpStatus === 401) res.set("WWW-Authenticate", bearerChallenge(RESOURCE_URL));
  res.status(httpStatus).json({
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null,
  });
};

const main = async (): Promise<void> => {
  // Fail fast: without the shared secret every request would 401 anyway.
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not set — the HTTP entry verifies api-server-issued tokens and needs the same secret (set it in api-server/.env or the environment)",
    );
  }

  await connectMongo();

  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req: Request, res: Response) => {
    // Liveness plus a basic readiness signal — a green process with a dead
    // Mongo connection would otherwise fail every /mcp call while probes pass.
    const mongoConnected = mongoose.connection.readyState === 1;
    res.status(mongoConnected ? 200 : 503).json({
      status: mongoConnected ? "ok" : "degraded",
      mongo: mongoConnected ? "connected" : "disconnected",
    });
  });

  app.use(
    metadataMountPaths(RESOURCE_URL),
    metadataHandler(buildProtectedResourceMetadata(RESOURCE_URL, ISSUER_URL)),
  );

  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        rpcError(res, 401, "Missing bearer token");
        return;
      }

      let payload: McpTokenPayload;
      try {
        payload = verifyMcpToken(header.slice(7), jwtSecret);
      } catch {
        rpcError(res, 401, "Invalid or expired token");
        return;
      }
      if (!payload.customerId) {
        rpcError(res, 401, "Token has no customerId");
        return;
      }

      // Fresh identity per request — re-linking an AWS user applies immediately.
      const ctx = await resolveUserContextByCustomerId(payload.customerId);

      // Stateless mode: a fresh transport + server per request (~0.25ms). No
      // sessions to hijack or expire, and identity can never leak across requests.
      const server = buildServer(ctx);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (err instanceof IdentityError) {
        rpcError(res, err.httpStatus, err.message);
        return;
      }
      console.error("POST /mcp failed:", err);
      if (!res.headersSent) rpcError(res, 500, "Internal server error");
    }
  });

  // Stateless mode has no server-initiated streams (GET) or sessions to end (DELETE).
  const methodNotAllowed = (_req: Request, res: Response): void => {
    rpcError(res, 405, "Method not allowed — this server runs in stateless mode");
  };
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  // express.json() failures (malformed JSON, >100kb body) would otherwise render
  // Express's HTML error page — keep every response in the JSON-RPC envelope.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Request rejected:", err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      const status = (err as { status?: number }).status ?? 400;
      rpcError(res, status, "Invalid request body");
    }
  });

  const httpServer = app.listen(PORT, () => {
    console.error(`AuraCloud MCP HTTP server listening on http://localhost:${PORT}/mcp`);
  });

  const shutdown = createShutdown(() => httpServer.close());
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

main().catch((err: unknown) => {
  console.error("Fatal:", err);
  process.exit(1);
});
