---
type: context
title: "Twenty Claude Skills Context"
description: "Context and scope guide for Twenty Claude Skills."
okf_version: "0.1"
---
# Twenty Claude Skills Context

## Purpose

Describe the role of `packages/twenty-claude-skills` during the workspace routing rollout.

## What Lives Here

- A package of Claude-oriented skills for working with Twenty.
- Skill entry files under `skills/<skill-name>/SKILL.md`.
- Package-local README and package metadata.

## Current Routing Status

- `packages/twenty-claude-skills` is mapped as a docs-heavy leaf surface (wave 2).
- The `packages/` index surface must be consulted before entering this surface.
- The package currently exposes skill files such as `skills/twenty-record-presentation/SKILL.md`.
- This is a package-scoped skill surface, not the root `.codex` configuration surface and not the `twenty-codex-plugin` surface.

## How To Use This Surface

Use `packages/twenty-claude-skills` for:

- skill authoring or maintenance inside this package
- package-local skill documentation
- package-local structure and packaging decisions tied to Claude skills

## Scope Boundary

This surface is not the durable home for:

- root `.codex` routing or local Codex configuration
- `packages/twenty-codex-plugin` plugin-runtime guidance
- root `docs/` baseline docs
- OpenSpec artifacts

If the prompt is about those topics, go back to `../../index.md` and reroute.

