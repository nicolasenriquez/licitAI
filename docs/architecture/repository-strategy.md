---
type: architecture
title: "Repository Strategy"
description: "Architecture documentation for Repository Strategy."
okf_version: "0.1"
---
# Repository Strategy

## Purpose
Describe how the Twenty CRM monorepo is organized, how packages relate, build order, naming conventions, and the rules that govern repository structure.

## Primary Audience
AI agents, engineers onboarding to the Twenty codebase.

## Executive Summary
Twenty uses an Nx-managed monorepo with Yarn 4 workspaces containing 23 package directories. All packages live under `packages/`. Nx provides task orchestration (build order, caching, parallel execution) while Yarn handles dependency resolution. The monorepo enforces a strict build order: `twenty-shared` must build first as it is the foundational library consumed by every other package. Custom tooling packages (`twenty-oxlint-rules`) must also build before lint targets.

## Current Repository Topology

```
twenty/
├── packages/
│   ├── twenty-shared/                  # Foundation — types, utils, constants
│   ├── twenty-ui/                      # Design system — React components, themes
│   ├── twenty-design-tokens/           # Canonical DTCG tokens + generated adapters
│   ├── twenty-server/                  # NestJS backend API + queue worker
│   ├── twenty-front/                   # React SPA (CRM UI)
│   ├── twenty-emails/                  # Transactional email templates
│   ├── twenty-website/                 # Marketing website (Next.js)
│   ├── twenty-website-redone/          # Redesigned marketing website
│   ├── twenty-docs/                    # Public documentation (Mintlify)
│   ├── twenty-docker/                  # Docker, K8s, Helm, Grafana
│   ├── twenty-e2e-testing/             # Playwright E2E tests
│   ├── twenty-zapier/                  # Zapier integration
│   ├── twenty-utils/                   # Dev setup scripts, QA tools
│   ├── twenty-sdk/                     # Public SDK (published to npm)
│   ├── twenty-cli/                     # Deprecated CLI redirect
│   ├── twenty-client-sdk/              # API client library
│   ├── twenty-front-component-renderer/ # Remote component host
│   ├── twenty-apps/                    # App definitions (internal, community, examples)
│   ├── twenty-codex-plugin/            # OpenAI Codex plugin
│   ├── twenty-companion/               # Electron desktop app
│   ├── twenty-oxlint-rules/            # Custom lint rules
│   ├── twenty-claude-skills/           # Claude Code skills
│   └── create-twenty-app/              # App scaffolding CLI
├── docs/                               # Internal documentation baseline (this harness)
├── .github/                            # CI workflows (22), actions (8)
├── .claude/                            # Claude Code settings
├── .cursor/                            # Cursor IDE rules (16 .mdc files), skills
├── .vscode/                            # VS Code settings
├── nx.json                             # Nx task configuration
├── tsconfig.base.json                  # Base TypeScript configuration
├── package.json                        # Root workspace definition
├── yarn.lock                           # Lock file
└── yarn.config.cjs                     # Yarn constraints
```

## Package Classification

| Category | Packages | Description |
| --- | --- | --- |
| Foundation | `twenty-shared` | Zero-dependency shared library. Types, utilities, constants, validators. Must build first. |
| Design tokens | `twenty-design-tokens` | Canonical DTCG token source and generated adapters consumed by the design system. |
| UI | `twenty-ui` | React component library. Design system, themes, icons, layout primitives. Consumed by `twenty-front`. |
| Applications | `twenty-server`, `twenty-front`, `twenty-website`, `twenty-website-redone`, `twenty-docs`, `twenty-companion` | Runnable applications. Each has a `start` target. |
| Libraries | `twenty-emails`, `twenty-client-sdk`, `twenty-front-component-renderer`, `twenty-oxlint-rules` | Shared code consumed by applications. |
| SDK | `twenty-sdk`, `twenty-cli`, `create-twenty-app` | Public developer tooling. `twenty-sdk` is published to npm. |
| Apps | `twenty-apps/` | App definitions (internal 12, community 1, examples 2, fixtures 4). Not Nx workspaces; managed by `twenty-sdk` CLI. |
| Infrastructure | `twenty-docker` | Docker Compose, Kubernetes Helm charts, Grafana dashboards, OTEL config. Treated as separate infrastructure (not part of the Nx dependency graph). |
| Testing | `twenty-e2e-testing` | Playwright end-to-end tests against the full stack. |
| Tooling | `twenty-utils`, `twenty-zapier`, `twenty-codex-plugin`, `twenty-claude-skills` | Dev utilities, integrations, AI tooling. |

## Package Dependency Graph

```
                    twenty-shared (foundation — types, utils, constants)
                   /       |        \        \
                  v        v         v        v
        twenty-ui    twenty-front  twenty-server  twenty-emails
            |             |             |
            v             v             v
      (Design System  (React SPA)   (NestJS API)
       components)        |             |
                          v             v
                twenty-front-     twenty-client-sdk
                component-renderer  (bundled into server)
```

- **`twenty-shared`** is the foundational layer. Every other package depends on it directly or transitively.
- **`twenty-ui`** provides design system components consumed by `twenty-front`.
- **`twenty-server`** depends on `twenty-shared`, `twenty-emails`, and `twenty-client-sdk`.
- **`twenty-front`** depends on `twenty-shared`, `twenty-ui`, and `twenty-front-component-renderer`.
- **`twenty-sdk`** is standalone (published to npm). Not consumed internally.
- **`twenty-docker`** is separate infrastructure. It orchestrates containers but has no build-time code dependencies on other packages. It is not part of the Nx dependency graph.

## Build Order

Nx computes build order automatically from the `dependsOn: ["^build"]` configuration in `nx.json`. The effective build order is:

1. `twenty-oxlint-rules` — must build before any lint target
2. `twenty-shared` — must build before all consuming packages
3. `twenty-ui` — must build before `twenty-front`
4. `twenty-emails` — must build before `twenty-server`
5. `twenty-client-sdk` — must build before `twenty-server`
6. `twenty-front-component-renderer` — must build before `twenty-front`
7. `twenty-server`, `twenty-front` — application builds come last

To build everything: `npx nx run-many -t build`

## Repository Rules

1. **Build before dependents.** Any package consumed by others must build successfully before dependent packages. Enforced by `dependsOn: ["^build"]` in nx.json.

2. **TypeScript strict everywhere.** All packages use `strict: true`. No `any` type allowed in application code. Enforced by `tsgo` typecheck.

3. **Named exports only.** No default exports except for app definitions (SDK convention: `export default defineObject(...)`) and Next.js page/layout conventions.

4. **Lint before merge.** All changes must pass `lint:diff-with-main` before merging to `main`. This lints only changed files against the main branch for speed.

5. **No circular dependencies.** The dependency graph is a DAG. `twenty-shared` cannot depend on any other package. `twenty-ui` cannot depend on `twenty-front`. Enforced by Yarn constraints (`yarn.config.cjs`).

6. **Barrel exports for public API.** Each package exposes its public API via `src/index.ts`. Internal modules not in the barrel are implementation details.

7. **Vite for libraries, SWC for compilation.** Libraries use `@nx/vite:build` for building. Application compilation uses SWC for speed.

8. **App SDK is additive.** Apps in `twenty-apps/` extend Twenty without modifying core packages. They use `twenty-sdk/define` functions and are published/installed via the `twenty` CLI.

9. **`twenty-shared` sub-modules.** The shared library exports 13 sub-modules via the `exports` field in `package.json`: `./ai`, `./application`, `./constants`, `./database-events`, `./i18n`, `./logic-function`, `./metadata`, `./testing`, `./translations`, `./types`, `./utils`, `./vite`, `./workflow`, `./workspace`. Consumers import only what they need.

10. **`twenty-ui` sub-modules.** The UI library exports 19 sub-modules: `./accessibility`, `./assets`, `./data-display`, `./feedback`, `./icon`, `./input`, `./json-visualizer`, `./layout`, `./navigation`, `./styles`, `./surfaces`, `./testing`, `./theme`, `./theme-constants`, `./typography`, `./utilities`, plus CSS exports (`style.css`, `theme-light.css`, `theme-dark.css`).

## Code Generation

Three GraphQL codegen configs in `twenty-front` auto-generate typed hooks and fragments:

| Config | Source Schema | Output Directory | Command |
| --- | --- | --- | --- |
| `codegen.cjs` | Core GraphQL schema (`/graphql`) | `generated/` | `npx nx run twenty-front:graphql:generate` |
| `codegen-metadata.cjs` | Metadata schema (`/metadata`) | `generated-metadata/` | `npx nx run twenty-front:graphql:generate --configuration=metadata` |
| `codegen-admin.cjs` | Admin schema (`/admin-panel`) | `generated-admin/` | `npx nx run twenty-front:graphql:generate --configuration=admin` |

After any GraphQL schema change in `twenty-server`, run the corresponding codegen command to regenerate frontend types.

## Instance Commands (Database Migrations)

Database migrations in `twenty-server` follow a custom pattern:

```
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
```

- **Fast commands**: Schema-only changes (TypeORM migrations). No data migration.
- **Slow commands**: Schema changes + `runDataMigration()` method for data backfills.
- Commands use decorator-based discovery: `@RegisteredInstanceCommand`, `@RegisteredWorkspaceCommand`.
- Both `up` and `down` logic must be implemented.
- Committed instance command logic must never be deleted or rewritten.

## Nx Task Pipeline

Key targets defined in `nx.json` with defaults:

| Target | Executor | Cache | Depends On |
| --- | --- | --- | --- |
| `build` | `@nx/vite:build` or `@nx/js:tsc` | Yes | `^build` (all dependencies first) |
| `start` | Project-specific | No | `^build` |
| `lint` | `nx:run-commands` (oxlint + oxfmt) | Yes | `^build`, `twenty-oxlint-rules:build` |
| `lint:diff-with-main` | `nx:run-commands` (oxlint + oxfmt on changed files) | No | `twenty-oxlint-rules:build` |
| `typecheck` | `nx:run-commands` (tsgo) | Yes | `^build` |
| `test` | `@nx/jest:jest` | Yes | `^build` |
| `fmt` | `nx:run-commands` (oxfmt) | Yes | `^build` |
| `storybook:build` | `nx:run-commands` (storybook build) | Yes | `^build` |

## Monorepo Entry Points

| Entry | Command | What It Starts |
| --- | --- | --- |
| Full stack | `yarn start` | `twenty-server` + `twenty-front` + worker (concurrently via `concurrently` + `wait-on`) |
| Backend only | `npx nx start twenty-server` | NestJS API server (port 3000) |
| Frontend only | `npx nx start twenty-front` | Vite dev server (port 3001) |
| Worker only | `npx nx run twenty-server:worker` | BullMQ queue worker process |
| App dev | `yarn twenty dev` | SDK dev mode (watches and syncs app definitions) |

## Current Assumptions

- The Nx + Yarn 4 monorepo structure is stable and will not be replaced by Turborepo, pnpm, or another tool.
- `twenty-shared` will remain the single foundational dependency with sub-module exports.
- The app system (`twenty-apps/` + `twenty-sdk`) will continue to be the primary extensibility mechanism, with apps managed as subdirectories (not independent npm packages).
- Code generation (GraphQL codegen) will remain a manual step after schema changes. CI verifies generated types are up to date (fails if not).
- The lint strategy (`lint:diff-with-main` for speed, full `lint` for thoroughness) is the preferred approach. Both targets remain explicit.
- `twenty-oxlint-rules` will remain a prerequisite build for any lint operation.
- New packages are classified by functional role: has `start` target → application, consumed by others → library, CLI/utility → tooling.
- `twenty-docker` is infrastructure, separate from the Nx dependency graph.

## Open Decisions

- Should there be a build step to auto-generate `.cursor/rules/` from `docs/standards/`?
- What is the migration timeline for converting `.cursor/rules/` `.mdc` files into index references?
