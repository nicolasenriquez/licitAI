---
type: context
title: OpenCode Surface Context
description: Scope and reading order for repo-local OpenCode assets.
---

# OpenCode Context

## Purpose

Describe the role of `.opencode` during the workspace routing rollout.

## What Lives Here

- Repo-local OpenCode configuration and tooling.
- Native OpenCode commands under `.opencode/commands/` (if any).
- OpenCode-specific adapters that cannot live portably in `.agents/skills/`.
- Per-repo OpenCode operating assets that are local to this checkout.

## Current Routing Status

- `.opencode` is mapped as an AI-tooling surface (wave 5).

## How To Use This Surface

Use `.opencode` for:

- editing repo-local OpenCode commands
- shaping local OpenCode workflows and configuration tied to this repo

## Scope Boundary

This surface is not the durable home for:

- canonical repository skills under `.agents/skills/`
- native Codex commands or adapters in `.codex/`
- root repository baseline docs under `docs/`
- OpenSpec change artifacts under `openspec/`
- the published plugin package in `packages/twenty-codex-plugin`
- general package selection under `packages/`

If the prompt is about those topics, go back to `../index.md` and reroute.
