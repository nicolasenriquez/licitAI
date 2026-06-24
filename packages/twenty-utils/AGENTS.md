# Twenty Utils Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-utils` during the workspace routing rollout.

## Stay In `packages/twenty-utils` When

- The task is about repository utility scripts and tooling.
- The task is to add, modify, or remove dev environment setup scripts, helper utilities, or operational tooling.
- The task is about the `setup-dev-env.sh` script or local development environment tooling.
- The task is package-scoped utility code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific script or utility files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or application logic rather than utility tooling.
- The prompt is general package selection rather than `twenty-utils` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-utils`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-utils`.
- Preserve the distinction between utility/scripts code and application-specific or infrastructure-docs work.
