---
type: context
title: "Twenty Website Context"
description: "Context and scope guide for Twenty Website."
okf_version: "0.1"
---
# Twenty Website Context

## Purpose

Describe the role of `packages/twenty-website` during the workspace routing rollout.

## What Lives Here

- The Twenty marketing website — a Next.js application.
- Website pages, components, styles, and public-facing content.
- Next.js build configuration, routing, and deployment metadata.

## Current Routing Status

- `packages/twenty-website` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-website` for marketing website work such as:

- adding or modifying website pages and components
- adjusting website styles, content, or copy
- working on Next.js build config or deployment

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend CRM, frontend CRM, or UI library code in other packages

If the prompt is about those topics, go back to `../../index.md` and reroute.

