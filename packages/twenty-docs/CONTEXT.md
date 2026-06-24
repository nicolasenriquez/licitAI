# Twenty Docs Context

## Purpose

Describe the role of `packages/twenty-docs` during the workspace routing rollout.

## What Lives Here

- The public documentation site for Twenty, powered by Mintlify.
- User guide content under `user-guide/`.
- Developer documentation under `developers/`.
- `twenty-ui` package documentation under `twenty-ui/`.
- Navigation structure and translation-related docs artifacts under `navigation/`, `l/`, and generated `docs.json`.
- Docs package scripts, validation entrypoints, and package-local static assets.

## Current Routing Status

- `packages/twenty-docs` is mapped as a docs-heavy leaf surface (wave 2).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-docs` for public docs-site work such as:

- editing content pages
- updating navigation structure
- adjusting docs-site assets and local package config
- validating docs-site generation or structure at the package level

## Scope Boundary

This surface is not the durable home for:

- root repository architecture, governance, or ADR docs under `docs/`
- active OpenSpec artifacts under `openspec/`
- package selection for unrelated packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
