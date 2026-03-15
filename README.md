# FB UID Manager Pro v2

A pnpm workspace monorepo for tracking and managing Facebook UIDs.

## Prerequisites

- **Node.js** ≥ 24 — [nodejs.org](https://nodejs.org)
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **PostgreSQL** (for the API server at runtime; not needed for build/typecheck)

## Workspace Layout

```
artifacts/
  api-server/      # Express 5 API server (esbuild → CJS)
  uid-manager/     # React + Vite + Tailwind frontend
lib/
  db/              # Drizzle ORM schema + PostgreSQL client
  api-spec/        # OpenAPI 3.1 YAML spec
  api-zod/         # Zod schemas (generated from OpenAPI)
  api-client-react/# TanStack React Query hooks
```

## Quick Start

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Type-check the entire monorepo
pnpm run typecheck

# 3. Build all packages
pnpm run build
```

## Environment Variables

Copy the example env files and fill in your values:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
cp lib/db/.env.example lib/db/.env
```

| Variable       | Description                      | Default                                              |
|----------------|----------------------------------|------------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string     | `postgres://user:password@localhost:5432/uid_manager`|
| `PORT`         | API server port                  | `3000`                                               |

## Development

```bash
# Start the API server (with hot reload)
pnpm dev:api

# Start the frontend (Vite dev server)
pnpm dev:ui
```

- API server: <http://localhost:3000>
- Health check: <http://localhost:3000/api/healthz>
- Frontend: <http://localhost:5173> (proxies `/api` to the API server)

## API Endpoints

| Method | Path              | Description             |
|--------|-------------------|-------------------------|
| GET    | `/api/healthz`    | Health check            |
| POST   | `/api/track`      | Track a UID event       |
| GET    | `/api/admin/logs` | Paginated activity logs |
| GET    | `/api/admin/stats`| Aggregate statistics    |

## Tech Stack

- **Runtime**: Node.js 24, pnpm workspaces
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, Zod
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, TanStack Query v5
- **Tooling**: TypeScript 5 (composite projects), esbuild
