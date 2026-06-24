# Twenty Zapier Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-zapier` during the workspace routing rollout.

## Stay In `packages/twenty-zapier` When

- The task is about the Twenty Zapier integration package.
- The task is to add, modify, or remove Zapier triggers, actions, or authentication logic.
- The task is about Zapier app definition, platform configuration, or deployment.
- The task is package-scoped Zapier integration code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific Zapier trigger, action, or config files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or UI component library code rather than Zapier integration code.
- The prompt is general package selection rather than `twenty-zapier` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-zapier`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-zapier`.
- Preserve the distinction between Zapier integration package code and application-specific or infrastructure-docs work.
