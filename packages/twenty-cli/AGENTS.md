# Twenty CLI Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-cli` during the workspace routing rollout.

## Stay In `packages/twenty-cli` When

- The task is about the Twenty CLI (`twenty-cli`) package.
- The task is to add, modify, or remove CLI commands, flags, or argument parsing.
- The task is about CLI build configuration, npm publishing, or binary packaging.
- The task is package-scoped CLI code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific CLI command or module files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or other package code rather than CLI code.
- The prompt is general package selection rather than `twenty-cli` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-cli`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-cli`.
- Preserve the distinction between CLI package code and application-specific or infrastructure-docs work.
