# Twenty Docker Context

## Purpose

Describe the role of `packages/twenty-docker` during the workspace routing rollout.

## What Lives Here

- Docker configuration for the Twenty development environment.
- Dockerfiles, docker-compose files, and container orchestration.
- Development environment container images and service definitions.

## Current Routing Status

- `packages/twenty-docker` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-docker` for container infrastructure work such as:

- adding or modifying Dockerfiles or compose files
- adjusting container configuration or service definitions
- working on Docker image building or dev environment containers

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- application code in backend, frontend, or other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
