# Surface Inventory: repo-workspace-routing-pilot

## Purpose

Record the rollout architecture decisions for the remaining repository surfaces after the validated root/`openspec/`/`docs/` pilot.

## Top-Level Surface Inventory

| Surface | Current status | Rollout decision |
| --- | --- | --- |
| root files | mapped | remain canonical entrypoint |
| `openspec/` | mapped | keep as validated change-work surface |
| `docs/` | mapped | keep as validated durable-docs surface |
| `packages/` | phase 1 mapped | use as package-index surface before leaf-package rollout |
| `packages/twenty-docs` | phase 2 mapped | public docs-site package surface |
| `packages/twenty-claude-skills` | phase 2 mapped | Claude-skills package surface |
| `.codex/` | phase 3 mapped | repo-local Codex commands and skills surface |
| `packages/twenty-codex-plugin` | phase 3 mapped | published plugin package surface |
| `.github/` | unmapped | phase 5 decision surface |
| `.cursor/` | unmapped | remain root-routed for now |
| `.opencode/` | unmapped | remain root-routed for now |
| `.vscode/` | unmapped | remain root-routed for now |
| `.yarn/` | unmapped | remain root-routed for now |

## Package Wave Assignment

### Wave 2: Docs-heavy

- `packages/twenty-docs`
- `packages/twenty-claude-skills`

### Wave 3: AI tooling

- `packages/twenty-codex-plugin`
- `.codex/`

### Wave 4: Core monorepo

- `packages/twenty-server`
- `packages/twenty-front`
- `packages/twenty-shared`
- `packages/twenty-ui`

### Wave 5: Remaining package groups

- SDK and CLI:
  - `packages/create-twenty-app`
  - `packages/twenty-sdk`
  - `packages/twenty-cli`
  - `packages/twenty-client-sdk`
- App/runtime support:
  - `packages/twenty-front-component-renderer`
  - `packages/twenty-emails`
  - `packages/twenty-companion`
  - `packages/twenty-zapier`
- Infra, testing, and utilities:
  - `packages/twenty-docker`
  - `packages/twenty-e2e-testing`
  - `packages/twenty-utils`
  - `packages/twenty-oxlint-rules`
- Websites and adjacent product surfaces:
  - `packages/twenty-website`
  - `packages/twenty-website-redone`
- App collections:
  - `packages/twenty-apps`

## Pre-Existing Local `AGENTS.md` Files

| Path | Priority | Reason | Harmonization decision |
| --- | --- | --- | --- |
| `packages/twenty-codex-plugin/AGENTS.md` | first | active plugin-runtime contract with its own routing language | harmonize in wave 3 and add matching `CONTEXT.md` |
| `packages/create-twenty-app/src/constants/template/AGENTS.md` | first | template output can propagate stale guidance into generated apps | review and harmonize before or during the package-group wave that covers SDK/CLI surfaces |
| `packages/twenty-apps/internal/twenty-last-contact/AGENTS.md` | later | app-local guidance with narrower blast radius | defer until the `twenty-apps` group is routed |
| `packages/twenty-apps/internal/twenty-meeting-bot/AGENTS.md` | later | app-local guidance with narrower blast radius | defer until the `twenty-apps` group is routed |

## Functional Grouping Rules

- Expand by package group, not by whichever leaf package was mentioned last in chat.
- Prefer documentation-led or tooling-led groups before high-blast-radius runtime packages.
- Keep the package-index surface responsible for package selection until a leaf package has an explicit contract.
- Do not treat hidden directories or editor metadata as package surfaces unless a later wave explicitly maps them.

## Wave 2 Completion Notes

- `packages/twenty-docs` now has a package-local routing contract and context file.
- `packages/twenty-claude-skills` now has a package-local routing contract and context file.
- Manual acceptance cases for the docs-heavy wave are prepared in `manual-acceptance.md`.
- Manual execution of the docs-heavy wave remains pending.

## Wave 3 Completion Notes

- `.codex` now has a repo-local routing contract and context file.
- `packages/twenty-codex-plugin` now has a harmonized routing contract plus package context.
- Manual acceptance cases for the AI-tooling wave are prepared in `manual-acceptance.md`.
- Manual execution of the AI-tooling wave remains pending.
