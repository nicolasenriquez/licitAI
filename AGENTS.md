---
type: agent-contract
title: Root Agent Contract
description: Canonical operational entrypoint for agent work in this checkout.
---

# AGENTS.md

This file provides guidance when working with code in this repository.

## Repository Identity

This is the **licitai** fork (`github.com/nicolasenriquez/licitAI`, package name
`licitai`). Internal package directories, decorators, GraphQL types, and the
upstream product references still follow the inherited `twenty-*` naming from
the Twenty monorepo. Do not rename `twenty-*` paths or import specifiers when
working here.

**Engines:** Node `^24.5.0`, yarn `>=4.0.2` (yarn `4.13.0` pinned). npm is
explicitly disabled in `package.json` — never use `npm install` or `package-lock.json`.

## Workspace Routing Pilot

`AGENTS.md` at the repository root remains the canonical entrypoint for agent
instructions in this checkout.

During this routing rollout, use the contract below before acting:

- Start at `AGENTS.md`, then read `index.md` to choose the correct surface.
- Treat tokens as a first-class budget: prefer the smallest sufficient file set, the shortest sufficient declaration, and the shortest sufficient response that preserves correctness.
- Route into `openspec/` for active OpenSpec changes, proposal/design/tasks/spec artifacts, change review, implementation, and archive/sync work.
- Route into `docs/` for repository architecture, business context, governance, operations, standards, and ADR reading or editing.
- Route into `packages/` for package-scoped work and for selecting the right package surface before leaf-package work.
- Route into `.codex/` for repo-local Codex commands, repo-local Codex skills, and local Codex workflow assets.
- Route into `.opencode/` for repo-local OpenCode commands, repo-local OpenCode skills, and local OpenCode workflow assets.
- If a task starts in `docs/` but is really about an active OpenSpec change, return to the root map and reroute into `openspec/`.
- If a task starts in `openspec/` but is really about architecture, governance, or other repo docs, return to the root map and reroute into `docs/`.
- If a task starts in `packages/` but is really about root docs or OpenSpec change work, return to the root map and reroute.
- If a task starts in `.codex/` but is really about the published plugin package or another mapped surface, return to the root map and reroute.
- If a task starts in `.opencode/` but is really about repo-local Codex assets, published plugin work, or another mapped surface, return to the root map and reroute.
- Do not invent folder-local routing rules for unmapped leaf surfaces during rollout. If the task is outside the mapped surfaces, stay on the root contract, state explicitly that the surface is unmapped, and do not wander.
- Only when required, declare consulted routing/context files briefly using relative paths. Include only the files actually needed for the task, then state the selected surface.

## Repository Path Style

- In user-facing responses, refer to files inside this repository using repository-relative paths by default.
- If a clickable markdown file link requires an absolute path in the link target, keep the visible link label repository-relative and use the absolute path only in the target.
- Do not print raw absolute filesystem paths in prose unless the user explicitly asks for them or the path is outside this repository.

Preferred:
[packages/twenty-server/src/foo.ts](/absolute/path/to/repo/packages/twenty-server/src/foo.ts:12)

Avoid:
`C:\Users\...`
`/Users/...`
in normal prose when the file is inside this repository.

## Fast Path

- Docs or routing task: `AGENTS.md` -> `index.md` -> selected surface files.
- Library, setup, or API-doc task: use Context7 when relevant.
- Codebase question: use `graphify` first when available.

## Toolchain

- **Linter:** `oxlint` (server uses `--type-aware`). `eslint` is not used.
- **Formatter:** `oxfmt`. `prettier` is not used (root `prettier` block in `package.json` is historical).
- **Typechecker:** `tsgo` (TypeScript native Go preview), not `tsc`.
- **Build/test runner:** Nx 22 + `@nx/jest` + Vite.
- `npx nx lint` and `npx nx lint:diff-with-main` both `dependsOn: ["twenty-oxlint-rules:build"]` — on a fresh clone, run `npx nx build twenty-oxlint-rules` once before linting, or the first lint will fail with a missing plugin error.

## Key Commands

### Development
```bash
yarn start                                       # server + front + worker, concurrent
npx nx start twenty-front                        # frontend dev server
npx nx start twenty-server                       # backend dev server
npx nx run twenty-server:worker                  # BullMQ background worker
```

### Testing
```bash
# Single test or pattern (preferred — fastest)
cd packages/{pkg} && npx jest "<pattern or filename>"

# All unit tests for a package
npx nx test twenty-front
npx nx test twenty-server

# Integration tests with DB reset (expensive — full schema rebuild)
npx nx run twenty-server:test:integration:with-db-reset

# Storybook
npx nx storybook:build twenty-front
npx nx storybook:test twenty-front

# UI E2E: log in via "Continue with Email" with the prefilled dev credentials.
```

### Code Quality
```bash
# Lint + format only what changed vs main (fastest, always prefer)
npx nx lint:diff-with-main twenty-front
npx nx lint:diff-with-main twenty-server          # uses scripts/lint-diff-with-main.mjs
npx nx lint:diff-with-main twenty-server --configuration=fix

# Full-package lint
npx nx lint twenty-front
npx nx lint twenty-server

# Typecheck (runs tsgo)
npx nx typecheck twenty-front
npx nx typecheck twenty-server

# Format
npx nx fmt twenty-front
npx nx fmt twenty-server
```

`lint:diff-with-main` is `git diff main...HEAD` for the server
(`scripts/lint-diff-with-main.mjs`) and a `git diff main` for the front.
On feature branches this is the intended behavior — do not "fix" it by
repointing the base.

### Build
```bash
npx nx build twenty-shared   # build first — other packages depend on its dist
npx nx build twenty-front
npx nx build twenty-server
```

### Database
```bash
npx nx database:reset twenty-server                     # truncate + init + seed
npx nx run twenty-server:database:init                  # first-time schema + seeds
npx nx run twenty-server:database:migrate               # run registered instance commands (fast only by default; --include-slow for slow)
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
# ClickHouse
npx nx run twenty-server:clickhouse:migrate
npx nx run twenty-server:clickhouse:seed
```

### GraphQL
```bash
npx nx run twenty-front:graphql:generate                # default: data codegen
npx nx run twenty-front:graphql:generate --configuration=metadata
npx nx run twenty-front:graphql:generate --configuration=admin
npx nx run twenty-front:mock:generate                   # regenerate mock data fixtures
```

### Env
```bash
npx nx run twenty-server:reset:env                      # cp .env.example .env
```

## Architecture Overview

### Tech Stack
- **Frontend:** React + TypeScript, Jotai, Linaria (zero-runtime CSS-in-JS), Vite, Apollo Client, Lingui.
- **Backend:** NestJS, TypeORM, PostgreSQL, Redis, BullMQ, GraphQL (code-first via `@nestjs/graphql` + GraphQL Yoga).
- **Monorepo:** Nx workspace, Yarn 4 workspaces.

### Package Layout
```text
packages/
├── twenty-front/                  # React app
├── twenty-server/                 # NestJS API
├── twenty-shared/                 # Shared types & helpers
├── twenty-ui/                     # Shared UI primitives
├── twenty-emails/                 # React Email templates
├── twenty-sdk/                    # App SDK (defineObject, etc.)
├── twenty-cli/                    # `twenty` CLI (`app:publish`, `workspace:*`)
├── twenty-client-sdk/             # Generated GraphQL client
├── twenty-front-component-renderer/  # remote-dom renderer
├── create-twenty-app/             # `npx create-twenty-app` scaffolder
├── twenty-companion/              # Desktop companion
├── twenty-codex-plugin/           # Published Codex plugin
├── twenty-claude-skills/          # Published Claude skills bundle
├── twenty-zapier/                 # Zapier integration
├── twenty-docker/                 # Compose / Helm / k8s
├── twenty-e2e-testing/            # Playwright suites
├── twenty-utils/                  # Shared dev scripts (setup-dev-env.sh)
├── twenty-oxlint-rules/           # Custom oxlint plugin (built once, then cached)
├── twenty-website/                # Marketing site (legacy Next.js)
├── twenty-website-redone/         # Marketing site (new)
└── twenty-apps/                   # Examples + internal apps (slack, linear, etc.)
```

### Conventions That Differ From Defaults

- **Functional components only.** No class components.
- **Named exports only.** No default exports.
- **Types over interfaces** (except when extending third-party interfaces).
- **String literals over enums** (GraphQL enums excepted).
- **No `any`** — strict TypeScript enforced.
- **No abbreviations** in variable names (`user` not `u`, `fieldMetadata` not `fm`).
- Files kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`).
- Component prop types suffixed `Props` (`ButtonProps`).
- TypeScript generics get descriptive names (`TData` not `T`).
- Use `twenty-shared` helpers instead of manual type guards: `isDefined`, `isNonEmptyString`, `isNonEmptyArray`.
- Styling: **Linaria** only.
- i18n: **Lingui** (run `lingui:extract` / `lingui:compile` targets).

## Database & Upgrade Commands

- Schema changes to entities require a generated **instance command**:
  `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`.
  The generator is not optional.
- **Fast** instance commands handle schema changes; **slow** ones add a `runDataMigration` step for data backfills.
- **Workspace commands** iterate over all active/suspended workspaces.
- Commands are auto-discovered via `@RegisteredInstanceCommand` and `@RegisteredWorkspaceCommand` decorators.
- Always include both `up` and `down` logic. **Never delete or rewrite committed `up`/`down` logic** — append, don't mutate.
- Full rules in `packages/twenty-server/docs/UPGRADE_COMMANDS.md`.

## Dev Environment Setup

```bash
bash packages/twenty-utils/setup-dev-env.sh        # idempotent
# flags:
#   --docker   canonical Docker mode (default; uses packages/twenty-docker/docker-compose.dev.yml)
#   --down     stop services
#   --reset    wipe data and restart fresh
```

Starts Postgres + Redis via Docker Compose (canonical), creates databases,
copies `.env` files, runs migrations. **Skip this for tasks that only read
code** (architecture review, doc edits, code review).

CI (`.github/workflows/`) uses Actions service containers and runs setup
steps individually — it does not call this script.

## Database Inspection (Postgres MCP)

A read-only Postgres MCP server is configured in `.mcp.json`. Use it to:

- Inspect workspace data, metadata, and object definitions.
- Verify migration results (columns, types, constraints) after running migrations.
- Explore the multi-tenant schema (core, metadata, per-workspace schemas).
- Debug whether a bug is frontend, backend, or data-level by querying raw data.
- Inspect metadata tables when debugging GraphQL schema generation.

Read-only. For writes (reset, migrate, sync), use the Nx targets above.

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or
library/API documentation. Automatically use the Context7 MCP tools to resolve
library IDs and get library docs without waiting for explicit requests.

After code changes:

1. `npx nx lint:diff-with-main <pkg>` (and `--configuration=fix` if needed).
2. `npx nx typecheck <pkg>`.
3. `npx nx test <pkg>` — or single-file `cd packages/<pkg> && npx jest "<pattern>"`.
4. For entity changes: generate the instance command (see Database section).
5. For GraphQL schema changes: `npx nx run twenty-front:graphql:generate`, then verify the diff is backward compatible.

## graphify

This project has a knowledge graph at `graphify-out/` with god nodes,
community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"`
before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- Dirty `graphify-out/` files are expected after hooks or incremental updates; not a reason to skip graphify. Only skip if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- Do not run `graphify update .` automatically after code changes — it is too slow and has timed out here. Tell the user to run `graphify update .` manually if they want the graph refreshed.
