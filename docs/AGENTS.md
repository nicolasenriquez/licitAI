---
type: agent-contract
title: Docs Surface Contract
description: Routing contract for durable repository documentation work.
---

# Docs Surface Contract

## Purpose

Define when work should stay inside `docs/` during the workspace routing pilot.

## Stay In `docs/` When

- The task is to understand or update repository architecture, business context, governance, operations, standards, or ADRs.
- The task is documentation-first analysis that should use the durable repository baseline.
- The task is to cross-check current state, target state, or shared rules documented under `docs/`.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../index.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. `index.md`
6. `README.md`
7. The specific docs subfiles relevant to the prompt

## Bounce Back To Root When

- The prompt is about an active OpenSpec change or change artifacts under `openspec/`.
- The task is to apply, archive, or sync an OpenSpec change.
- The task is general repo code work under `packages/` that is not documentation-led.

When that happens, return to `../index.md` first and reroute from there. Do
not keep working from `docs/`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `docs/`.
- Prefer documented repository truth over assumptions or memory.
