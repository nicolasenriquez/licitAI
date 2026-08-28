---
type: agent-contract
title: "Twenty Front Surface Contract"
description: "Routing contract for Twenty Front."
okf_version: "0.1"
---
# Twenty Front Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-front` during the workspace routing rollout.

## Stay In `packages/twenty-front` When

- The task is about the React frontend application.
- The task is to add, modify, or remove React components, hooks, pages, or layouts.
- The task is about Jotai state management (atoms, selectors, atom families).
- The task is about Apollo GraphQL client queries, mutations, or cache management.
- The task is about Linaria styling, CSS, or SCSS in the frontend package.
- The task is about Vite build configuration for the frontend app.
- The task is about frontend routing, navigation, or workspace-scoped UI logic.
- The task is package-scoped frontend code rather than architecture docs, OpenSpec changes, or backend code.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific module, component, or page files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, NestJS services, database migrations, or queue workers.
- The prompt is about the `twenty-ui` component library or `twenty-shared` types rather than frontend app code.
- The prompt is general package selection rather than `twenty-front` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-front`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-front`.
- Preserve the distinction between frontend app code and backend, shared-library, or infrastructure-docs work.
- Before Mercado Público UI work, read `../../docs/design/patterns/mercado-publico-application.md` and follow its product-flow and UI guardrails.
