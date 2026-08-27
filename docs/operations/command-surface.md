---
type: operations-guide
title: "Command Surface"
description: "Operations guidance for Command Surface."
okf_version: "0.1"
---
# Command Surface

## Purpose
Define the public developer command surface for the licitai/Twenty monorepo. Every command that an engineer or AI agent should use during development, testing, and operations is documented here.

## Primary Audience
Engineers, AI agents, and reviewers working on the Twenty codebase.

## Executive Summary
The repository exposes a structured command surface through Docker Compose, Nx targets, and Yarn scripts. The existing full Docker Compose project is the canonical local runtime; Nx/Yarn remain package-level source tooling and explicitly advanced host-source surfaces. The command surface is organized into development, testing, code quality, build, database, GraphQL code generation, and documentation operations.

## Public Command Contract

### Development Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `just runtime-check` | Verify the existing full local runtime | **First runtime command. Read-only:** validates Compose config, prints current service state, and checks `/healthz` without starting or creating containers. |
| `just dev-up` | Explicitly start the full local runtime | Human-authorized recovery path. Uses the image selected by `.env`, does not build or pull it, and waits for service health. |
| `just dev-up-build` | Explicitly rebuild and start full local runtime | Human-authorized path after source changes. Compose builds and starts the same image tag, then waits for service health. |
| `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml up -d` | Explicitly start full local runtime directly | Same canonical Compose project; use only when a human has requested a state-changing startup. |
| `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml ps` | Inspect local runtime | Shows service state and health. |
| `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml logs -f server worker` | Follow application logs | Use for startup and ingestion diagnosis. |
| `docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml down` | Stop local runtime | Stops the Compose project without deleting named volumes. |
| `yarn start` | Advanced host-source runtime | Legacy host-local Nx path; not the default local runtime. Use only when explicitly required. |
| `just ci-infra-up` | Legacy alternate CI infrastructure | Blocked by default because it creates a second Compose/ClickHouse stack. Requires `ALLOW_EXTRA_CONTAINERS=1` and explicit human authorization. |

Mercado Publico fixture tests use only project `twenty-mp-e2e`, provisioned by
`packages/twenty-e2e-testing/scripts/provision-mercado-publico-e2e.mjs`. The provisioner
owns prepare, status, and reset. It rejects the canonical project. Use `docker
compose exec` for commands in an active service; do not use `docker compose
run`, which creates a one-off container.

Use the Nx targets `test:mercado-publico:ui-contract`,
`test:mercado-publico:journeys`, `test:mercado-publico:roles`,
`test:mercado-publico:extended`, `test:mercado-publico`, and
`test:mercado-publico:release-gate`. Lifecycle targets add
`test:mercado-publico:{prepare,status,reset,clean}`. Suite targets accept
`--configuration=warm` after prepare. Warm runs do not build and keep the stack.
The aggregate provisions once, invokes Playwright once, and always cleans up.
The release gate runs backend proof first and stays fresh in CI.

Run `just runtime-check` before any runtime, API, or integration diagnosis. If it
fails, report the existing stack's state; do not silently switch to host-local
services, `docker-compose.dev.yml`, `docker run`, or a new Compose project.
`TAG` selects the image for both Compose build and runtime. The local example
uses `mp-local`. `PLATFORM` defaults to `linux/amd64`.

Build time depends on hardware and cache state. The 2026-08-22 Windows and
Docker Desktop verification took 7 min 21 s with 36% cached after Dockerfile
and context changes. An unchanged rebuild and healthy startup took 20 s. Use
these values as a local reference, not as an SLA.

### Testing Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `npx jest path/to/test.test.ts --config=packages/PROJECT/jest.config.mjs` | Run single test file (preferred) | Fastest path for active development. Replace `PROJECT` with the package name. |
| `npx nx test twenty-front` | Run all frontend unit tests | Jest with coverage summary. |
| `npx nx test twenty-server` | Run all backend unit tests | Jest with coverage summary. |
| `npx nx run twenty-server:test:integration:with-db-reset` | Run integration tests | Resets database before running. Requires PostgreSQL. |
| `npx nx storybook:build twenty-front` | Build Storybook | Generates static Storybook site for visual testing. |
| `npx nx storybook:test twenty-front` | Run Storybook tests | Vitest-based story tests with coverage. |
| `cd packages/twenty-server && npx jest "pattern"` | Run tests matching pattern | Run specific test pattern within a package directory. |
| `cd packages/twenty-server && npx jest --testPathPattern="pattern"` | Run tests matching path pattern | Alternative pattern matching syntax. |

### Code Quality Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `npx nx lint:diff-with-main twenty-front` | Lint changed files (preferred) | Lints only files changed vs `main` branch. Fastest lint path for PRs. Uses oxlint + oxfmt. |
| `npx nx lint:diff-with-main twenty-server` | Lint changed files (preferred) | Same for backend. |
| `npx nx lint:diff-with-main <package> --configuration=fix` | Auto-fix lint issues | Applies oxlint --fix and oxfmt to changed files. |
| `npx nx lint twenty-front` | Full lint | Lints all files in the package. Slower; use only when necessary. |
| `npx nx lint twenty-server` | Full lint | Same for backend. |
| `npx nx typecheck twenty-front` | TypeScript type check | Runs `tsgo` on the package. |
| `npx nx typecheck twenty-server` | TypeScript type check | Same for backend. |
| `npx nx fmt twenty-front` | Format check | Runs `oxfmt --check` on all files. |
| `npx nx fmt twenty-front --configuration=fix` | Format apply | Applies oxfmt formatting to all files. |

### Build Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `npx nx build twenty-shared` | Build foundation library | Must build first. All other packages depend on it. |
| `npx nx build twenty-ui` | Build design system | Must build before `twenty-front`. |
| `npx nx build twenty-server` | Build backend | Compiles NestJS application. |
| `npx nx build twenty-front` | Build frontend | Builds React SPA with Vite. |
| `npx nx run-many -t build` | Build all packages | Builds everything in dependency order (Nx computes automatically). |

### Database Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `npx nx database:reset twenty-server` | Reset database | Truncates, migrates, and seeds the database. Destructive — wipes all data. |
| `npx nx run twenty-server:database:init:prod` | Initialize production database | Runs initial schema setup for production. |
| `npx nx run twenty-server:database:migrate:prod` | Run production migrations | Runs pending instance commands (fast only). |
| `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast\|slow>` | Generate instance command | Creates a new instance command file. `fast` = schema only. `slow` = schema + data migration. |
| `npx nx run twenty-server:database:migrate:generate --name <name> --type fast` | Generate fast instance command | Schema changes only (TypeORM migration). |
| `npx nx run twenty-server:database:migrate:generate --name <name> --type slow` | Generate slow instance command | Schema changes + `runDataMigration()` for data backfills. |

### GraphQL Code Generation

| Command | Purpose | Details |
| --- | --- | --- |
| `npx nx run twenty-front:graphql:generate` | Generate core GraphQL types | Generates typed hooks and fragments from core schema (`/graphql`) into `generated/`. |
| `npx nx run twenty-front:graphql:generate --configuration=metadata` | Generate metadata GraphQL types | Generates typed hooks from metadata schema (`/metadata`) into `generated-metadata/`. |
| `npx nx run twenty-front:graphql:generate --configuration=admin` | Generate admin GraphQL types | Generates typed hooks from admin schema (`/admin-panel`) into `generated-admin/`. |

Set `CODEGEN_SERVER_BASE_URL` only when core codegen must use a source server
that differs from the frontend or E2E runtime URL. The variable has priority
over `REACT_APP_SERVER_BASE_URL` for this command only.

### Documentation Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `yarn docs:generate` | Generate docs JSON | Runs `tsx packages/twenty-docs/scripts/generate-docs-json.ts`. |
| `yarn docs:generate-navigation-template` | Generate nav template | Runs `tsx packages/twenty-docs/scripts/generate-navigation-template.ts`. |
| `yarn docs:generate-paths` | Generate doc paths | Runs `tsx packages/twenty-docs/scripts/generate-documentation-paths.ts`. |

## Command-Surface Rules

1. **Prefer `lint:diff-with-main` over full `lint`.** Linting only changed files is significantly faster and catches the same issues for PR work. Full lint is available for rare cases.
2. **Build `twenty-shared` first.** Every other package depends on it. Nx handles this automatically via `dependsOn: ["^build"]`, but if building manually, build `twenty-shared` before any consumer.
3. **`twenty-oxlint-rules` must build before any lint target.** All lint commands depend on `twenty-oxlint-rules:build`. Nx enforces this automatically.
4. **Generate instance commands after entity changes.** Any change to entity files (entity classes, field definitions, relationships) requires a new instance command via `database:migrate:generate`.
5. **Generate GraphQL types after schema changes.** Any change to GraphQL resolvers, object types, or field definitions in `twenty-server` requires running the corresponding `graphql:generate` command.
6. **Test single files during development.** `npx jest path/to/test.test.ts --config=...` is the recommended path. Full `npx nx test` is for CI or pre-merge verification.
7. **Use `lint:diff-with-main` and `typecheck` before committing.** Minimum pre-commit verification: lint changed files + typecheck. Tests can follow.
8. **Never delete or rewrite committed instance command logic.** Instance commands are immutable once committed. Write new commands for further changes.

## CI Contract

The CI surface in `.github/workflows/` currently contains 22 workflow files.
Deployment and promotion CD workflows are not part of this repository contract;
each workflow owns its applicable checks.

Common CI checks include:

1. **Per-package validation** — `lint` (oxlint + oxfmt), `typecheck` (tsgo), `test` (Jest/Vitest), and `build` where the package workflow requires them.
2. **Integration and E2E** — Server integration, Playwright E2E, SDK, app, and Docker Compose checks where their workflow scope requires them.
3. **Documentation and change routing** — Documentation validation and changed-file routing for workflows that opt into those checks.

Key CI characteristics:
- CI uses GitHub Actions service containers for PostgreSQL/Redis, not the `setup-dev-env.sh` script.
- `lint:diff-with-main` is the CI-default lint path for PRs.
- Build caching via Nx speeds up repeated runs.
- Per-package concurrency where dependency graph permits.

For pipeline theory, stage ordering rationale, the justfile CI command
surface, and local DEV/CI mode guidance, see `docs/operations/ci.md`.
The local CI decision is recorded in `docs/decisions/0007-local-ci-surface-via-justfile.md`.

## Database Inspection (Developer Postgres MCP)

`.mcp.json` configures a developer-local PostgreSQL MCP client. It is separate
from the application's authenticated runtime endpoint at `/mcp`; do not use
this file to infer the runtime endpoint's authorization or tool capabilities.

Use the developer client for read-only inspection during development to:
- Inspect workspace data, metadata, and object definitions.
- Verify migration results (columns, types, constraints).
- Explore the multi-tenant schema structure (core, metadata, workspace-specific schemas).
- Debug issues by querying raw data to confirm whether a bug is frontend, backend, or data-level.

For write operations (reset, migrations, sync), use the CLI database commands
above. Access policy and credentials remain environment-specific.

## Current Assumptions

- Nx remains the command orchestration layer; commands are invoked through `npx nx <target> <package>`.
- The existing full Docker Compose project is the primary runtime. `just runtime-check` is the mandatory read-only preflight; `yarn start` is an advanced host-source path.
- Runtime diagnostics never create a second stack. `docker-compose.dev.yml`, `docker run`, and alternate local services are opt-in only through an explicit human authorization.
- `lint:diff-with-main` is the preferred lint strategy for PRs and local development.
- Instance commands remain the authoritative migration mechanism.
- GraphQL codegen remains a manual step after schema changes.

## Required Inputs

- Confirmed CI contract after any GitHub Actions restructure.
- Confirmed database command behavior after any migration system changes.
- Exact test scope for `test:integration:with-db-reset` if integration surface expands.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| `justfile` wrapper | The root `justfile` now provides a CI command surface (`just ci`, `just ci-full`, `just ci-prepush`) mirroring GitHub Actions workflows, plus DEV mode helpers (`just dev-up`, `just dev-down`). Docker service helpers preserved. |
| GraphQL codegen in CI | CI verifies generated types are up to date (fails if not). Codegen remains a manual step executed by the developer after schema changes. |
| `lint:diff-with-main` as default | No. Both `lint:diff-with-main` (fast, preferred for PRs) and `lint` (full, for thorough checks) remain explicit. |

## Open Decisions

- Resolved. `just ci`, `just ci-full`, and `just ci-prepush` provide the unified local CI surface. See `docs/operations/ci.md` and `docs/decisions/0007-local-ci-surface-via-justfile.md`.
