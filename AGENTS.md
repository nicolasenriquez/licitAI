---
type: agent-contract
title: licitai Agent Guide
description: Lean, cross-tool project rules. Load linked references only when the task needs them.
---

# AGENTS.md

## What this is

`licitai` is a Twenty-derived, metadata-driven multi-tenant CRM extended for
Chile's Mercado Público procurement workflow. It is an Nx/Yarn monorepo: React
frontend, NestJS/GraphQL backend, PostgreSQL, Redis, BullMQ, and Docker Compose.
The published package is `licitai`; inherited package paths and imports remain
`twenty-*` and must not be renamed.

## Start here

1. Read `index.md` and choose the mapped surface before substantive work.
2. Read that surface's local `AGENTS.md`/`CONTEXT.md` before editing it.
3. Prefer the smallest sufficient file set, change set, and validation command.

| Surface | Use for |
| --- | --- |
| `openspec/` | Active change proposal, design, tasks, apply, sync, or archive work |
| `docs/` | Durable architecture, business, governance, operations, standards, and ADRs |
| `packages/` | Package selection and all package-scoped code; route through `packages/index.md` first |
| `.agents/` | Canonical harness-agnostic repository skills |
| `.opencode/` | Native OpenCode configuration and plugin runtime |

If the task does not fit a mapped surface, remain root-routed and say so; do
not invent a leaf routing contract. Details: `.agents/references/routing.md`.

## Architecture map

| Path | What lives there and why |
| --- | --- |
| `packages/twenty-front/` | React/Vite browser application: routes, Apollo, Jotai, Lingui, and product UI |
| `packages/twenty-server/` | NestJS API: GraphQL Yoga, TwentyORM/TypeORM, auth, jobs, migrations, and Mercado Público |
| `packages/twenty-shared/` | Cross-package types, guards, constants, and helpers; downstream dependency of core packages |
| `packages/twenty-ui/` | Reusable UI library, tokens, stories, accessibility, and visual testing |
| `packages/twenty-design-tokens/` | Canonical DTCG token source and generated adapters |
| `packages/twenty-docker/` | Compose, Helm, Kubernetes, and local runtime configuration |
| `packages/twenty-e2e-testing/` | Playwright end-to-end tests |
| `openspec/` | Active and archived change artifacts; implementation scope is defined here |
| `docs/` | Durable repository and Mercado Público operational knowledge |
| `.github/workflows/` | CI definitions and their package-specific verification surfaces |

## Ground rules

- Use Node `^24.5.0` and Yarn `4.13.0`; do not run `npm install` or create a
  `package-lock.json`.
- The Docker Compose stack is the default local runtime. Do not use host-local
  Nx start targets as the application runtime.
- Use `oxlint` and `oxfmt`, never ESLint or Prettier, and use Nx `typecheck`
  (tsgo), not `tsc`.
- TypeScript uses named exports, functional components, types over interfaces
  except when extending third-party interfaces, descriptive names, and no `any`.
  Use `twenty-shared` guards instead of reimplementing them.
- Frontend user-facing text uses Lingui; styling in `twenty-front` uses
  Linaria. Keep reusable UI work in `twenty-ui`, not app-specific modules.
- Build `twenty-shared` before dependents. Treat a shared-contract change as
  cross-package work and validate consumers.
- Backend schema changes require a generated immutable instance command with
  both `up` and `down`; never edit committed migration logic. GraphQL contract
  changes require frontend code generation and backward-compatibility review.
- Mercado Público secrets stay only in `packages/twenty-docker/.env`. The
  deployment-local `mp` schema is public procurement reference data, never
  tenant CRM data. Keep ingestion writes CLI-only unless an OpenSpec change
  explicitly expands that boundary.
- For codebase questions, use Graphify first when `graphify-out/graph.json`
  exists; do not run `graphify update .` automatically.
- Use Context7 for library/API documentation, setup, or configuration work.

## Working principles

- Plan non-trivial work before editing; keep the plan and patch proportional to
  risk.
- Resolve ambiguity from repository evidence first; ask rather than guessing
  when it changes scope, behavior, or authority.
- Keep scope tight. Do not refactor adjacent code or broaden a contract without
  an explicit need.
- Diagnose with observable evidence, state the root cause and blast radius, and
  make the smallest safe repair.
- Verify with the narrowest relevant checks first, then expand only when the
  change's risk or contract requires it.

## Commands

```bash
# Install and local runtime
yarn install
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml up -d

# Focused validation (prefer these over full workspace checks)
npx nx lint:diff-with-main twenty-front
npx nx lint:diff-with-main twenty-server
npx nx typecheck twenty-front
npx nx typecheck twenty-server
cd packages/<package> && npx jest "<pattern-or-file>"

# Package-wide and build checks
npx nx test twenty-front
npx nx test twenty-server
npx nx build twenty-shared
npx nx build twenty-front
npx nx build twenty-server
```

On a fresh clone, build `twenty-oxlint-rules` once before linting. Use the
documented server diff base; do not repoint `lint:diff-with-main` to hide a
feature-branch diff. Detailed validation and migration commands:
`.agents/references/validation.md`.

## Where new code goes

- Backend transport, services, persistence, jobs, and Mercado Público adapters:
  `packages/twenty-server/src/`.
- Product routes, GraphQL documents/hooks, local UI state, and app-level pages:
  `packages/twenty-front/src/`.
- Shared types or guards used by more than one package:
  `packages/twenty-shared/src/`.
- Generic components, tokens, stories, or a11y behavior:
  `packages/twenty-ui/src/` or `packages/twenty-design-tokens/src/`.
- A change's intended behavior and remaining work: its own
  `openspec/changes/<change>/` artifacts, before implementation.

## On-demand references

- `.agents/references/routing.md` — routing precedence and local-contract rules.
- `.agents/references/validation.md` — test, lint, typecheck, build, GraphQL,
  and migration commands.
- `.agents/references/mercado-publico.md` — ingestion boundary, source data,
  `mp` data model, and operational constraints.
- `docs/operations/local-development.md` — runtime setup.
- `packages/twenty-server/docs/UPGRADE_COMMANDS.md` — instance-command rules.

Treat `AGENTS.md` as living documentation. Run the repository's
`rules-check-drift` skill before merging a change that materially alters these
invariants or the architecture map.
