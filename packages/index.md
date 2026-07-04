# Packages Index

## Purpose

Use this index as the package-routing layer between the root routing map and a
mapped leaf package surface.

## Start Here

1. Read `packages/AGENTS.md`.
2. Read `packages/index.md`.
3. Select the package group or mapped leaf package that matches the task.

## Package Groups

### Docs-heavy

- `packages/twenty-docs`
- `packages/twenty-claude-skills`

### AI tooling

- `packages/twenty-codex-plugin`

### Core monorepo

- `packages/twenty-server`
- `packages/twenty-front`
- `packages/twenty-shared`
- `packages/twenty-ui`

### Remaining mapped package groups

- SDK and CLI:
  `packages/twenty-sdk`, `packages/twenty-cli`,
  `packages/twenty-client-sdk`, `packages/create-twenty-app`
- App/runtime support:
  `packages/twenty-front-component-renderer`, `packages/twenty-emails`,
  `packages/twenty-companion`, `packages/twenty-zapier`
- Infra, testing, and utilities:
  `packages/twenty-docker`, `packages/twenty-e2e-testing`,
  `packages/twenty-utils`, `packages/twenty-oxlint-rules`
- Websites and adjacent product surfaces:
  `packages/twenty-website`, `packages/twenty-website-redone`
- App collections:
  `packages/twenty-apps`

## Routing Rule

- If the target leaf package has a mapped local contract, enter that leaf
  surface.
- If it does not, stay in `packages/` and do not invent a new leaf-local
  routing contract.
- Bounce back through root `index.md` when the task is really `docs/`,
  `openspec/`, `.codex/`, or `.opencode/`.
