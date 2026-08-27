---
type: operations-guide
title: "Local Development"
description: "Operations guidance for Local Development."
okf_version: "0.1"
---
# Local Development

## Purpose
Define the local-development contract for the Twenty CRM monorepo. This document is prescriptive — it describes how to set up and run the development environment.

## Primary Audience
Engineers and AI agents setting up or extending the repository locally.

## Executive Summary
The existing full Docker Compose project is the local runtime contract. Agents and
routine diagnostics begin with the read-only `just runtime-check` preflight. The
repository must not silently fall back to host services, `docker-compose.dev.yml`,
or a newly-created container stack.

## Defined Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | ^24.5.0 | Required for all packages |
| Package manager | Yarn | 4.13.0 (Berry) | With Corepack |
| Monorepo tool | Nx | 22.7.7 | Task orchestration |
| Backend | NestJS | 11 | API server on port 3000 |
| Frontend | React | 19 | Vite dev server on port 3001 |
| Worker | BullMQ | — | Background job processor |
| Database | PostgreSQL | 16 | Internal in the canonical Compose project |
| Cache / Queue | Redis | 7 | Internal in the canonical Compose project |
| Containerization | Docker + Docker Compose | — | Full application runtime |

## Default Local Runtime

| Runtime Path | Position | Details |
| --- | --- | --- |
| Full Docker Compose | Canonical path | Server, worker, PostgreSQL, and Redis run in the existing Compose project. |
| Host-source / infrastructure-only | Explicit exception | Only when a human authorizes a source-runtime or CI reproduction that the existing stack cannot provide. |

Rationale:
- Docker ensures reproducible infrastructure services across machines.
- Application code runs from source for fast iteration with hot-reload.

## Setup Script

The compatibility script is now a read-only health check:

```bash
bash packages/twenty-utils/setup-dev-env.sh
```

It validates the full Compose configuration, confirms the four existing services
are already running, checks PostgreSQL/Redis readiness, and probes `/healthz`.
It never starts, stops, removes, rebuilds, or creates a container, and it never
creates `.env` files. For a state-changing startup, use `just dev-up` only after
explicit human authorization.

**Important**: The script is intentionally safe to run repeatedly. Skip it for
tasks that only read code (architecture questions, code review, documentation).

**CI note**: GitHub Actions workflows manage services via Actions service containers and run setup steps individually. They do not use this script.

## Docker Compose Baseline

The canonical local runtime is `packages/twenty-docker/docker-compose.yml`:

```bash
# Inspect the existing full runtime (read-only)
just runtime-check

# Follow application logs
docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml logs -f server worker

# Explicitly start the existing project only when authorized
just dev-up

# Rebuild the configured image and start the project only when authorized
just dev-up-build
```

| Service | Image | Port | Health Check | Notes |
| --- | --- | --- | --- | --- |
| `server` | `twentycrm/twenty:latest` | 3000 | `/healthz` | Compiled API and frontend runtime. |
| `worker` | `twentycrm/twenty:latest` | — | Compose running state | BullMQ worker using the same image. |
| `db` | `postgres:16` | internal | `pg_isready` | Managed by the existing Compose project. |
| `redis` | `redis:7` | internal | `redis-cli ping` | Managed by the existing Compose project. |

`docker-compose.dev.yml` is not a routine development path. It is an alternate
infrastructure-only stack and is blocked by the command surface unless a human
explicitly authorizes `ALLOW_EXTRA_CONTAINERS=1` for a CI reproduction.

Build time depends on the machine and cache state. The 2026-08-22 verification
on Windows with Docker Desktop took 7 min 21 s after Dockerfile and build-context
changes, with 36% of steps cached. The next unchanged `just dev-up-build` took
20 s, including the healthy startup. These measurements are a reference, not
a fixed limit.

## Local Port Ownership

| Owner | Published ports | Rule |
| --- | --- | --- |
| Canonical Compose | 3000 | Routine local runtime only. |
| Playwright preview | 3001 | Generic E2E only. |
| Server integration | 4000, 4317 | Test-owned listeners. Do not share them with observability tools. |
| Mercado Publico E2E | Docker-assigned | Query with `docker compose ... port server 3000`. |
| Alternate CI infrastructure | 5432, 6379, 8123, 9000 | Run only through the explicitly authorized CI mode. |

## Mercado Publico isolated E2E fixture

The only local exception is the Mercado Publico fixture project
`twenty-mp-e2e`. Its provisioner owns the project, database, and Redis for
disposable E2E data. It must not use the canonical `twenty` project or any
other project name.

Run the provisioner from `packages/twenty-e2e-testing`. If its server is
already running, inspect it or clean it explicitly before a new provision:

```powershell
docker compose -p twenty-mp-e2e --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml -f packages/twenty-docker/docker-compose.e2e.yml down --volumes --remove-orphans
```

Use `docker compose exec` to run a command in an active service. Do not use
`docker compose run`; it creates a one-off container.

Container-internal database host is service DNS (`db`), not `localhost`. Use
`localhost:5432` only when the explicitly authorized alternate CI
infrastructure is active.

## Environment Configuration

Environment variables are defined in `packages/twenty-docker/.env.example`. Secrets must never be committed to version control. `.env` is gitignored.

| Variable | Required | Purpose |
| --- | --- | --- |
| `TAG` | Yes | Docker image tag used for both build and runtime (local example: `latest`) |
| `PLATFORM` | Optional | Container platform (default: `linux/amd64`) |
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
just runtime-check
```

This checks the already-running full Compose stack. It does not start or create
containers. If the check fails, inspect `just dev-status` and `just dev-logs`;
use `just dev-up` only as an explicitly authorized recovery action.

### Individual services (advanced host-source exception)

```bash
# Run just runtime-check first. These commands do not replace the Compose runtime.
npx nx start twenty-server          # Backend only, port 3000
npx nx start twenty-front           # Frontend only, port 3001
npx nx run twenty-server:worker     # Worker only
```

### Infrastructure only

```bash
# Not a default path. Use the existing full Compose runtime instead.
just runtime-check
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

1. Run `just runtime-check` (or the read-only `setup-dev-env.sh --check`).
2. Verify the existing Compose services and `/healthz` are healthy.
3. Run `npx nx database:reset twenty-server` only when a destructive reset is explicitly required.
4. Use host Nx/Yarn commands for source-only lint, typecheck, and unit tests; they do not replace the runtime preflight.

## Current Assumptions

- Full Docker Compose is the canonical local runtime for all services (server, worker, frontend, PostgreSQL, Redis).
- Application source checks may run on the host when the runtime image does not contain Nx/Jest/tsgo; this does not authorize a second runtime stack.
- The `setup-dev-env.sh` script is a read-only compatibility check, not an environment provisioner.
- `docker-compose.dev.yml`, host-local services, and ad hoc `docker run` containers are explicit exceptions only.
- Local development uses `localhost` for service connections; container DNS (`db`, `redis`) for Docker-internal.
- Environment separation stays minimal: development and production are the only required environments.
- Seed data is minimal bootstrap (1 workspace, 1 admin user). Additional data is populated manually.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Docker-first development | The existing full Docker Compose project is the default and must be checked first. Source-only tooling is a separate, non-runtime lane. |
| Seed data availability | Minimal bootstrap data (1 workspace, 1 admin user). Data population is manual beyond the bootstrap. |
| Frontend proxy to backend | No. Separate ports (:3000 backend, :3001 frontend) for clear debugging. |

## Open Decisions

- Should there be a pre-built seed dataset for demo or testing scenarios?
- Should the frontend dev server auto-detect the backend port from environment configuration?
