# Context Map

## Purpose

Define the repo-local routing contract for agent work in this checkout during the workspace routing rollout.

## Rollout Status

- Scope: repo-local pilot only for this checkout of `twenty`
- Product impact: none; this is not a Twenty product feature
- Validated surfaces:
  - repository root
  - `openspec/`
  - `docs/`
- Rollout-architecture surfaces:
  - `packages/`
- Docs-heavy rollout surfaces:
  - `packages/twenty-docs`
  - `packages/twenty-claude-skills`
- AI-tooling rollout surfaces:
  - `.codex/` (wave 3)
  - `packages/twenty-codex-plugin` (wave 3)
  - `.opencode/` (wave 5)
- Core monorepo rollout surfaces:
  - `packages/twenty-server`
  - `packages/twenty-front`
  - `packages/twenty-shared`
  - `packages/twenty-ui`
- Remaining rollout surfaces:
  - all remaining `packages/` leaf packages (SDK, CLI, app runtime, infra, testing, websites, apps collection)
- Intentionally root-routed surfaces:
  - `.github/` — CI workflows, PR templates; rarely agent-targeted
  - `.cursor/` — editor rules; root contract handles it
  - `.vscode/` — editor settings; never agent-targeted
  - `.yarn/` — package manager internals; never agent-targeted

## Canonical Entry Files

| Surface | Files | Role |
| --- | --- | --- |
| Root | `AGENTS.md`, `CLAUDE.md`, `CONTEXT-MAP.md` | Canonical entrypoint and routing decision point |
| `openspec/` | `openspec/AGENTS.md`, `openspec/CONTEXT.md` | Active change work, OpenSpec artifacts, and change-specific validation |
| `docs/` | `docs/AGENTS.md`, `docs/CONTEXT.md` | Durable repository docs, architecture, governance, operations, and ADR work |
| `packages/` | `packages/AGENTS.md`, `packages/CONTEXT.md` | Package-index routing surface for package selection and package-scoped work |
| `packages/twenty-docs` | `packages/twenty-docs/AGENTS.md`, `packages/twenty-docs/CONTEXT.md` | Public Mintlify docs-site package surface |
| `packages/twenty-claude-skills` | `packages/twenty-claude-skills/AGENTS.md`, `packages/twenty-claude-skills/CONTEXT.md` | Claude-skills package surface |
| `.codex` | `.codex/AGENTS.md`, `.codex/CONTEXT.md` | Repo-local Codex commands and skills surface |
| `packages/twenty-codex-plugin` | `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md` | Published Twenty Codex plugin package surface |
| `packages/twenty-server` | `packages/twenty-server/AGENTS.md`, `packages/twenty-server/CONTEXT.md` | NestJS backend API server, database, queue, and GraphQL surface |
| `packages/twenty-front` | `packages/twenty-front/AGENTS.md`, `packages/twenty-front/CONTEXT.md` | React frontend application surface |
| `packages/twenty-shared` | `packages/twenty-shared/AGENTS.md`, `packages/twenty-shared/CONTEXT.md` | Shared types, utilities, and cross-package contracts surface |
| `packages/twenty-ui` | `packages/twenty-ui/AGENTS.md`, `packages/twenty-ui/CONTEXT.md` | Shared UI component library and design system surface |
| `.opencode` | `.opencode/AGENTS.md`, `.opencode/CONTEXT.md` | Repo-local OpenCode configuration, skills, and commands surface |
| `packages/twenty-apps` | `packages/twenty-apps/AGENTS.md`, `packages/twenty-apps/CONTEXT.md` | App collection index surface for all app subdirectories |
| `packages/twenty-docker` | `packages/twenty-docker/AGENTS.md`, `packages/twenty-docker/CONTEXT.md` | Docker container infrastructure surface |
| `packages/twenty-e2e-testing` | `packages/twenty-e2e-testing/AGENTS.md`, `packages/twenty-e2e-testing/CONTEXT.md` | Playwright E2E testing surface |
| `packages/twenty-utils` | `packages/twenty-utils/AGENTS.md`, `packages/twenty-utils/CONTEXT.md` | Repository utility scripts and dev environment tooling surface |
| `packages/twenty-sdk` | `packages/twenty-sdk/AGENTS.md`, `packages/twenty-sdk/CONTEXT.md` | Twenty SDK package surface |
| `packages/twenty-cli` | `packages/twenty-cli/AGENTS.md`, `packages/twenty-cli/CONTEXT.md` | Twenty CLI package surface |
| `packages/twenty-client-sdk` | `packages/twenty-client-sdk/AGENTS.md`, `packages/twenty-client-sdk/CONTEXT.md` | Twenty Client SDK package surface |
| `packages/create-twenty-app` | `packages/create-twenty-app/AGENTS.md`, `packages/create-twenty-app/CONTEXT.md` | App scaffolder package surface |
| `packages/twenty-emails` | `packages/twenty-emails/AGENTS.md`, `packages/twenty-emails/CONTEXT.md` | React Email templates package surface |
| `packages/twenty-companion` | `packages/twenty-companion/AGENTS.md`, `packages/twenty-companion/CONTEXT.md` | Companion service package surface |
| `packages/twenty-zapier` | `packages/twenty-zapier/AGENTS.md`, `packages/twenty-zapier/CONTEXT.md` | Zapier integration package surface |
| `packages/twenty-front-component-renderer` | `packages/twenty-front-component-renderer/AGENTS.md`, `packages/twenty-front-component-renderer/CONTEXT.md` | Frontend component renderer package surface |
| `packages/twenty-oxlint-rules` | `packages/twenty-oxlint-rules/AGENTS.md`, `packages/twenty-oxlint-rules/CONTEXT.md` | Custom oxlint rules package surface |
| `packages/twenty-website` | `packages/twenty-website/AGENTS.md`, `packages/twenty-website/CONTEXT.md` | Marketing website package surface |
| `packages/twenty-website-redone` | `packages/twenty-website-redone/AGENTS.md`, `packages/twenty-website-redone/CONTEXT.md` | Redesigned marketing website package surface |

## Routing Rules

1. Start at the repository root.
2. Read `CONTEXT-MAP.md` before selecting a mapped surface.
3. Choose `openspec/` when the task is about active changes, proposals, designs, tasks, specs, apply/archive/sync work, or review of OpenSpec artifacts.
4. Choose `docs/` when the task is about architecture, business context, governance, operations, standards, ADRs, or documentation updates outside an active change artifact.
5. Choose `packages/` when the task is about package-scoped code, package ownership, package grouping, or selecting a leaf package surface.
6. Choose `.codex/` when the task is about repo-local Codex commands, repo-local Codex skills, or local Codex workflow assets in this checkout.
7. If the current folder is wrong for the prompt, bounce back to the root map first and then reroute. Do not stay in the wrong folder.
8. Do not roam into unmapped surfaces looking for a better fit. If no mapped surface applies, remain on the root contract and say so explicitly.
9. Before responding or editing, declare which routing/context files were consulted and which surface was selected.

## Bounce Examples

### Root -> `openspec/`

- Prompt: "I want to review an active OpenSpec change."
- Action: read `openspec/AGENTS.md` and `openspec/CONTEXT.md`, then work from `openspec/`.

### Root -> `docs/`

- Prompt: "I want to understand the repo architecture."
- Action: read `docs/AGENTS.md` and `docs/CONTEXT.md`, then work from `docs/`.

### Root -> `packages/`

- Prompt: "I need to work on a package-level change in `packages/twenty-server`."
- Action: read `packages/AGENTS.md` and `packages/CONTEXT.md`, then select the right package surface from `packages/`.

### Root -> `packages/twenty-docs`

- Prompt: "Update the public documentation site navigation."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-docs/AGENTS.md`, and `packages/twenty-docs/CONTEXT.md`, then work from `packages/twenty-docs`.

### Root -> `packages/twenty-claude-skills`

- Prompt: "Update the Claude skills package."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-claude-skills/AGENTS.md`, and `packages/twenty-claude-skills/CONTEXT.md`, then work from `packages/twenty-claude-skills`.

### Root -> `.codex`

- Prompt: "Update the repo-local Codex commands."
- Action: read `.codex/AGENTS.md` and `.codex/CONTEXT.md`, then work from `.codex`.

### Root -> `packages/twenty-codex-plugin`

- Prompt: "Update the published Twenty Codex plugin package."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, and `packages/twenty-codex-plugin/CONTEXT.md`, then work from `packages/twenty-codex-plugin`.

### `docs/` -> root -> `openspec/`

- Prompt: "Please update the tasks for the active OpenSpec change."
- Action: leave `docs/`, return to `CONTEXT-MAP.md`, reroute into `openspec/`, and do not continue from `docs/`.

### `openspec/` -> root -> `docs/`

- Prompt: "Explain the repository governance model."
- Action: leave `openspec/`, return to `CONTEXT-MAP.md`, reroute into `docs/`, and do not continue from `openspec/`.

### `packages/` -> root -> `docs/`

- Prompt: "Update the ADR guidance for the repo."
- Action: leave `packages/`, return to `CONTEXT-MAP.md`, reroute into `docs/`, and do not continue from `packages/`.

### `packages/twenty-docs` -> root -> `docs/`

- Prompt: "Update the repository governance baseline."
- Action: leave `packages/twenty-docs`, return to `CONTEXT-MAP.md`, reroute into `docs/`, and do not continue from `packages/twenty-docs`.

### `packages/twenty-claude-skills` -> root -> `.codex/` or root

- Prompt: "Change root Codex configuration."
- Action: leave `packages/twenty-claude-skills`, return to `CONTEXT-MAP.md`, and reroute to the proper top-level tooling surface when it is mapped, or stay root-routed if it is still unmapped.

### `.codex` -> root -> `packages/twenty-codex-plugin`

- Prompt: "Change the published plugin package manifest."
- Action: leave `.codex`, return to `CONTEXT-MAP.md`, reroute into `packages/twenty-codex-plugin`, and do not continue from `.codex`.

### `packages/twenty-codex-plugin` -> root -> `.codex`

- Prompt: "Adjust the repo-local Codex command set."
- Action: leave `packages/twenty-codex-plugin`, return to `CONTEXT-MAP.md`, reroute into `.codex`, and do not continue from `packages/twenty-codex-plugin`.

### Root -> `packages/twenty-server`

- Prompt: "Add a new NestJS service in twenty-server."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-server/AGENTS.md`, and `packages/twenty-server/CONTEXT.md`, then work from `packages/twenty-server`.

### Root -> `packages/twenty-front`

- Prompt: "Add a new React component in twenty-front."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-front/AGENTS.md`, and `packages/twenty-front/CONTEXT.md`, then work from `packages/twenty-front`.

### Root -> `packages/twenty-shared`

- Prompt: "Add a shared type guard to twenty-shared."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-shared/AGENTS.md`, and `packages/twenty-shared/CONTEXT.md`, then work from `packages/twenty-shared`.

### Root -> `packages/twenty-ui`

- Prompt: "Add a new UI component to twenty-ui."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-ui/AGENTS.md`, and `packages/twenty-ui/CONTEXT.md`, then work from `packages/twenty-ui`.

### `packages/twenty-server` -> root -> `docs/`

- Prompt: "Update the repository ADR guidance."
- Action: leave `packages/twenty-server`, return to `CONTEXT-MAP.md`, reroute into `docs/`, and do not continue from `packages/twenty-server`.

### `packages/twenty-front` -> root -> `openspec/`

- Prompt: "Review the active OpenSpec change tasks."
- Action: leave `packages/twenty-front`, return to `CONTEXT-MAP.md`, reroute into `openspec/`, and do not continue from `packages/twenty-front`.

### `packages/twenty-shared` -> root -> `docs/`

- Prompt: "Update the repository governance baseline."
- Action: leave `packages/twenty-shared`, return to `CONTEXT-MAP.md`, reroute into `docs/`, and do not continue from `packages/twenty-shared`.

### `packages/twenty-ui` -> root -> `openspec/`

- Prompt: "Review the active OpenSpec change tasks."
- Action: leave `packages/twenty-ui`, return to `CONTEXT-MAP.md`, reroute into `openspec/`, and do not continue from `packages/twenty-ui`.

### Root -> `.opencode`

- Prompt: "Update the repo-local OpenCode skills."
- Action: read `.opencode/AGENTS.md` and `.opencode/CONTEXT.md`, then work from `.opencode`.

### `.opencode` -> root -> `.codex/`

- Prompt: "Update the repo-local Codex commands."
- Action: leave `.opencode`, return to `CONTEXT-MAP.md`, reroute into `.codex/`, and do not continue from `.opencode`.

### Root -> `packages/twenty-apps`

- Prompt: "Add a new app subdirectory under twenty-apps."
- Action: read `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-apps/AGENTS.md`, and `packages/twenty-apps/CONTEXT.md`, then work from `packages/twenty-apps`.

### Root -> remaining leaf packages

- Prompt: "Update the E2E test suite." / "Modify the dev setup script." / "Update the Docker compose file."
- Action: read `packages/AGENTS.md` and `packages/CONTEXT.md`, then select the appropriate mapped leaf package surface from `packages/`. If no specific leaf surface is mapped for the target package, stay in `packages/`.

## Expansion Order After Package Index

- Wave 2: docs-heavy package surfaces
  - `packages/twenty-docs`
  - `packages/twenty-claude-skills`
- Wave 3: AI tooling surfaces
  - `.codex`
  - `packages/twenty-codex-plugin`
- Wave 4: core monorepo packages
  - `packages/twenty-server`
  - `packages/twenty-front`
  - `packages/twenty-shared`
  - `packages/twenty-ui`
- Wave 5: remaining repo surfaces
  - `.opencode/`
  - `packages/twenty-sdk`, `packages/twenty-cli`, `packages/twenty-client-sdk`, `packages/create-twenty-app`
  - `packages/twenty-front-component-renderer`, `packages/twenty-emails`, `packages/twenty-companion`, `packages/twenty-zapier`
  - `packages/twenty-docker`, `packages/twenty-e2e-testing`, `packages/twenty-utils`, `packages/twenty-oxlint-rules`
  - `packages/twenty-website`, `packages/twenty-website-redone`
  - `packages/twenty-apps`
- Surfaces intentionally root-routed: `.github/`, `.cursor/`, `.vscode/`, `.yarn/`

## Gate For Expansion

Do not close a rollout wave until its manual acceptance cases pass in both Codex and Claude Code.
