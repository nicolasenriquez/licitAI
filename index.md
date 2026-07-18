---
type: index
title: Repository Index
description: Canonical routing map for documentation and agent work in this checkout.
okf_version: "0.1"
---

# Repository Index

## Purpose

Define the canonical routing map for documentation and agent work in this
checkout. `AGENTS.md` remains the canonical operational entrypoint. This file
is the canonical routing map for the repository bundle.

## Entry Contract

Start at the repository root:

1. Read `AGENTS.md`.
2. Read `index.md`.
3. Select the correct mapped surface.
4. Read that surface's local routing files before substantive work.

## Root Entry Files

| File | Role |
| --- | --- |
| `AGENTS.md` | Canonical operational entrypoint |
| `CLAUDE.md` | Lightweight shim into the same root contract |
| `index.md` | Canonical routing map for progressive disclosure |

## Mapped Surfaces

| Surface | Routing Files | Use When |
| --- | --- | --- |
| `openspec/` | `openspec/AGENTS.md`, `openspec/CONTEXT.md`, `openspec/index.md` | Active OpenSpec changes, proposal/design/tasks/spec work, apply/archive/sync work |
| `docs/` | `docs/AGENTS.md`, `docs/CONTEXT.md`, `docs/index.md` | Durable repository architecture, governance, operations, standards, business context, ADRs |
| `packages/` | `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/index.md` | Package selection, package-scoped code, package-scoped docs, mapped leaf-package routing |
| `.agents/` | `.agents/AGENTS.md`, `.agents/CONTEXT.md`, `.agents/index.md` | Canonical harness-agnostic repository skills |
| `.opencode/` | `.opencode/opencode.json` | OpenCode plugin runtime config and installed deps |

## Package Surface Index

Route through `packages/index.md` before selecting a leaf package.

Mapped leaf-package surfaces currently include:

- Docs-heavy: `packages/twenty-docs`, `packages/twenty-claude-skills`
- AI tooling: `packages/twenty-codex-plugin`
- Core monorepo: `packages/twenty-server`, `packages/twenty-front`,
  `packages/twenty-shared`, `packages/twenty-ui`
- Remaining package groups: `packages/twenty-sdk`, `packages/twenty-cli`,
  `packages/twenty-client-sdk`, `packages/create-twenty-app`,
  `packages/twenty-front-component-renderer`, `packages/twenty-emails`,
  `packages/twenty-companion`, `packages/twenty-zapier`,
  `packages/twenty-docker`, `packages/twenty-e2e-testing`,
  `packages/twenty-utils`, `packages/twenty-oxlint-rules`,
  `packages/twenty-website`, `packages/twenty-website-redone`,
  `packages/twenty-apps`

## Routing Rules

1. Start at the repository root.
2. Read `index.md` before selecting a mapped surface.
3. Choose `openspec/` for active change artifacts and change-driven execution.
4. Choose `docs/` for durable repository documentation outside an active
   change artifact.
5. Choose `packages/` for package-scoped work or package ownership/routing.
6. Choose `.agents/` for canonical repository skills.
7. Choose `.opencode/` for native OpenCode configuration and adapters.
8. If the current folder is wrong for the task, bounce back through root
   `index.md` and reroute. Do not continue from the wrong surface.
9. If no mapped surface applies, stay on the root contract and say so
   explicitly.
10. Before substantive response or edits, declare which routing/context files
    were consulted and which surface was selected.

## Bounce Rules

- `docs/` -> root -> `openspec/` when the task is really about an active change
- `openspec/` -> root -> `docs/` when the task is really durable repo docs
- `packages/` -> root -> `docs/` or `openspec/` when package scope is wrong
- `.agents/` -> root -> `.opencode/` when the task is native harness configuration

## Progressive-Disclosure Order

- Root routing: `AGENTS.md` -> `index.md`
- Shared skills: `.agents/AGENTS.md` -> `.agents/index.md` -> selected skill
- Surface routing:
  - `docs/AGENTS.md` -> `docs/index.md` -> durable docs
  - `openspec/AGENTS.md` -> `openspec/index.md` -> change artifacts
  - `packages/AGENTS.md` -> `packages/index.md` -> mapped leaf package

## Intentionally Root-Routed Surfaces

These surfaces remain root-routed in this slice and do not gain local routing
contracts:

- `.github/`
- `.cursor/`
- `.vscode/`
- `.yarn/`

## OKF Adoption Notes

- This repository is adopting an OKF-shaped documentation topology
  incrementally.
- Non-root `index.md` files in this slice are body-only routing indexes.
- Existing documents may receive additive frontmatter, heading normalization,
  spacing cleanup, and routing-link fixes only.
- `log.md` is deferred in this first adoption slice.
