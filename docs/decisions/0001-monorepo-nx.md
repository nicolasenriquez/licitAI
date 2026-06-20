# ADR 0001: Nx Monorepo with Yarn 4 Workspaces

## Status
Accepted (2026-06-20)

## Purpose
Formalize the decision to use Nx 22.7.5 with Yarn 4 for the Twenty CRM monorepo.

## Context
Twenty is a multi-package project with 22 packages spanning a backend API, frontend SPA, design system, SDK, marketing website, documentation, and infrastructure. The project needed a monorepo tool that provides:

- **Dependency graph awareness**: automatically build packages in correct order
- **Caching**: avoid rebuilding unchanged packages
- **Parallel execution**: run independent tasks concurrently
- **Code generation**: GraphQL types, scaffolding
- **Consistent task definitions**: lint, typecheck, test, build across all packages

At the time of initial architecture (circa 2023), the viable monorepo tools were Nx, Turborepo, Lerna, and pnpm workspaces. The project also evaluated Yarn 4 (Berry) vs npm vs pnpm for package management.

## Decision

**Use Nx 22.7.5 as the monorepo orchestration tool and Yarn 4.13.0 (Berry) as the package manager.**

Key specifics:
- All packages live under `packages/` with Nx inferring project configuration from `project.json` or `package.json`.
- Yarn workspaces define the package graph. Nx defines the task graph.
- Build order: Nx computes automatically from `dependsOn: ["^build"]`. `twenty-shared` must build first.
- Custom lint tooling (`twenty-oxlint-rules`) must build before any lint target.
- Caching: production inputs exclude stories, tests, and mocks. Nx caches task outputs for speed.
- Code generation tasks (GraphQL codegen, docs generation) are defined as Nx targets.
- The `yarn start` root script uses `concurrently` + `wait-on` for full-stack development.

## Consequences

### Positive
- Build caching reduces CI times for unchanged packages.
- Dependency graph enforcement prevents circular dependencies.
- Consistent task interface: `npx nx <target> <package>` across all packages.
- Parallel task execution speeds up full builds and CI.
- Yarn 4 provides strict dependency resolution, preventing phantom dependencies.

### Costs
- Learning curve for Nx-specific configuration (`nx.json`, `project.json`).
- Yarn 4 PnP (Plug'n'Play) mode adds complexity for some tooling (ESLint, Jest); the project uses `nodeLinker: node-modules`.
- Custom lint rules package (`twenty-oxlint-rules`) must build before any lint task, adding a serial bottleneck.

### Constraints
- All packages must use the same Node.js version (^24.5.0).
- Build order is enforced by Nx. Manual builds must respect the dependency graph.
- New packages must follow the Nx workspace convention (package.json with `name` matching workspace glob).

## Alternatives Considered

### Turborepo + pnpm
- **Rejected**: Turborepo had less mature caching and code generation support at the time of decision. pnpm's strict dependency resolution is comparable to Yarn 4 but Nx's task orchestration was preferred.

### Lerna + npm
- **Rejected**: Lerna was in maintenance mode. npm workspaces lacked the strictness of Yarn 4.

### Multi-repo (no monorepo)
- **Rejected**: Cross-package changes would require coordinated releases across multiple repos. The tight coupling between `twenty-shared`, `twenty-ui`, `twenty-front`, and `twenty-server` makes a monorepo the natural choice.

## Related Documents
- `docs/architecture/repository-strategy.md` — Repository topology and build order
- `docs/architecture/current-state.md` — Current architecture
- `nx.json` — Nx task configuration
- `package.json` — Root workspace definition
