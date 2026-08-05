// Bootstrap first: IPv4 DNS fix + stdout-to-stderr console redirect (keeps
// logging behavior identical to the stdio entry; HTTP responses are unaffected).
import "./bootstrap.js";

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { connectMongo, mongoose } from "utils";
import { IdentityError, resolveUserContextByCustomerId } from "./identity.js";
import { buildServer } from "./server.js";
import { createShutdown } from "./shutdown.js";

// Same env resolution chain as the stdio entry: mcp-server/.env (symlink to the
// repo-root .env), then api-server/.env as a fallback for teammates who already
// run the stack. Note: ESM hoists the imports above, so these calls run after
// module load — dotenv never overrides values that are already set.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
dotenv.config({ path: fileURLToPath(new URL("../../api-server/.env", import.meta.url)), quiet: true });

/**
 * Subset of the api-server's JwtPayload ({ customerId, email }) — only
 * customerId is consumed here. Tokens are currently UNSCOPED: any api-server
 * login JWT is accepted (deliberate simple-now trade-off). Before long-lived
 * tokens ship via POST /api/auth/mcp-token, an `aud: "mcp"` claim should be
 * agreed with the api-server side so MCP tokens and login sessions can be
 * revoked independently — retrofitting the claim later invalidates every
 * already-issued token.
 */
interface McpTokenPayload {
  customerId?: string;
}

const PORT = Number(process.env.MCP_HTTP_PORT) || 3001;

const rpcError = (res: Response, httpStatus: number, message: string): void => {
  // RFC 9110 requires WWW-Authenticate on 401s (and MCP's auth spec makes it a
  // MUST); this server deliberately ships static bearer auth instead of the
  // spec's full OAuth resource-server flow, so header-capable clients only.
  if (httpStatus === 401) res.set("WWW-Authenticate", "Bearer");
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

  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        rpcError(res, 401, "Missing bearer token");
        return;
      }

      let payload: McpTokenPayload;
      try {
        payload = jwt.verify(header.slice(7), jwtSecret) as McpTokenPayload;
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
