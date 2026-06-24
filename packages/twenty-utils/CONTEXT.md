# Twenty Utils Context

## Purpose

Describe the role of `packages/twenty-utils` during the workspace routing rollout.

## What Lives Here

- Repository utility scripts and development environment tooling.
- The `setup-dev-env.sh` script — idempotent dev environment bootstrap (Postgres + Redis + databases + .env + migrations).
- Helper utilities and operational scripts for local development.

## Current Routing Status

- `packages/twenty-utils` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-utils` for utility/scripts work such as:

- modifying the dev environment setup script
- adding or adjusting helper utilities
- working on local development tooling

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or application code in other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
