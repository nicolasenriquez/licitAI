# Local Development

## Purpose
Define the local-development contract for the Twenty CRM monorepo. This document is prescriptive — it describes how to set up and run the development environment.

## Primary Audience
Engineers and AI agents setting up or extending the repository locally.

## Executive Summary
Twenty provides a one-command setup via `setup-dev-env.sh` that auto-detects Docker vs local services, starts PostgreSQL 16 and Redis 7, creates databases, copies `.env` files, and initializes the database schema. Development services are defined in `docker-compose.dev.yml`. The application stack (NestJS backend + React frontend + BullMQ worker) runs from source using Nx targets.

## Defined Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | ^24.5.0 | Required for all packages |
| Package manager | Yarn | 4.13.0 (Berry) | With Corepack |
| Monorepo tool | Nx | 22.7.5 | Task orchestration |
| Backend | NestJS | 11 | API server on port 3000 |
| Frontend | React | 19 | Vite dev server on port 3001 |
| Worker | BullMQ | — | Background job processor |
| Database | PostgreSQL | 16 | Port 5432 |
| Cache / Queue | Redis | 7 | Port 6379 |
| Containerization | Docker + Docker Compose | — | Infrastructure services |

## Default Local Runtime

| Runtime Path | Position | Details |
| --- | --- | --- |
| Docker (infrastructure) | Canonical path | PostgreSQL 16 + Redis 7 run in Docker Compose. Application runs from source on the host. |
| Host-local services | Fallback path | If PostgreSQL/Redis are already running natively, `setup-dev-env.sh` detects them and skips Docker. |

Rationale:
- Docker ensures reproducible infrastructure services across machines.
- Application code runs from source for fast iteration with hot-reload.

## Setup Script

All dev environments use one idempotent script:

```bash
bash packages/twenty-utils/setup-dev-env.sh
```

This script handles:
1. Starts PostgreSQL + Redis (auto-detects local services vs Docker)
2. Creates required databases
3. Copies `.env` files from `.env.example` templates
4. Initializes the database schema (runs migrations) on a fresh database

Flags:
- `--docker` — Force Docker mode (uses `packages/twenty-docker/docker-compose.dev.yml`)
- `--down` — Stop services
- `--reset` — Wipe data and restart fresh

**Important**: The script is idempotent — safe to run multiple times. Skip the setup script for tasks that only read code (architecture questions, code review, documentation).

**CI note**: GitHub Actions workflows manage services via Actions service containers and run setup steps individually. They do not use this script.

## Docker Compose Baseline

Development infrastructure services from `packages/twenty-docker/docker-compose.dev.yml`:

```bash
# Start infrastructure services
docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d

# Stop services
docker compose -f packages/twenty-docker/docker-compose.dev.yml down

# Stop services and wipe data
docker compose -f packages/twenty-docker/docker-compose.dev.yml down -v
```

| Service | Image | Port | Health Check | Notes |
| --- | --- | --- | --- | --- |
| `db` | `postgres:16` | 5432 | `pg_isready -U postgres -h localhost -d postgres` | Volume: `dev-db-data`. User/password: `postgres/postgres`. Default DB: `default`. |
| `redis` | `redis:7` | 6379 | `redis-cli ping` | Memory policy: `noeviction`. Restart: `unless-stopped`. |

Container-internal database host is service DNS (`db`), not `localhost`. When running the application from the host, connect to `localhost:5432`.

## Environment Configuration

Environment variables are defined in `packages/twenty-docker/.env.example`. Secrets must never be committed to version control. `.env` is gitignored.

| Variable | Required | Purpose |
| --- | --- | --- |
| `TAG` | Yes | Docker image tag (default: `latest`) |
| `SERVER_URL` | Yes | Public server URL (default: `http://localhost:3000`) |
| `PG_DATABASE_USER` | Optional | PostgreSQL user (default: `postgres`) |
| `PG_DATABASE_PASSWORD` | Optional | PostgreSQL password |
| `PG_DATABASE_HOST` | Optional | PostgreSQL host (default: `db` for Docker) |
| `PG_DATABASE_PORT` | Optional | PostgreSQL port (default: `5432`) |
| `REDIS_URL` | Optional | Redis connection URL (default: `redis://redis:6379`) |
| `ENCRYPTION_KEY` | Optional | Encryption key for secrets. Generate with: `openssl rand -base64 32` |
| `FALLBACK_ENCRYPTION_KEY` | Optional | Previous encryption key during rotation |
| `APP_SECRET` | Optional | Legacy: only for instances pre-dating ENCRYPTION_KEY |
| `STORAGE_TYPE` | Yes | Storage backend (default: `local`) |
| `STORAGE_S3_REGION` | Optional | S3 region (when `STORAGE_TYPE=s3`) |
| `STORAGE_S3_NAME` | Optional | S3 bucket name |
| `STORAGE_S3_ENDPOINT` | Optional | S3 endpoint URL |
| `STORAGE_S3_ACCESS_KEY_ID` | Optional | S3 access key |
| `STORAGE_S3_SECRET_ACCESS_KEY` | Optional | S3 secret key |

## Startup Sequence

### Full stack (recommended)

```bash
yarn start
```

Runs concurrently:
1. `npx nx start twenty-server` (NestJS, port 3000)
2. `npx nx start twenty-front` (Vite, port 3001)
3. Waits for `tcp:3000`, then starts `npx nx run twenty-server:worker` (BullMQ)

### Individual services

```bash
npx nx start twenty-server          # Backend only, port 3000
npx nx start twenty-front           # Frontend only, port 3001
npx nx run twenty-server:worker     # Worker only
```

### Infrastructure only

```bash
docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d
```

## Local Persistence Baseline

- **PostgreSQL** as the default database.
- Database schemas: `core` (shared metadata), workspace-specific schemas (`workspace_<id>`).
- Schema changes tracked through **instance commands** (`database:migrate:generate`), not ad hoc SQL.
- **Redis** for session caching and BullMQ job queue backing.
- Optional **ClickHouse** for analytics (not required for basic development).

## Backend Baseline

- NestJS application in `packages/twenty-server/`.
- Entry point: `src/main.ts` (HTTP server), `src/queue-worker/queue-worker.ts` (worker).
- Architecture: engine layer (API → core-modules → metadata-modules → TwentyORM).
- GraphQL endpoints: `/graphql`, `/metadata`, `/admin-panel`. REST at `/rest/*`. MCP at `/mcp`.
- Multi-tenant: per-workspace PostgreSQL schemas managed by TwentyORM.

## Frontend Baseline

- React SPA in `packages/twenty-front/`.
- Entry point: `src/index.tsx`.
- State management: Jotai atoms + Apollo Client cache.
- Styling: Linaria zero-runtime CSS-in-JS (styled-components API).
- i18n: Lingui with extract/compile workflow.
- Code generation: three GraphQL codegen configs for typed hooks.

## Pre-Flight Checklist

Before starting development work:

1. Run `bash packages/twenty-utils/setup-dev-env.sh` to ensure infrastructure is running and databases are initialized.
2. Verify PostgreSQL: `docker compose -f packages/twenty-docker/docker-compose.dev.yml ps` shows `healthy`.
3. Verify Redis: `redis-cli ping` returns `PONG`.
4. Run `npx nx database:reset twenty-server` if you need a fresh database with seed data.
5. Run `yarn start` to verify the full stack starts without errors.

## Current Assumptions

- Docker for infrastructure services is the canonical local runtime.
- Full Docker Compose (`docker compose -f docker-compose.yml up --build -d`) is a valid and supported development path for running all services (server, worker, frontend, PostgreSQL, Redis) in containers.
- Application code can also run from source on the host for faster hot-reload iteration. Both paths are supported.
- The `setup-dev-env.sh` script remains the single entry point for environment setup.
- Local development uses `localhost` for service connections; container DNS (`db`, `redis`) for Docker-internal.
- Environment separation stays minimal: development and production are the only required environments.
- Seed data is minimal bootstrap (1 workspace, 1 admin user). Additional data is populated manually.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Fully-containerized development | Full Docker Compose is a supported path. Application code can also run from source on the host for faster iteration. Both are valid. |
| Seed data availability | Minimal bootstrap data (1 workspace, 1 admin user). Data population is manual beyond the bootstrap. |
| Frontend proxy to backend | No. Separate ports (:3000 backend, :3001 frontend) for clear debugging. |

## Open Decisions

- Should there be a pre-built seed dataset for demo or testing scenarios?
- Should the frontend dev server auto-detect the backend port from environment configuration?
