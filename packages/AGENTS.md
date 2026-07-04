---
type: agent-contract
title: Packages Surface Contract
description: Routing contract for package selection and package-scoped work.
---

# Packages Surface Contract

## Purpose

Define when work should stay inside `packages/` during the workspace routing rollout.

## Stay In `packages/` When

- The task is package-scoped code or package-scoped documentation work.
- The task names one or more folders under `packages/`.
- The task is to decide which package owns a capability, integration, UI surface, or tooling concern.
- The task needs package grouping or package-wave selection before a leaf package contract exists.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../index.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. `index.md`
6. The specific leaf package contract if that package is already mapped

## Routing Rule Inside `packages/`

- If the target leaf package already has a rollout contract, enter that leaf package surface.
- If the target leaf package is not mapped yet, stay in the `packages/` surface and do not invent a leaf-local routing contract.
- Use `packages/` as the package-index layer between the root map and future leaf-package surfaces.
- The currently mapped docs-heavy leaf surfaces are `packages/twenty-docs` and `packages/twenty-claude-skills`.
- The currently mapped AI-tooling leaf surface is `packages/twenty-codex-plugin`.
- The currently mapped core monorepo leaf surfaces are `packages/twenty-server`, `packages/twenty-front`, `packages/twenty-shared`, and `packages/twenty-ui`.
- The currently mapped remaining leaf surfaces include `packages/twenty-sdk`, `packages/twenty-cli`, `packages/twenty-client-sdk`, `packages/create-twenty-app`, `packages/twenty-front-component-renderer`, `packages/twenty-emails`, `packages/twenty-companion`, `packages/twenty-zapier`, `packages/twenty-docker`, `packages/twenty-e2e-testing`, `packages/twenty-utils`, `packages/twenty-oxlint-rules`, `packages/twenty-website`, `packages/twenty-website-redone`, and `packages/twenty-apps`.
- Unmapped leaf package folders must not get improvised routing contracts.
- The package-index surface is now the authoritative routing entrypoint for all mapped leaf packages.

## Bounce Back To Root When

- The prompt is really about active OpenSpec change work.
- The prompt is about durable top-level docs, ADRs, governance, or repo-wide operations under `docs/` rather than package-scoped work.
- The prompt is about an unmapped top-level surface outside `packages/`.

When that happens, return to `../index.md` first and reroute from there. Do
not keep working from `packages/`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/`.
- Preserve the distinction between the package-index surface and future leaf-package surfaces.
