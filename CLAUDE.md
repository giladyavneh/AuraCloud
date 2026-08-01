# Aura Cloud — Project Context

## What This Is
Aura Cloud ("NoOps for Developers") is an automated AWS infrastructure monitoring system. It gives developers a real-time dashboard to monitor AWS infrastructure health and detect configuration discrepancies (missing permissions, policy mismatches). The goal: a single source of truth to instantly distinguish local code bugs from cloud environment errors.

## Architecture (Microservices, Containerized)

| Component | Role | Status |
|---|---|---|
| **Crawlers** | Poll AWS for org-level SCPs and resource data | Not yet implemented |
| **Cache** | Redis/MongoDB — fast storage for AWS configs | Not yet implemented |
| **Brain (Central Logic Server)** | Cross-references project requirements, user permissions, and cached cloud data | Not yet implemented |
| **Results DB** | MongoDB Atlas — stores processed results per user | Active (seeded with mock data) |
| **API Server** | Delivers processed data from Results DB to UI | Active (`api-server/`) |
| **Frontend (Audit Dashboard)** | React dashboard showing health/freshness of AWS resources | Active (`frontend/`) |

## Tech Stack
- **Language:** TypeScript (strict, across the entire stack)
- **Repo structure:** Monorepo
- **Backend:** Node.js + Express (v5)
- **Database:** MongoDB Atlas via Mongoose
- **Frontend:** React + Vite + MUI + @phosphor-icons/react + react-i18next + @tanstack/react-query

## Current State of the Codebase

### `api-server/`
- Express server running on port 3000 (configurable via `PORT` env var)
- Connected to MongoDB Atlas via `MONGO_URI` in `.env`
- `src/db.ts` — defines Mongoose models and seeds mock data on first run
- `src/index.ts` — Express app with one route: `GET /api/user-resource-watchlist`

### Mongoose Schemas (both defined in `src/db.ts`)
1. **`UserResourceWatchlist`** — frontend-facing processed data
   - `userId: String`, `name: String`, `resources: [{ arn, actions[] }]`
2. **`UserPermission`** — raw backend-structured data
   - `name: String`, `permissionsData: Mixed` (flexible, pending real data shape)

### Mock Data
Crawlers and Brain are not implemented yet. `connectDB()` seeds MongoDB with hardcoded mock data if collections are empty.

## Frontend Structure (`frontend/src/`)
- **`theme/`** — MUI theme with all Figma tokens; custom palette augmentation in `theme.augment.d.ts`
- **`constants/queryKeys.ts`** — Centralised React Query keys (always add new keys here)
- **`i18n/locales/en.json`** — All user-facing strings (no hardcoded text in components)
- **`components/`** — `statusTag`, `menuItem`, `sideMenu`, `statCard`, `glowCard`, `awsServiceIcon`, `resourceCard`
- **`layouts/pageWrapper/`** — Sidebar + scrollable content shell; used as React Router layout route
- **`pages/dashboard/`** — Dashboard page with sub-components, helpers, and styled file
- **`services/resources.service.ts`** — `GET /api/user-resource-watchlist` from `api-server`
- **`hooks/resources.hooks.ts`** — `useUserResourceWatchlist()` via React Query

## Immediate Next Steps
1. **User schema** — Add a proper `User` Mongoose model to manage user data instead of hardcoded user IDs
2. **Shared types** — Implement a shared types strategy (`InferSchemaType` or a `shared-types` monorepo package) for strict type safety between API and frontend
3. **Real status data** — Replace mock `STATUS_CYCLE` in `ResourceSection.tsx` with real status from the API once Brain is implemented

## Key Decisions & Constraints
- `permissionsData` uses `Mixed` type intentionally — the real data shape from the Brain is not finalized yet
- Mock data is only seeded when collections are empty — safe to run repeatedly
- All code comments must be in English (note: there is one Hebrew comment in `db.ts` line 85 to clean up)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
