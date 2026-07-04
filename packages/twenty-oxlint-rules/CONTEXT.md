---
type: context
title: "Twenty Oxlint Rules Context"
description: "Context and scope guide for Twenty Oxlint Rules."
okf_version: "0.1"
---
# Twenty Oxlint Rules Context

## Purpose

Describe the role of `packages/twenty-oxlint-rules` during the workspace routing rollout.

## What Lives Here

- Custom oxlint rules for the Twenty monorepo.
- Rule definitions, rule tests, and linting configuration.
- Oxford linter integration and rule publishing pipeline.

## Current Routing Status

- `packages/twenty-oxlint-rules` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-oxlint-rules` for linting infrastructure work such as:

- adding or modifying custom oxlint rules
- adjusting rule tests or linting configuration
- working on oxlint integration or rule publishing

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or application code in other packages

If the prompt is about those topics, go back to `../../index.md` and reroute.

