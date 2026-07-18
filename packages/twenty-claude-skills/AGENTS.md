---
type: agent-contract
title: "Twenty Claude Skills Surface Contract"
description: "Routing contract for Twenty Claude Skills."
okf_version: "0.1"
---
# Twenty Claude Skills Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-claude-skills` during the workspace routing rollout.

## Stay In `packages/twenty-claude-skills` When

- The task is about package-scoped Claude skills shipped in this repo.
- The task is to add, update, review, or structure files under `skills/`.
- The task is to adjust package-local README or skill packaging concerns for `twenty-claude-skills`.
- The task is about skill behavior boundaries inside this package rather than general repo docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. `README.md`
8. The specific `skills/<name>/SKILL.md` or related package files relevant to the task

## Bounce Back To Root When

- The prompt is about broader AI-tooling surfaces rather than this package specifically.
- The prompt is about durable repository docs or OpenSpec change work.
- The prompt is general package selection rather than `twenty-claude-skills` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-claude-skills`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-claude-skills`.
- Preserve the distinction between this package's Claude skills and the separate plugin tooling surface.

