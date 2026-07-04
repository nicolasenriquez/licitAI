---
type: context
title: "Twenty Server Context"
description: "Context and scope guide for Twenty Server."
okf_version: "0.1"
---
# Twenty Server Context

## Purpose

Describe the role of `packages/twenty-server` during the workspace routing rollout.

## What Lives Here

- NestJS application — the core backend API server for Twenty.
- GraphQL API with code-first approach (GraphQL Yoga).
- TypeORM entities and database layer (PostgreSQL).
- Redis integration for caching and session management.
- BullMQ queue workers for background job processing.
- Instance commands and workspace commands for database migrations and upgrades.
- Backend auth, guards, interceptors, pipes, filters, and middleware.
- Typed configuration via `TwentyConfigService`.

## Current Routing Status

- `packages/twenty-server` is mapped as a core monorepo leaf surface.
- The `packages/` index surface must be consulted before entering this surface.
- No pre-existing local `AGENTS.md` file existed before this wave.

## How To Use This Surface

Use `packages/twenty-server` for backend code work such as:

- adding or modifying NestJS modules, services, controllers, or resolvers
- creating TypeORM entities, migrations, instance commands, or workspace commands
- adjusting GraphQL schema, resolvers, or DTOs
- working on queue workers, job processors, or background processing
- modifying backend auth, config, or server-scoped infrastructure
- running database commands, migrations, or server-side tests

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- frontend application code in `packages/twenty-front`
- shared type/utility code in `packages/twenty-shared`
- UI component library code in `packages/twenty-ui`

If the prompt is about those topics, go back to `../../index.md` and reroute.

