# Twenty Shared Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-shared` during the workspace routing rollout.

## Stay In `packages/twenty-shared` When

- The task is about shared types, utilities, or constants used across the monorepo.
- The task is to add, modify, or remove type definitions, type guards, or validation helpers.
- The task is about shared DTOs, common error types, or cross-package contracts.
- The task is about the `twenty-shared` build output, package exports, or barrel files.
- The task is package-scoped shared-library code rather than application-specific logic, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific type, utility, or module files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or UI component library code rather than shared types.
- The prompt is general package selection rather than `twenty-shared` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-shared`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-shared`.
- Preserve the distinction between shared library code and application-specific, UI, or infrastructure-docs work.
- `twenty-shared` is a dependency of multiple packages; changes here have wide blast radius — validate downstream consumers.
