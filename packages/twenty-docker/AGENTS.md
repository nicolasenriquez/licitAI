# Twenty Docker Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-docker` during the workspace routing rollout.

## Stay In `packages/twenty-docker` When

- The task is about Docker configuration for Twenty.
- The task is to add, modify, or remove Dockerfiles, docker-compose files, or container configuration.
- The task is about Docker image building, container orchestration, or development environment containers.
- The task is package-scoped Docker infrastructure work rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../CONTEXT-MAP.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific Docker or compose files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about application code, backend services, or frontend components rather than container infrastructure.
- The prompt is general package selection rather than `twenty-docker` specifically.

When that happens, return to `../../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `packages/twenty-docker`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-docker`.
- Preserve the distinction between Docker/container infrastructure and application-specific or infrastructure-docs work.
