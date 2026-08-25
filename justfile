# =============================================================================
# justfile — licitai
# =============================================================================
# Sections: DEV (app runtime) | CI (GitHub Actions mirror) | DOCKER helpers
#
# Daily use:
#   just runtime-check       verify existing full app stack (read-only)
#   just dev-up              start full app stack (cached image, auto-migrates)
#   just dev-up-build        start full app stack (rebuild image first)
#   just dev-down            stop app stack
#   just ci-prepush          gate + static + build + test (~8 min)
#   just ci                  static + build + test (commit-build, ~8 min)
#   just ci-full             ci + security + integration (~18 min, needs infra)
#   just ci-infra-up         start PostgreSQL + Redis + ClickHouse for CI
#   just ci-infra-down       stop CI infrastructure
#
# Routine runtime: docker-compose.yml — existing app (server occupies :3000).
# Legacy CI infrastructure uses docker-compose.dev.yml plus ClickHouse, creates
# a second stack, and is blocked unless explicitly authorized.
#
# Docs: docs/operations/ci.md
# =============================================================================

set windows-shell := ["cmd.exe", "/C"]

PLATFORM := "linux/amd64"
DOCKER_NETWORK := "twenty_network"
COMPOSE_APP := "packages/twenty-docker/docker-compose.yml"
COMPOSE_DEV := "packages/twenty-docker/docker-compose.dev.yml"
ENV_FILE := "packages/twenty-docker/.env"

_default:
    @just --list --unsorted

# ═════════════════════════════════════════════════════════════════════════════
# DEV — app runtime (your current workflow, wrapped)
# ═════════════════════════════════════════════════════════════════════════════

# Start full app stack with cached image. Migrations run automatically on
# server boot (instance commands are forward-only and immutable by design).
dev-up: _ensure-env-file
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} up --detach --no-build --pull never --wait --wait-timeout 300
    @echo === Stack ready and healthy. ===

# Build the configured local image and start the full app stack. The first
# build varies by hardware; an unchanged rebuild uses Docker's layer cache.
dev-up-build: _ensure-env-file
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} up --detach --build --pull never --wait --wait-timeout 300
    @echo === Stack rebuilt and ready. Server healthy. ===

# Stop app stack
dev-down:
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} down

# Follow app logs
dev-logs:
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} logs -f server worker

# Show app stack status
dev-status:
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} ps

# Verify the already-running full app stack without changing Docker state.
# This is the first runtime command for agents and routine diagnostics.
runtime-check: _ensure-env-file
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} config --quiet
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} ps
    npx wait-on http://localhost:3000/healthz --timeout 5000
    @echo === Existing full Compose runtime is healthy; no containers were changed. ===

# Verify the Docker-first command/documentation contract without Docker access.
docs-runtime-check:
    powershell -NoProfile -File scripts/check-docker-first-docs.ps1

# ═════════════════════════════════════════════════════════════════════════════
# CI — META-COMMANDS
# ═════════════════════════════════════════════════════════════════════════════

# Minimum pre-push verification
ci-prepush: ci-gate ci-check ci-build ci-test

# Standard local CI pipeline (commit-build: no server needed)
ci: ci-check ci-build ci-test

# Full CI including validate + security + integration. Fail before CI work when
# the explicitly started CI infrastructure or source server is missing.
ci-full: _ensure-installed _ensure-ci-prerequisites ci ci-validate ci-security ci-integration

# All static checks across packages
ci-check: _ensure-installed ci-server-lint ci-front-lint ci-front-typecheck ci-shared ci-ui ci-sdk ci-docs

# Build core packages
ci-build: _ensure-installed ci-server-build ci-front-build

# All unit tests
ci-test: _ensure-installed ci-server-test ci-front-test

# ═════════════════════════════════════════════════════════════════════════════
# CI — STAGE 0: GATE
# ═════════════════════════════════════════════════════════════════════════════

ci-gate:
    yarn --immutable --check-cache
    @(if exist commitlint.config.js (npx commitlint --from origin/main --to HEAD --verbose) else (if exist commitlint.config.mjs (npx commitlint --from origin/main --to HEAD --verbose) else (echo commitlint: no config found, skipping)))

# ═════════════════════════════════════════════════════════════════════════════
# CI — SERVER (mirrors ci-server.yaml)
# ═════════════════════════════════════════════════════════════════════════════

# Mirrors job: server-lint-typecheck
ci-server-lint: _ensure-installed
    npx nx build twenty-oxlint-rules
    npx nx build twenty-shared
    npx nx lint:diff-with-main twenty-server
    npx nx typecheck twenty-server

# Mirrors job: server-build
# Note: _ensure-env copies .env.example only if .env missing (safer than GHA's reset:env overwrite).
ci-server-build: _ensure-installed (_ensure-env "twenty-server")
    npx nx build twenty-oxlint-rules
    npx nx build twenty-shared
    npx nx build twenty-server

# Mirrors job: server-test
ci-server-test: _ensure-installed
    npx nx build twenty-shared
    npx nx test twenty-server

# Mirrors job: server-validation.
# Requires: an explicitly authorized CI infrastructure stack AND a dev server
# started in a SECOND terminal.
#   Terminal 1: set ALLOW_EXTRA_CONTAINERS=1 && just ci-infra-up && npx nx start:ci twenty-server
#   Terminal 2: just ci-server-validate
ci-server-validate: _ensure-pg _ensure-redis _ensure-server-healthy
    @echo === Checking pending migrations ===
    npx nx database:migrate:generate twenty-server -- --name pending-migration-check
    git diff --quiet -- packages/twenty-server/src/database/commands/upgrade-version-command & if errorlevel 1 (echo ERROR: Unexpected migration files were generated. & git diff -- packages/twenty-server/src/database/commands/upgrade-version-command & exit 1)
    @echo === Checking pending codegen ===
    npx nx run twenty-front:graphql:generate
    npx nx run twenty-front:graphql:generate --configuration=metadata
    npx nx run twenty-front:graphql:generate --configuration=admin
    npx nx run twenty-client-sdk:generate-metadata-client
    @echo === Verifying no uncommitted generated changes ===
    git diff --quiet -- packages/twenty-front/src/generated packages/twenty-front/src/generated-metadata packages/twenty-front/src/generated-admin packages/twenty-client-sdk/src/metadata/generated & if errorlevel 1 (echo ERROR: Uncommitted generated changes. Run graphql:generate and commit. & exit 1)

# Mirrors job: server-integration-test (local: single shard; CI: 16 shards)
ci-server-integration: _ensure-pg _ensure-redis _ensure-clickhouse
    npx nx build twenty-shared
    npx nx build twenty-emails
    npx nx build twenty-server
    cmd /C "set NODE_ENV=test&& set ANALYTICS_ENABLED=true&& set CLICKHOUSE_URL=http://default:clickhousePassword@localhost:8123/twenty&& set CLICKHOUSE_PASSWORD=clickhousePassword&& npx nx clickhouse:migrate twenty-server && npx nx clickhouse:seed twenty-server && npx nx run twenty-server:test:integration:with-db-reset"

# Full server pipeline (lint + build + test)
ci-server: ci-server-lint ci-server-build ci-server-test

# ═════════════════════════════════════════════════════════════════════════════
# CI — FRONTEND (mirrors ci-front.yaml)
# ═════════════════════════════════════════════════════════════════════════════

ci-front-lint: _ensure-installed
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx build twenty-oxlint-rules
    npx nx lint:diff-with-main twenty-front

ci-front-typecheck: _ensure-installed
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx typecheck twenty-front

ci-front-test: _ensure-installed
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx test twenty-front

ci-front-build: _ensure-installed (_ensure-env "twenty-front")
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx build twenty-front

# Storybook build (mirrors front-sb-build)
ci-front-sb-build: _ensure-installed (_ensure-env "twenty-front")
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx storybook:build twenty-front

# Storybook tests (mirrors front-sb-test; installs browsers if needed)
ci-front-sb-test: _ensure-installed
    npx playwright install chromium
    npx nx build twenty-shared
    npx nx build twenty-ui
    npx nx storybook:test twenty-front

ci-front: ci-front-lint ci-front-typecheck ci-front-build ci-front-test

# ═════════════════════════════════════════════════════════════════════════════
# CI — SHARED / UI / SDK / DOCS / EMAILS (mirrors their workflows)
# ═════════════════════════════════════════════════════════════════════════════

ci-shared: _ensure-installed
    npx nx build twenty-oxlint-rules
    npx nx lint twenty-shared
    npx nx typecheck twenty-shared
    npx nx test twenty-shared

ci-ui: _ensure-installed
    npx nx build twenty-oxlint-rules
    npx nx build twenty-shared
    npx nx lint twenty-ui
    npx nx typecheck twenty-ui
    npx nx test twenty-ui

ci-sdk: _ensure-installed
    npx nx build twenty-sdk
    npx nx lint twenty-sdk
    npx nx typecheck twenty-sdk
    npx nx run twenty-sdk:test:unit

ci-docs: _ensure-installed
    npx nx lint twenty-docs

ci-emails: _ensure-installed
    npx nx build twenty-emails
    npx nx typecheck twenty-emails
    npx nx lint twenty-emails

# ═════════════════════════════════════════════════════════════════════════════
# CI — VALIDATE (aggregate)
# ═════════════════════════════════════════════════════════════════════════════

# Codegen verification only (migrations omitted — see ci-server-validate).
# Requires: server running from CURRENT SOURCE in a second terminal.
#   IMPORTANT: the server must be npx nx start:ci twenty-server, NOT the
#   dev-up Docker image (which runs stale code). This recipe introspects
#   the running server's GraphQL schema.
#   Terminal 1: set ALLOW_EXTRA_CONTAINERS=1 && just ci-infra-up && npx nx start:ci twenty-server
#   Terminal 2: just ci-validate
ci-validate: _ensure-installed _ensure-server-healthy
    npx nx run twenty-front:graphql:generate
    npx nx run twenty-front:graphql:generate --configuration=metadata
    npx nx run twenty-front:graphql:generate --configuration=admin
    @echo === Verifying no uncommitted generated changes ===
    git diff --quiet -- packages/twenty-front/src/generated packages/twenty-front/src/generated-metadata packages/twenty-front/src/generated-admin & if errorlevel 1 (echo ERROR: Uncommitted generated changes. Run graphql:generate and commit. & exit 1)

# ═════════════════════════════════════════════════════════════════════════════
# CI — SECURITY
# ═════════════════════════════════════════════════════════════════════════════

ci-security:
    @echo === yarn npm audit (HIGH/CRITICAL) ===
    cmd /C "set NODE_OPTIONS=--use-system-ca&& yarn npm audit --severity high"
    @echo === Secret scan of staged changes ===
    docker run --rm --platform {{PLATFORM}} --mount type=bind,source=%CD%,target=/repo,readonly -w /repo ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f git --pre-commit --redact --staged --verbose
    @echo === SBOM ===
    @(if exist node_modules\.bin\cyclonedx-npm.cmd (npx cyclonedx-npm --output sbom.json) else (echo cyclonedx-npm not installed, skipping))

# ═════════════════════════════════════════════════════════════════════════════
# CI — INTEGRATION (aggregate)
# ═════════════════════════════════════════════════════════════════════════════

ci-integration: ci-server-integration

# ═════════════════════════════════════════════════════════════════════════════
# CI — INFRASTRUCTURE (docker-compose.dev.yml + ClickHouse)
# ═════════════════════════════════════════════════════════════════════════════

# Start CI infrastructure: PostgreSQL 16 + Redis 7 (host-exposed) + ClickHouse.
# This creates a second stack and is blocked unless explicitly opted in.
ci-infra-up:
    @(if not defined ALLOW_EXTRA_CONTAINERS (echo ERROR: ci-infra-up creates an alternate Compose/ClickHouse stack. Use 'just runtime-check' for the existing full Compose runtime. Set ALLOW_EXTRA_CONTAINERS=1 only with explicit human authorization. & exit 1))
    @-docker network create {{DOCKER_NETWORK}}
    docker compose -f {{COMPOSE_DEV}} up -d
    @echo === Waiting for PostgreSQL and Redis ===
    npx wait-on tcp:5432 tcp:6379 --timeout 60000
    docker compose -f {{COMPOSE_DEV}} exec -T db psql -U postgres -d postgres -c "CREATE DATABASE \"test\" WITH OWNER postgres;" 2>nul || echo test DB already exists
    @echo === Starting ClickHouse (25.8.8, matches CI) ===
    @-docker rm -f twenty_clickhouse
    docker run -d --network {{DOCKER_NETWORK}} --name twenty_clickhouse -p 8123:8123 -p 9000:9000 -e CLICKHOUSE_PASSWORD=clickhousePassword clickhouse/clickhouse-server:25.8.8
    npx wait-on tcp:8123 --timeout 60000
    @echo === CI infrastructure ready ===

# Stop CI infrastructure
ci-infra-down:
    docker compose -f {{COMPOSE_DEV}} down
    -docker rm -f twenty_clickhouse

# ═════════════════════════════════════════════════════════════════════════════
# PRIVATE HELPERS
# ═════════════════════════════════════════════════════════════════════════════

[private]
_ensure-installed:
    @(if not exist node_modules (echo ERROR: node_modules not found. Run 'yarn install' first. & exit 1) else (echo ok >nul))

[private]
_ensure-env PKG:
    @(if not exist packages\{{PKG}}\.env (copy packages\{{PKG}}\.env.example packages\{{PKG}}\.env >nul & echo {{PKG}}: .env created from example) else (echo {{PKG}}: .env exists, keeping local values))

[private]
_ensure-env-file:
    @powershell -NoProfile -Command "if (-not (Test-Path -LiteralPath '{{justfile_directory()}}\{{ENV_FILE}}')) { Write-Error '{{ENV_FILE}} not found. Copy .env.example to .env first.'; exit 1 }"

[private]
_ensure-pg:
    @npx wait-on tcp:5432 --timeout 5000 2>nul || (echo ERROR: PostgreSQL not reachable on :5432. Run 'just ci-infra-up' first. & exit 1)

[private]
_ensure-redis:
    @npx wait-on tcp:6379 --timeout 5000 2>nul || (echo ERROR: Redis not reachable on :6379. Run 'just ci-infra-up' first. & exit 1)

[private]
_ensure-clickhouse:
    @npx wait-on tcp:8123 --timeout 5000 2>nul || (echo ERROR: ClickHouse not reachable on :8123. Run 'just ci-infra-up' first. & exit 1)

[private]
_ensure-server-healthy:
    @npx wait-on http://localhost:3000/healthz --timeout 5000 2>nul || (echo ERROR: No healthy server on :3000. Start one in another terminal: npx nx start:ci twenty-server & exit 1)

[private]
_ensure-ci-prerequisites: _ensure-pg _ensure-redis _ensure-clickhouse _ensure-server-healthy

# ═════════════════════════════════════════════════════════════════════════════
# DOCKER BUILD
# ═════════════════════════════════════════════════════════════════════════════

prod-build: _ensure-env-file
    docker compose --env-file {{ENV_FILE}} -f {{COMPOSE_APP}} build server
