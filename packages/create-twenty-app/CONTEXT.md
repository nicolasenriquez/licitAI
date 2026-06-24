# Create Twenty App Context

## Purpose

Describe the role of `packages/create-twenty-app` during the workspace routing rollout.

## What Lives Here

- The `create-twenty-app` scaffolder — generates new Twenty app packages from templates.
- Scaffolding logic, generators, and project template files.
- Init scripts and CLI entrypoints for bootstrapping new apps.
- Template files under `src/constants/template/` (shipped to generated apps).

## Current Routing Status

- `packages/create-twenty-app` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.
- A pre-existing `AGENTS.md` exists under `src/constants/template/AGENTS.md` — this is a template shipped to generated apps, not a surface contract. Harmonize separately.

## How To Use This Surface

Use `packages/create-twenty-app` for scaffolder work such as:

- adding or modifying app generation logic
- updating project templates or boilerplate
- adjusting init scripts or CLI scaffolding commands

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- runtime backend, frontend, or UI code in other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
