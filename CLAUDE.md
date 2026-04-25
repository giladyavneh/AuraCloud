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
| **Frontend (Audit Dashboard)** | React dashboard showing health/freshness of AWS resources | Not yet started |

## Tech Stack
- **Language:** TypeScript (strict, across the entire stack)
- **Repo structure:** Monorepo
- **Backend:** Node.js + Express (v5)
- **Database:** MongoDB Atlas via Mongoose
- **Frontend (planned):** React + Vite + MUI

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

## Immediate Next Steps
1. **User schema** — Add a proper `User` Mongoose model to manage user data instead of hardcoded user IDs
2. **Shared types** — Implement a shared types strategy (`InferSchemaType` or a `shared-types` monorepo package) for strict type safety between API and future frontend
3. **Frontend** — Initialize React app once API and user management are solid; display `UserResourceWatchlist` data on the Audit Dashboard

## Key Decisions & Constraints
- `permissionsData` uses `Mixed` type intentionally — the real data shape from the Brain is not finalized yet
- Mock data is only seeded when collections are empty — safe to run repeatedly
- All code comments must be in English (note: there is one Hebrew comment in `db.ts` line 85 to clean up)
