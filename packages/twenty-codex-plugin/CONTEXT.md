---
type: context
title: "Twenty Codex Plugin Context"
description: "Context and scope guide for Twenty Codex Plugin."
okf_version: "0.1"
---
# Twenty Codex Plugin Context

## Purpose

Describe the role of `packages/twenty-codex-plugin` during the workspace routing rollout.

## What Lives Here

- The published Codex marketplace plugin for Twenty.
- Cross-skill guidance in `AGENTS.md`.
- Plugin manifest and packaging files under `.codex-plugin/`.
- Skill entry files under `skills/`.
- Reference docs under `references/`.
- Scripts, templates, checklist, changelog, and package-level validation assets.

## Current Routing Status

- `packages/twenty-codex-plugin` is mapped as an AI-tooling leaf surface (wave 3).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-codex-plugin` for:

- editing the published plugin package itself
- updating plugin skills, references, scripts, templates, or manifest packaging
- validating or documenting the plugin package lifecycle

## Scope Boundary

This surface is not the durable home for:

- repo-local `.agents` skills and workflow assets
- root repository docs under `docs/`
- OpenSpec change artifacts
- general package selection work in `packages/`

If the prompt is about those topics, go back to `../../index.md` and reroute.
