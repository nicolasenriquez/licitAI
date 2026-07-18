---
type: context
title: Codex Surface Context
description: Scope and reading order for repo-local Codex assets.
---

# Codex Context

## Purpose

Describe the role of `.codex` during the workspace routing rollout.

## What Lives Here

- Native repo-local Codex commands under `.codex/commands/`.
- Codex-specific adapters that cannot live portably in `.agents/skills/`.
- Per-repo Codex operating assets that are local to this checkout rather than published as a marketplace plugin.

## Current Routing Status

- `.codex` is mapped as an AI-tooling surface (wave 3).

## How To Use This Surface

Use `.codex` for:

- editing repo-local Codex commands
- editing Codex-specific adapters
- shaping local Codex command UX tied to this repo

## Scope Boundary

This surface is not the durable home for:

- canonical repository skills under `.agents/skills/`
- the published plugin package in `packages/twenty-codex-plugin`
- root repository baseline docs under `docs/`
- OpenSpec change artifacts under `openspec/`
- general package selection under `packages/`

If the prompt is about those topics, go back to `../index.md` and reroute.
