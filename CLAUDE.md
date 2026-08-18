# Aura Cloud — Project Context

## What This Is
Aura Cloud ("NoOps for Developers") is an automated AWS infrastructure monitoring system. It gives developers a real-time dashboard to monitor AWS infrastructure health and detect configuration discrepancies (missing permissions, policy mismatches). The goal: a single source of truth to instantly distinguish local code bugs from cloud environment errors.

## Code Style — read this before writing code

**Readability is the top priority.** When two approaches both work, choose the one that reads more clearly, even if it is longer.

- **No cryptic names.** Never `r`, `e`, `p`, `a`. Write `resource`, `employee`, `preset`, `action`. Conventional loop indices (`i`) and `_unused` args are the only exceptions.
- **One component per file, always.** The file name matches the component name (`TeamCard.tsx` exports `TeamCard`). This includes small presentational helpers — if it returns JSX and is rendered as `<Foo />`, it gets its own file. Styled components are the exception: all of a component's `styled` definitions live together in its `*.styled.ts`.
- **Split large components.** Sub-components go in the `components/` sub-folder, pure logic in `helpers/`, React logic in `hooks/`. If a component file needs scrolling to understand, split it.
- **Comments explain _why_, never _what_ — and almost never.** The default is no comment: a clear name beats a sentence explaining an unclear one. Comment only a non-obvious constraint, a bug being prevented, or a deliberate trade-off, and keep it to **one line**. If it needs a paragraph or a multi-line JSDoc block, the code is too unclear — fix the code instead. The cap governs what you write; do not retroactively compress an existing long comment that documents a real trade-off. Never narrate what the code does, never leave progress notes, and never cite documents the reader does not have (spec sections, tickets, chat history).
- **Explicit over clever.** Prefer named intermediate values over dense one-liners, and explicit object keys over spreads when a consumer depends on the shape.
- **DB projections use `true`/`false`**, not `1`/`0`.
- Formatting is defined in `.prettierrc.json` (2-space, double quotes, semicolons, trailing commas, 100 cols). Prettier is not installed as a dependency yet.

The frontend additionally follows the global React/TypeScript/MUI rules in `~/.claude/CLAUDE.md` (strict TS with no `any`, MUI `styled` only, theme tokens for all colours/spacing, `@/` absolute imports, i18n for all user-facing text, centralised query keys).

## Architecture (Microservices, Containerized)

| Component | Role | Status |
|---|---|---|
| **Crawlers** | Poll AWS for org-level SCPs and resource data | Partially implemented (`crawlers/`) |
| **Cache** | Redis — fast storage for AWS configs | Partially implemented |
| **Brain (Central Logic Server)** | Cross-references project requirements, user permissions, and cached cloud data | Not yet implemented |
| **Results DB** | MongoDB Atlas — stores processed results per user | Active |
| **API Server** | Delivers processed data from Results DB to UI | Active (`api-server/`) |
| **Frontend (Audit Dashboard)** | React dashboard showing health/freshness of AWS resources | Active (`frontend/`) |

## Tech Stack
- **Language:** TypeScript (strict, across the entire stack)
- **Repo structure:** npm-workspaces monorepo (`utils`, `api-server`, `frontend`, `crawlers`, `logic`, `mcp-server`)
- **Backend:** Node.js + Express v5
- **Database:** MongoDB Atlas via Mongoose (replica set — transactions are available and relied upon)
- **Frontend:** React + Vite + MUI + @phosphor-icons/react + react-i18next + @tanstack/react-query + material-react-table

## Data Models — all in `utils/src/index.ts`
Models are defined **once** in the shared `utils` workspace, not in `api-server`. `api-server/src/db.ts` only re-exports them.

| Model | Purpose |
|---|---|
| `Company` | An onboarded organisation: `name`, `slug`, `inviteCode`, encrypted `awsCredentials`, `managerOpsSeq` |
| `Customer` | An Aura login account: `email`, `passwordHash`, `role: manager\|employee`, `companyId`, `teamId`, `linkedAwsUserId` |
| `Team` | A named group in a company; unique on `{companyId, name}` |
| `WatchlistPreset` | Default resources for a team or individual; unique on `{scopeType, scopeId}` |
| `User` | A **discovered AWS IAM/SSO identity** (not a login) |
| `AwsResource`, `ResourceAction` | Catalogue of discovered resources and their IAM actions |
| `UserResourceWatchlist` | The resources a person watches, keyed by AWS `externalId` |
| `UserPermission` | Raw permission data, `permissionsData: Mixed` (Brain's shape isn't final) |

**Critical identity distinction:** `Customer` is the login account; `User` is a discovered AWS identity. `Customer.linkedAwsUserId` → `User.externalId` links them. `UserResourceWatchlist.userId` is the **AWS externalId**, not a Customer id.

## Resource Status — one vocabulary, one resolver

`logic` writes only `valid` / `error` per action. Every other status is **derived**, in
exactly one place: `utils/src/resourceStatus.ts`, kept dependency-free (no mongoose, no
dotenv) so any workspace can import it.

Resolution order, per **watched** ARN — the watchlist is the set of resources, not
`permissionsData`:

| condition | status |
|---|---|
| ARN absent from `permissionsData` | `unscanned` |
| oldest action `timestamp` older than `STALE_AFTER_MS` (60_000) | `stale` |
| any action `status === "error"` | `blocked` |
| otherwise | `healthy` |

`stale` outranks `blocked`: a verdict older than the threshold cannot be trusted, and a
red blocker from a dead pipeline sends people chasing an already-fixed problem.

`unscanned` and `stale` are distinct. The first means no scan yet — wait, or check the
watchlist. The second means the pipeline stopped.

Consumers:
- **api-server** joins watchlist × permissions, resolves, and returns `resourceStatuses`
  on `GET /api/user-permissions`. Freshness is judged against the **server** clock; a
  skewed client clock must never decide staleness. That route 404s only when the user has
  no watched resources at all — otherwise they come back as `unscanned`.
- **mcp-server** imports the resolver directly — it reads Mongo itself and never calls
  api-server for data.
- **frontend** renders what the API returns and derives nothing locally.

`warning` is not a status. Nothing emits it.

## `api-server/` layout
Routes are split by domain — `index.ts` only wires things together.

```
src/
  index.ts          app setup, router mounting, startup
  config.ts         env-derived constants
  db.ts             re-exports models from utils
  presets.ts        preset resolution + additive merge
  middleware/       auth.middleware.ts (requireAuth, requireManager), objectId.middleware.ts
  helpers/          company, validation, response, lastManagerGuard
  routes/           auth, companies, employees, teams, watchlistPresets, watchlist, resources, user, aws
```

Conventions:
- Every manager-only route is `requireAuth, requireManager` and **scoped by `companyId`**. Cross-company targets return **404**, never 403 — never confirm another company's data exists.
- Routers with an `:id` param must register `router.param("id", validateObjectIdParam)`; `app.param` does not reach mounted routers. Without it a malformed id becomes a 500 instead of a 404.
- `withLastManagerGuard` must stay transactional with its `$inc` on the Company doc — that write is what forces the conflict preventing a company from losing its last manager. See `helpers/lastManagerGuard.helpers.ts`.

## Frontend Structure (`frontend/src/`)
- **`theme/`** — MUI theme with all Figma tokens; custom palette augmentation in `theme.augment.d.ts`
- **`constants/queryKeys.ts`** — Centralised React Query keys (always add new keys here)
- **`i18n/locales/en.json`** — All user-facing strings
- **`components/`** — shared: `statusTag`, `menuItem`, `sideMenu`, `statCard`, `glowCard`, `spotlightCard`, `awsServiceIcon`, `resourceCard`, `confirmDialog`, `copyField`, `keyValueRow`, `errorRetryRow`
- **`pages/`** — `dashboard`, `resourceWatchlist`, `team` (manager-only: employees/teams/presets), `settings`, auth pages
- **`services/` + `hooks/`** — API calls and their React Query wrappers

## Tests
Vitest is installed at the repo root; run the suite with `npm test`. `vitest.config.ts` picks up
`*/src/**/*.test.ts`, aliases `utils` to its source so tests never run against a stale `utils/dist`,
and supplies the `JWT_SECRET` that `config.ts` requires.
- `api-server/src/presets.test.ts` — preset merge semantics
- `api-server/src/oauth.provider.test.ts` — OAuth code/token lifecycle; mocks the models, so no live Mongo
- `api-server/src/lastManagerRace.manual.ts` — manual integration check; needs a running server and live Mongo
- `utils/src/resourceStatus.test.ts` — status resolution rules and precedence
- `mcp-server/src/permissions.test.ts` — the watchlist × permissions join; mocks the model and the watchlist
- `frontend/src/pages/dashboard/helpers/dashboard.helpers.test.ts` — heading, counts, and that every i18n key resolves

## Immediate Next Steps
1. **Brain** — replace mock/absent status data with real analysis output
2. **Shared types** — share `InferSchemaType` model types with the frontend instead of hand-written duplicates
3. **Invite hardening** — the company invite code is single, non-expiring and unlimited-use; decide whether it should expire/rotate
4. **Tenancy gap** — `GET /api/companies/:slug/aws-users` returns all `User` docs without company scoping

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
