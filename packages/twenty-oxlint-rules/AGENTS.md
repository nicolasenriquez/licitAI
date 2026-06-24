# Twenty Oxlint Rules Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-oxlint-rules` during the workspace routing rollout.

## Stay In `packages/twenty-oxlint-rules` When

- The task is about custom oxlint rules for the Twenty monorepo.
- The task is to add, modify, or remove linting rules, rule tests, or rule configuration.
- The task is about oxlint integration, rule publishing, or linting pipeline configuration.
- The task is package-scoped linting infrastructure rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific rule or config files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or application logic rather than linting rules.
- The prompt is general package selection rather than `twenty-oxlint-rules` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-oxlint-rules`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-oxlint-rules`.
- Preserve the distinction between linting infrastructure and application-specific or infrastructure-docs work.
