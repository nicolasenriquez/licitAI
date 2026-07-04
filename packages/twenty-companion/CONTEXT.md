---
type: context
title: "Twenty Companion Context"
description: "Context and scope guide for Twenty Companion."
okf_version: "0.1"
---
# Twenty Companion Context

## Purpose

Describe the role of `packages/twenty-companion` during the workspace routing rollout.

## What Lives Here

- The Twenty Companion — companion service for Twenty.
- Companion logic, integration handlers, and configuration.
- Companion build configuration and package metadata.

## Current Routing Status

- `packages/twenty-companion` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-companion` for companion work such as:

- adding or modifying companion service logic
- adjusting integration handlers or companion config
- working on companion build or deployment

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or UI library code in other packages

If the prompt is about those topics, go back to `../../index.md` and reroute.

