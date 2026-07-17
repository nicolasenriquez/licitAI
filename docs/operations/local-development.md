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
The default local runtime is the complete Docker Compose stack. It runs the
NestJS application (API and frontend), BullMQ worker, PostgreSQL, and Redis in
containers, using `packages/twenty-docker/.env` as the only local runtime
environment file.

## Defined Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | ^24.5.0 | Required for all packages |
| Package manager | Yarn | 4.13.0 (Berry) | With Corepack |
| Monorepo tool | Nx | 22.7.5 | Task orchestration |
| Backend | NestJS | 11 | API server on port 3000 |
| Frontend | React | 19 | Compiled frontend served by the application on port 3000 |
| Worker | BullMQ | — | Background job processor |
| Database | PostgreSQL | 16 | Port 5432 |
| Cache / Queue | Redis | 7 | Port 6379 |
| Containerization | Docker + Docker Compose | — | Complete local runtime |

## Default Local Runtime

| Runtime Path | Position | Details |
| --- | --- | --- |
| Complete Docker Compose | Canonical path | Application (API and frontend), worker, PostgreSQL, and Redis run in containers from `docker-compose.yml`. |
| Host-local Nx services | Not the default path | Use only for an explicitly requested advanced workflow; Compose remains the local runtime path. |

Rationale:
- One Compose project keeps application and infrastructure configuration aligned.
- A single Docker environment file prevents host and container configuration drift.

## Local Compose Setup

Create the single local environment file once:

```bash
test -f packages/twenty-docker/.env || cp packages/twenty-docker/.env.example packages/twenty-docker/.env
```

Fill `MERCADO_PUBLICO_API_TICKET` and `COMPRA_AGIL_API_TICKET` in that file
locally. Do not create or rely on host-level `.env` files for the application.

Start the complete stack with the same explicit environment file:

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml up -d
```

This command automatically builds the final `twenty` target for `server` and
`worker`. The `server` container serves both the API and compiled frontend at
`http://localhost:3000`; no separate frontend service or `--build` flag is
required.

Useful lifecycle commands:

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml ps
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml logs -f server worker
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml down
```

The Compose file waits for healthy PostgreSQL and Redis before starting the
application services. Skip environment startup for tasks that only read code
(architecture questions, code review, documentation).

**CI note**: GitHub Actions workflows manage services via Actions service containers and run setup steps individually. They do not use this script.

## Docker Compose Baseline

The complete local runtime is defined in
`packages/twenty-docker/docker-compose.yml`:

```bash
# Start the complete application and infrastructure stack
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml up -d

# Stop the complete stack
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml down

# Validate configuration without printing resolved values
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml config --quiet
```

| Service | Image | Port | Health Check | Notes |
| --- | --- | --- | --- | --- |
| `server` | `twentycrm/twenty:${TAG}` (`twenty` build target) | 3000 | `GET /healthz` and `/` | API and compiled frontend; depends on healthy `db` and `redis`. |
| `worker` | `twentycrm/twenty:${TAG}` | — | Depends on healthy `server` | BullMQ worker; shares server local storage. |
| `db` | `postgres:16` | 5432 | `pg_isready` | Persistent volume: `db-data`. |
| `redis` | `redis` | — | `redis-cli ping` | Memory policy: `noeviction`. |

### Optional advanced infrastructure-only mode

`packages/twenty-docker/docker-compose.dev.yml` starts only PostgreSQL and
Redis. Keep it for advanced workflows that intentionally run application
source on the host or isolate infrastructure debugging; it is not the local
runtime default.

```bash
docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d
docker compose -f packages/twenty-docker/docker-compose.dev.yml down
```

Container-internal database and Redis hosts are service DNS names (`db` and
`redis`), not `localhost`.

## Environment Configuration

Environment variables are defined in `packages/twenty-docker/.env.example` and
the only local runtime file is `packages/twenty-docker/.env`. Secrets must
never be committed to version control; `.env` is gitignored.

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
| `MERCADO_PUBLICO_API_TICKET` | Optional | Mercado Público API ticket |
| `COMPRA_AGIL_API_TICKET` | Optional | Compra Ágil API ticket |

## Startup Sequence

Start the complete stack through Docker Compose:

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml up -d
```

Compose starts PostgreSQL and Redis first, then the server and worker. Inspect
`docker compose ... ps` and logs when diagnosing startup.

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

1. Ensure `packages/twenty-docker/.env` exists and contains the local tickets.
2. Validate Compose: `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml config --quiet`.
3. Start the stack with `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml up -d`.
4. Verify service health: `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml ps` and `curl http://localhost:3000/healthz`.

## Current Assumptions

- Full Docker Compose is the canonical and default local runtime for the application (API and frontend), worker, PostgreSQL, and Redis.
- `packages/twenty-docker/.env` is the only local runtime environment source.
- `docker-compose.dev.yml` remains available only as optional infrastructure for advanced host-source workflows.
- Local development uses container DNS (`db`, `redis`) for Docker-internal connections.
- Environment separation stays minimal: development and production are the only required environments.
- Seed data is minimal bootstrap (1 workspace, 1 admin user). Additional data is populated manually.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Fully-containerized development | Full Docker Compose is the default and supported local runtime. |
| Seed data availability | Minimal bootstrap data (1 workspace, 1 admin user). Data population is manual beyond the bootstrap. |
| Local runtime source | `packages/twenty-docker/.env` is the sole local runtime environment file. |

## Open Decisions

- Should there be a pre-built seed dataset for demo or testing scenarios?
- Should the frontend dev server auto-detect the backend port from environment configuration?
