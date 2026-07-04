---
type: agent-contract
title: Codex Surface Contract
description: Routing contract for repo-local Codex commands, skills, and workflow assets.
---

# Codex Surface Contract

## Purpose

Define when work should stay inside `.codex` during the workspace routing rollout.

## Stay In `.codex` When

- The task is about repo-local Codex commands or repo-local Codex skills.
- The task is to add, update, or review files under `.codex/commands/` or `.codex/skills/`.
- The task is about Codex-oriented repo automation, local command UX, or local skill scaffolding in this checkout.
- The task is about repo-local Codex behavior, not the published plugin package.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../index.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. `index.md`
6. The specific command `SKILL.md` or skill `SKILL.md` relevant to the task

## Bounce Back To Root When

- The prompt is about the published plugin package in `packages/twenty-codex-plugin`.
- The prompt is about durable repository docs or OpenSpec change work.
- The prompt is general package routing rather than repo-local Codex configuration.

When that happens, return to `../index.md` first and reroute from there. Do
not keep working from `.codex`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `.codex`.
- Preserve the distinction between repo-local Codex assets and the published plugin package.
