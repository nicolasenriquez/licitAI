# Command Surface

## Purpose
Define the public developer command surface for the Twenty CRM monorepo. Every command that an engineer or AI agent should use during development, testing, and operations is documented here.

## Primary Audience
Engineers, AI agents, and reviewers working on the Twenty codebase.

## Executive Summary
Twenty exposes a structured command surface through Nx targets and Yarn scripts. There is one root-level entry point (`yarn start`) for the full stack, plus per-package Nx targets for granular workflows. The command surface is organized into six categories: development, testing, code quality, build, database, and GraphQL code generation.

## Public Command Contract

### Development Commands

| Command | Purpose | Details |
| --- | --- | --- |
| `yarn start` | Start full development stack | Starts `twenty-server` (port 3000) + `twenty-front` (port 3001) concurrently, then starts the BullMQ worker once the server is ready. Uses `concurrently` + `wait-on`. |
| `npx nx start twenty-server` | Start backend only | NestJS API server on port 3000. Hot-reload enabled. |
| `npx nx start twenty-front` | Start frontend only | Vite dev server. Serves the React SPA. |
| `npx nx run twenty-server:worker` | Start background worker | BullMQ queue worker process. Requires Redis and PostgreSQL running. |
| `docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d` | Start infrastructure services | PostgreSQL 16 + Redis 7 only. For development against source code. |

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

The CI pipeline in `.github/workflows/` enforces the following stage order across 40+ workflow files:

1. **Secret scan** — Gitleaks detects secrets before any code runs.
2. **Per-package CI** — Each package runs independently: `lint` (oxlint + oxfmt), `typecheck` (tsgo), `test` (Jest/Vitest), `build`.
3. **Integration & E2E** — Integration tests (`test:integration:with-db-reset`) and Playwright E2E tests run against the full stack.

Key CI characteristics:
- CI uses GitHub Actions service containers for PostgreSQL/Redis, not the `setup-dev-env.sh` script.
- `lint:diff-with-main` is the CI-default lint path for PRs.
- Build caching via Nx speeds up repeated runs.
- Per-package concurrency where dependency graph permits.

## Database Inspection (Postgres MCP)

A read-only PostgreSQL MCP server is configured in `.mcp.json`. Use it during development to:
- Inspect workspace data, metadata, and object definitions.
- Verify migration results (columns, types, constraints).
- Explore the multi-tenant schema structure (core, metadata, workspace-specific schemas).
- Debug issues by querying raw data to confirm whether a bug is frontend, backend, or data-level.

This server is read-only. For write operations (reset, migrations, sync), use the CLI database commands above.

## Current Assumptions

- Nx remains the command orchestration layer; commands are invoked through `npx nx <target> <package>`.
- The `yarn start` convenience command remains the primary full-stack entry point.
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
| `justfile` or `Makefile` wrapper | No wrapper. `npx nx` is the standard command surface. No additional indirection layer. |
| GraphQL codegen in CI | CI verifies generated types are up to date (fails if not). Codegen remains a manual step executed by the developer after schema changes. |
| `lint:diff-with-main` as default | No. Both `lint:diff-with-main` (fast, preferred for PRs) and `lint` (full, for thorough checks) remain explicit. |

## Open Decisions

- Should there be a single `yarn ci` command that runs the full CI pipeline locally?
