# mcp-server

MCP (Model Context Protocol) server that lets AI clients read and manage a user's AWS resource watchlist, explore discovered AWS resources, and — most importantly — read Aura's evaluated permission diagnostics ("is it my code, or the cloud?"). Backed directly by the AuraCloud MongoDB (shared `utils` models).

## Tools

| Tool | Type | Description |
|---|---|---|
| `get_watchlist` | read | Current watchlist (resources + monitored IAM actions) for the acting user |
| `get_permission_status` | read | Aura's evaluated allow/deny per watched resource/action, with the exact deny reason and an overall health summary. Filters: `arn`, `action`, `status`, `includeDetails` (full policy-evaluation trace) |
| `add_watchlist_resource` | write | Add a resource (`arn`, `actions[]`) — creates the watchlist if missing. The ARN must be a discovered resource: unknown ARNs are rejected (with a "did you mean" suggestion for near-misses); unknown action names are accepted but flagged in a `warnings` array |
| `remove_watchlist_resource` | write | Remove a resource by ARN (no validation — garbage that predates validation can always be removed) |
| `update_resource_actions` | write | Replace the actions array of a watched resource; unknown action names produce `warnings` |
| `list_aws_resources` | read | List discovered AWS resources. Filters: `resourceType`, `nameContains` (case-insensitive name search — resolves a human name to its exact ARN). Internal Aura identities are excluded |
| `get_resource_actions` | read | Valid IAM actions for a given ARN (same service-key mapping as the api-server) |

## Quickstart for teammates

```sh
git pull && nvm use && npm install && npm run build -w utils
echo 'export AURA_MCP_USER=<your-auracloud-email>' >> ~/.zshrc && exec zsh  # optional, defaults to admin@aura.com
```

Then open Claude Code in the repo root, approve the `auracloud` server when prompted (check with `/mcp`), and just talk to it — e.g. *"is anything blocked in my cloud right now?"*.

Your AuraCloud account must have a linked AWS user (done once in the UI); otherwise the server exits with a message telling you exactly that.

## Configuration

| Env var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string. Resolution order: process env → `mcp-server/.env` (symlink to the repo-root `.env`) → `api-server/.env` fallback — so if you already run the stack, no extra setup is needed. |
| `MCP_USER_EMAIL` | Email of the AuraCloud customer this server instance acts as. `.mcp.json` sets it via `${AURA_MCP_USER:-admin@aura.com}`, so switch identity by exporting `AURA_MCP_USER` — never by editing `.mcp.json`. |

The user identity is resolved once at startup; restart the server (or reconnect via `/mcp`) after changing the linked AWS user.

## Running

```sh
# dev (tsx)
MCP_USER_EMAIL=admin@aura.com npm run dev -w mcp-server

# built
npm run build -w utils && npm run build -w mcp-server
MCP_USER_EMAIL=admin@aura.com node mcp-server/dist/index.js
```

The server speaks MCP over **stdio** — stdout is the protocol channel. All logging goes to stderr (`src/bootstrap.ts` reroutes `console.log`/`info`/`debug` before anything else loads).

Note: SDK 1.29 rejects `tools/call` requests that omit the spec-optional `arguments` field; `buildServer` installs a small normalization shim so bare calls (e.g. `get_permission_status` with no filters) work with any client.

## Remote (HTTP) mode

A second entry point serves MCP over **Streamable HTTP** with per-user JWT auth — no repo, `.env`, or Node setup on the client side:

```sh
npm run dev:http -w mcp-server
```

| Env var | Purpose |
|---|---|
| `MCP_HTTP_PORT` | Listen port (default 3001); endpoint is `POST /mcp`, liveness at `GET /healthz` |
| `JWT_SECRET` | **Required.** Same secret the api-server signs tokens with (picked up from `api-server/.env` via the fallback chain) |

Every request must carry `Authorization: Bearer <JWT>` where the token payload is `{ customerId, email }` — exactly what the api-server's `signToken` produces. Identity is resolved **per request**, so re-linking an AWS user applies immediately. The server is stateless (fresh transport per request): no sessions, horizontally scalable.

Two things to know: tokens are currently **unscoped** — any api-server login JWT works here; an `aud: "mcp"` claim should be agreed before `/api/auth/mcp-token` ships long-lived tokens (retrofitting it later invalidates issued tokens). And when testing with `curl`, send `Accept: application/json, text/event-stream` — the MCP SDK 406s without it (real MCP clients always send both).

Connect a client:

```sh
claude mcp add --transport http auracloud-remote http://localhost:3001/mcp \
  --header "Authorization: Bearer <token>"
```

Until the Settings page issues tokens (`POST /api/auth/mcp-token`, in progress), mint a dev token manually:

```sh
node -e "console.log(require('jsonwebtoken').sign({customerId:'<Customer._id>',email:'<email>'}, process.env.JWT_SECRET, {expiresIn:'90d'}))"
```

## Connecting an AI client

The repo-root `.mcp.json` already registers the server for Claude Code (project-scoped). To register manually elsewhere:

```sh
claude mcp add auracloud \
  --env MCP_USER_EMAIL=you@company.com \
  -- npx tsx /path/to/AuraCloud/mcp-server/src/index.ts
```

For hand-crafted testing of individual tools:

```sh
npx @modelcontextprotocol/inspector -e MCP_USER_EMAIL=admin@aura.com npx tsx mcp-server/src/index.ts
```
