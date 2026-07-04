---
type: context
title: "Twenty Apps Context"
description: "Context and scope guide for Twenty Apps."
okf_version: "0.1"
---
# Twenty Apps Context

## Purpose

Describe the role of `packages/twenty-apps` during the workspace routing rollout.

## What Lives Here

- The Twenty apps collection — all app packages live under this directory.
- Internal apps: twenty-slack, twenty-partners, self-hosting, twenty-for-twenty, people-data-labs, twenty-fireflies, twenty-meeting-bot, exa, twenty-linear, twenty-discord, twenty-last-contact, call-recording.
- Community apps: github-connector.
- Example and fixture apps: hello-world, postcard, rich-app, minimal-app, invalid-app, function-execute-app.

## Current Routing Status

- `packages/twenty-apps` is mapped as an apps-collection index surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.
- Individual app subdirectories are not yet individually mapped.
- Pre-existing `AGENTS.md` files exist in `internal/twenty-last-contact` and `internal/twenty-meeting-bot` — harmonize before those apps become first-class surfaces.

## How To Use This Surface

Use `packages/twenty-apps` for app collection work such as:

- adding or removing app subdirectories
- reorganizing app grouping or discovering app structure
- working on app-level routing or collection-level concerns
- selecting an app subdirectory as a leaf surface (once individually mapped)

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or core monorepo code in other packages

If the prompt is about those topics, go back to `../../index.md` and reroute.

