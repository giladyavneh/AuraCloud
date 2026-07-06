# mcp-server

MCP (Model Context Protocol) server that lets AI clients read and manage a user's AWS resource watchlist and explore discovered AWS resources, backed directly by the AuraCloud MongoDB (shared `utils` models).

## Tools

| Tool | Type | Description |
|---|---|---|
| `get_watchlist` | read | Current watchlist (resources + monitored IAM actions) for the configured user |
| `add_watchlist_resource` | write | Add a resource (`arn`, `actions[]`) — creates the watchlist if missing |
| `remove_watchlist_resource` | write | Remove a resource by ARN |
| `update_resource_actions` | write | Replace the actions array of a watched resource |
| `list_aws_resources` | read | List discovered AWS resources (optional `resourceType` filter) |
| `get_resource_actions` | read | Valid IAM actions for a given ARN (same service-key mapping as the api-server) |

## Configuration

| Env var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string (provided via the repo-root `.env` symlink) |
| `MCP_USER_EMAIL` | Email of the AuraCloud customer this server instance acts as. The customer must have a linked AWS user (`linkedAwsUserId`) — link one in the AuraCloud UI first. |

The user identity is resolved once at startup; restart the server after changing the linked AWS user.

## Running

```sh
# dev (tsx)
MCP_USER_EMAIL=admin@aura.com npm run dev -w mcp-server

# built
npm run build -w utils && npm run build -w mcp-server
MCP_USER_EMAIL=admin@aura.com node mcp-server/dist/index.js
```

The server speaks MCP over **stdio** — stdout is the protocol channel. All logging goes to stderr (`src/bootstrap.ts` reroutes `console.log`/`info`/`debug` before anything else loads).

## Connecting an AI client

Register with Claude Code:

```sh
claude mcp add auracloud \
  --env MCP_USER_EMAIL=admin@aura.com \
  -- npx tsx /path/to/AuraCloud/mcp-server/src/index.ts
```

Or add a project-scoped `.mcp.json` at the repo root:

```json
{
  "mcpServers": {
    "auracloud": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"],
      "env": { "MCP_USER_EMAIL": "admin@aura.com" }
    }
  }
}
```
