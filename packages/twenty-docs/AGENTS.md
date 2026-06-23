# Twenty Docs Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-docs` during the workspace routing rollout.

## Stay In `packages/twenty-docs` When

- The task is about the public documentation site at `docs.twenty.com`.
- The task is to edit or review MDX docs under `user-guide/`, `developers/`, or `twenty-ui/`.
- The task is to update navigation structure, labels, generated docs config, docs images, Mintlify config, or package-local docs scripts.
- The task is package-scoped documentation work for the `twenty-docs` app rather than the durable root `docs/` baseline.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. `README.md`
8. The specific docs files relevant to the task

## Bounce Back To Root When

- The prompt is about the durable repository baseline under root `docs/`.
- The prompt is about active OpenSpec change work.
- The prompt is general package selection rather than `twenty-docs` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-docs`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-docs`.
- Preserve the distinction between public docs-site content and the internal root `docs/` baseline.
