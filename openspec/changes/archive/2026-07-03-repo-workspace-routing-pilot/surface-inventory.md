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
- `.opencode/` (added in wave 5 as a parallel AI-tooling surface)

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
- App and runtime support:
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
  - `packages/twenty-apps` (index surface; individual apps deferred)

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

## Wave Completion Summary

All five waves passed manual acceptance for both Codex and Claude Code. Per-case results are the source of truth and live in `manual-acceptance.md`.

- Wave 1 (Rollout architecture): closed — `packages/` added as package-index surface.
- Wave 2 (Docs-heavy): closed — `packages/twenty-docs`, `packages/twenty-claude-skills` mapped.
- Wave 3 (AI tooling): closed — `.codex/`, `packages/twenty-codex-plugin` mapped.
- Wave 4 (Core monorepo): closed — `packages/twenty-server`, `packages/twenty-front`, `packages/twenty-shared`, `packages/twenty-ui` mapped.
- Wave 5 (Remaining surfaces): closed — all remaining 17 leaf packages plus `.opencode/` and the `packages/twenty-apps` index mapped. `.opencode/`↔`.codex/` bounce verified. App-internal `AGENTS.md` files (twenty-last-contact, twenty-meeting-bot) deferred to the `packages/twenty-apps` index.

Final consistency pass (Task 36): all mapped surfaces verified to share the same vocabulary, bounce rules, and file contract shape. Change ready for archive per Task 38.
