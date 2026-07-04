---
type: agent-contract
title: "Twenty UI Surface Contract"
description: "Routing contract for Twenty Ui."
okf_version: "0.1"
---
# Twenty UI Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-ui` during the workspace routing rollout.

## Stay In `packages/twenty-ui` When

- The task is about the shared UI component library.
- The task is to add, modify, or remove UI components, stories, or component tests.
- The task is about Base UI primitive integration, SCSS Modules styling, or component theming.
- The task is about the Twenty design system: tokens, CSS variables, theme providers, or icon systems.
- The task is about Storybook stories, a11y tests, visual regression tests, or component documentation.
- The task is about the `twenty-ui` build, publishing pipeline, or package export map.
- The task is about migrating `modules/ui` components from `twenty-front` into the library.
- The task is package-scoped UI library work rather than frontend app logic, backend code, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. `README.md`
8. The specific component, story, or test files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, database migrations, or queue workers.
- The prompt is about `twenty-front` application logic, routing, or workspace-scoped features rather than reusable UI.
- The prompt is about the `twenty-shared` package rather than UI component code.
- The prompt is general package selection rather than `twenty-ui` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-ui`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-ui`.
- Preserve the distinction between the reusable UI library and frontend app logic, backend code, or infrastructure docs.

