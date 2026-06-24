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
| `.opencode/` | phase 5 mapped | AI-tooling surface — OpenCode local config/skills |
| `.github/` | intentionally root-routed | CI workflows, PR templates; low agent interaction |
| `.cursor/` | intentionally root-routed | editor rules; root contract handles it |
| `.vscode/` | intentionally root-routed | editor settings; never agent-targeted |
| `.yarn/` | intentionally root-routed | package manager internals; never agent-targeted |

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

## Wave 4 Completion Notes

- `packages/twenty-server`, `packages/twenty-front`, `packages/twenty-shared`, and `packages/twenty-ui` now have package-local routing contracts and context files.
- Manual acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 4 gated-closed: routing from root through `packages/` into core monorepo leaf surfaces works, wrong-folder bounce works, unmapped refusal works, consulted-file declaration works.
- No pre-existing `AGENTS.md` files existed in these packages — no harmonization needed.

## Wave 5 Completion Notes

- All remaining 17 leaf packages and `.opencode/` now have routing contracts and context files.
- Manual acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 5 gated-closed: routing from root through `packages/` into all remaining leaf surfaces works, `.opencode/` works, `.opencode/`↔`.codex/` bounce works, wrong-folder bounce works, unmapped apps collection stays at twenty-apps index.
- `.opencode/` mapped as AI-tooling surface with explicit bounce rules vs `.codex/`.
- `.github/`, `.cursor/`, `.vscode/`, `.yarn/` intentionally root-routed — documented in CONTEXT-MAP.md.
- Pre-existing template `AGENTS.md` in `create-twenty-app/src/constants/template/` harmonized with routing note.
- App-internal `AGENTS.md` files (twenty-last-contact, twenty-meeting-bot) deferred — individual apps are not yet first-class routing surfaces; served by `packages/twenty-apps` index.
- All 38 tasks complete. Change ready for archive.

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
| `packages/twenty-codex-plugin/AGENTS.md` | first | active plugin-runtime contract with its own routing language | harmonized in wave 3 with routing contract + `CONTEXT.md` |
| `packages/create-twenty-app/src/constants/template/AGENTS.md` | first | template output can propagate stale guidance into generated apps | harmonized in wave 5 with routing note pointing to parent package contract |
| `packages/twenty-apps/internal/twenty-last-contact/AGENTS.md` | later | app-local guidance with narrower blast radius | deferred — individual apps not yet mapped; served by `packages/twenty-apps` index |
| `packages/twenty-apps/internal/twenty-meeting-bot/AGENTS.md` | later | app-local guidance with narrower blast radius | deferred — individual apps not yet mapped; served by `packages/twenty-apps` index |

## Functional Grouping Rules

- Expand by package group, not by whichever leaf package was mentioned last in chat.
- Prefer documentation-led or tooling-led groups before high-blast-radius runtime packages.
- Keep the package-index surface responsible for package selection until a leaf package has an explicit contract.
- Do not treat hidden directories or editor metadata as package surfaces unless a later wave explicitly maps them.

## Wave 2 Completion Notes

- `packages/twenty-docs` now has a package-local routing contract and context file.
- `packages/twenty-claude-skills` now has a package-local routing contract and context file.
- Manual acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 2 gated-closed: routing from root through packages/ into docs-heavy leaf surfaces works, wrong-folder bounce works, unmapped refusal works, consulted-file declaration works.

## Wave 3 Completion Notes

- `.codex` now has a repo-local routing contract and context file.
- `packages/twenty-codex-plugin` now has a harmonized routing contract plus package context.
- Manual acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 3 gated-closed: routing from root into .codex and packages/twenty-codex-plugin works, .codex↔plugin bounce works, unmapped refusal works, consulted-file declaration works.
