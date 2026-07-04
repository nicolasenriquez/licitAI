---
type: agent-contract
title: "Twenty Apps Surface Contract"
description: "Routing contract for Twenty Apps."
okf_version: "0.1"
---
# Twenty Apps Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-apps` during the workspace routing rollout.

## Stay In `packages/twenty-apps` When

- The task is about the Twenty apps collection — the parent directory for all app packages.
- The task is to add, remove, or reorganize app subdirectories under `packages/twenty-apps/`.
- The task is about app-level routing, app grouping, or app discovery at the collection level.
- The task needs the apps index context before selecting a specific app subdirectory.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific app directory or manifest files relevant to the task

## Routing Rule Inside `packages/twenty-apps/`

- If the target app already has a rollout contract, enter that app surface.
- If the target app is not mapped yet, stay in the `packages/twenty-apps/` surface and do not invent an app-local routing contract.
- Pre-existing local `AGENTS.md` files in app subdirectories must be harmonized with the root contract before becoming first-class surfaces.

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend CRM app code, or other package-level code rather than app collection work.
- The prompt is general package selection rather than `twenty-apps` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-apps`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-apps`.
- Preserve the distinction between the apps collection index and individual app package surfaces.
- Individual app subdirectories are not yet mapped as first-class surfaces — use this index surface.

