---
type: agent-contract
title: Codex Surface Contract
description: Routing contract for repo-local Codex commands, skills, and workflow assets.
---

# Codex Surface Contract

## Purpose

Define when work should stay inside `.codex` during the workspace routing rollout.

## Stay In `.codex` When

- The task is about native repo-local Codex commands or Codex-specific adapters.
- The task is to add, update, or review files under `.codex/commands/`.
- The task is about Codex-oriented repo automation, local command UX, or local skill scaffolding in this checkout.
- The task is about repo-local Codex behavior, not the published plugin package.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../index.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. `index.md`
6. The specific command or adapter file relevant to the task

## Bounce Back To Root When

- The prompt is about the published plugin package in `packages/twenty-codex-plugin`.
- The prompt is about durable repository docs or OpenSpec change work.
- The prompt is about canonical skill instructions under `.agents/skills/`.
- The prompt is general package routing rather than repo-local Codex configuration.

When that happens, return to `../index.md` first and reroute from there. Do
not keep working from `.codex`.

## Working Contract

- Declare consulted routing/context files briefly only when required by the
  root contract. Keep the declaration minimal and avoid adding routine routing
  breadcrumbs to normal user-facing closeout messages unless the routing choice
  is material to the task.
- When referencing files inside this repository in user-facing responses, follow the root `AGENTS.md` repository path-style rule.
- Use repository-relative paths in user-visible text by default.
- If a clickable markdown file link requires an absolute target, keep the visible link label repository-relative and use the absolute path only in the target.
- Do not print raw absolute filesystem paths in prose unless explicitly requested by the user or required because the path is outside the repository.
- State that the selected surface is `.codex`.
- Preserve the distinction between native Codex assets, canonical `.agents/skills/`, and the published plugin package.
