# Twenty Companion Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-companion` during the workspace routing rollout.

## Stay In `packages/twenty-companion` When

- The task is about the Twenty Companion package.
- The task is to add, modify, or remove companion logic, integration handlers, or companion configuration.
- The task is about companion build configuration, deployment, or packaging.
- The task is package-scoped companion code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific companion module files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or UI component library code rather than companion code.
- The prompt is general package selection rather than `twenty-companion` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-companion`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-companion`.
- Preserve the distinction between companion package code and application-specific or infrastructure-docs work.
