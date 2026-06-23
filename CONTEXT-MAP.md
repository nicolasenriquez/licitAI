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
- AI-tooling rollout surfaces:
  - `.codex/`
  - `packages/twenty-codex-plugin`
- Unmapped surfaces in the current rollout:
  - leaf package folders unless explicitly mapped
  - `.github/`
  - `.cursor/`
  - `.opencode/`
  - `.vscode/`
  - `.yarn/`
  - other top-level tooling directories not yet assigned to a wave

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

## Expansion Order After Package Index

- Wave 2: docs-heavy package surfaces
  - `packages/twenty-docs`
  - `packages/twenty-claude-skills`
- Wave 3: AI tooling surfaces
  - `.codex`
  - `packages/twenty-codex-plugin`
- Wave 4: core monorepo packages first, then the rest of `packages/` by functional group

## Gate For Expansion

Do not close a rollout wave until its manual acceptance cases pass in both Codex and Claude Code.
