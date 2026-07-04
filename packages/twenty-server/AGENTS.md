---
type: agent-contract
title: "Twenty Server Surface Contract"
description: "Routing contract for Twenty Server."
okf_version: "0.1"
---
# Twenty Server Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-server` during the workspace routing rollout.

## Stay In `packages/twenty-server` When

- The task is about the NestJS backend API server.
- The task is to add, modify, or remove backend services, modules, controllers, resolvers, guards, interceptors, or pipes.
- The task is about TypeORM entities, database migrations, instance commands, or workspace commands.
- The task is about GraphQL schema changes, resolvers, or DTOs inside the server package.
- The task is about message queue workers, BullMQ jobs, or job processors.
- The task is about Redis caching, session management, or backend auth.
- The task is about backend configuration (`TwentyConfigService`), secrets, or server-scoped env handling.
- The task is package-scoped backend code rather than architecture docs, OpenSpec changes, or frontend code.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific module, entity, or command files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about frontend code, UI components, or styling.
- The prompt is about the `twenty-shared`, `twenty-ui`, or other leaf package code rather than server code.
- The prompt is general package selection rather than `twenty-server` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-server`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-server`.
- Preserve the distinction between backend server code and frontend, shared-library, or infrastructure-docs work.

