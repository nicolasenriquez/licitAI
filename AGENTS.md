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

## Workspace Routing

`AGENTS.md` at the repository root remains the canonical entrypoint for agent
instructions in this checkout.

Before substantive work:

- Read `index.md`. It is the canonical routing map for this checkout.
- Treat tokens as a first-class budget: prefer the smallest sufficient file set, the shortest sufficient declaration, and the shortest sufficient response that preserves correctness.
- Read the selected surface's local routing files before substantive work. Its local `AGENTS.md` adds to this contract; if repository instructions conflict, follow the closest applicable file.
- If no mapped surface applies, stay on the root contract and state that the surface is unmapped.
- Before a substantive response or edit, briefly declare consulted routing and context files and the selected surface. Use relative paths and include only necessary files.

Mapped surfaces and bounce rules are defined in `index.md`.

## Context Management

- Keep one cohesive task per session.
- Load only context required for current task. Follow repository pointers for detail.
- Treat forgotten constraints, repeated questions, ignored files, unrelated edits,
  or rising correction rate as context degradation.
- Before degradation affects correctness, write a handoff and start a fresh session.
- Handoffs state completed work, current state, decisions, changed files,
  validation, blockers, and next action.
- Token counts are advisory. Use quality signals first. See
  `docs/governance/ai-context-management.md`.

## Communication

- Write user-facing messages and agent-authored operational docs in ASD-STE100 style: use short sentences, active voice, common words, and explicit actions. Avoid idioms, vague language, and unnecessary qualifiers.

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
- `npx nx lint` and `npx nx lint:diff-with-main` both depend on `twenty-oxlint-rules:build`. Nx builds the plugin automatically.

## Safe Defaults

```bash
just runtime-check                              # first runtime command; read-only
cd packages/{pkg} && npx jest "<pattern or filename>"
npx nx lint:diff-with-main <package>              # preferred changed-file lint
npx nx typecheck <package>
```

For the complete command surface, read `docs/operations/command-surface.md`.
For runtime setup and recovery, read `docs/operations/local-development.md`.

### Environment and Secrets

- Agents may inspect `.env` files only for configuration diagnosis. Never reveal, copy, commit, or document their values; report names and redacted values only.
- `npx nx run <package>:reset:env` replaces that package's `.env`. Run it only with explicit authorization to overwrite local configuration. Use `.env.example` for examples and defaults.

## Architecture Overview

### Tech Stack
- **Frontend:** React + TypeScript, Jotai, Linaria (zero-runtime CSS-in-JS), Vite, Apollo Client, Lingui.
- **Backend:** NestJS, TypeORM, PostgreSQL, Redis, BullMQ, GraphQL (code-first via `@nestjs/graphql` + GraphQL Yoga).
- **Monorepo:** Nx workspace, Yarn 4 workspaces.

### Package Routing

For package ownership and leaf-package instructions, read `packages/index.md`.
It is the canonical package map.

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

## Runtime Safety

Use `just runtime-check` before runtime, API, or integration diagnosis. It is
read-only. Use `just dev-up` only with explicit authorization to start the
existing Compose project. Skip runtime checks for tasks that only read code.

For setup, recovery, and CI behavior, read `docs/operations/local-development.md`
and `docs/operations/ci.md`.

## Database Inspection (Postgres MCP)

A read-only Postgres MCP server is configured in `.mcp.json`. Use it to:

- Inspect workspace data, metadata, and object definitions.
- Verify migration results (columns, types, constraints) after running migrations.
- Explore the multi-tenant schema (core, metadata, per-workspace schemas).
- Debug whether a bug is frontend, backend, or data-level by querying raw data.
- Inspect metadata tables when debugging GraphQL schema generation.

Read-only. For writes (reset, migrate, sync), use the Nx targets above.

## Change Authorization

- Do not create commits, pushes, tags, releases, or external messages unless the user explicitly requests them.
- A skill, ticket, or local workflow does not override this rule.
- Preserve pre-existing staged and unstaged changes. Stage only files within the requested scope after authorization.

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or
library/API documentation. Automatically use the Context7 MCP tools to resolve
library IDs and get library docs without waiting for explicit requests.

After code changes, run changed-file lint, typecheck, and relevant tests. For
entity changes, follow `packages/twenty-server/docs/UPGRADE_COMMANDS.md`. For
GraphQL schema changes, follow `docs/operations/command-surface.md` and verify
that generated types are backward compatible.

## graphify

For codebase questions, use the `graphify` skill when it is available. Query
`graphify-out/graph.json` first when it exists. If the result has no relevant
source for the selected surface, state that result and continue through
`AGENTS.md` and `index.md`.

Do not run `graphify update .` automatically. Tell the user to run it manually
if they want to refresh the graph.
