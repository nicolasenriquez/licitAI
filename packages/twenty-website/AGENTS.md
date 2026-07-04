---
type: agent-contract
title: "Twenty Website Surface Contract"
description: "Routing contract for Twenty Website."
okf_version: "0.1"
---
# Twenty Website Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-website` during the workspace routing rollout.

## Stay In `packages/twenty-website` When

- The task is about the marketing website for Twenty.
- The task is to add, modify, or remove website pages, components, styles, or content.
- The task is about the Next.js website build configuration, routing, or deployment.
- The task is package-scoped website code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific page, component, or config files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend CRM app code, or UI component library code rather than website code.
- The prompt is general package selection rather than `twenty-website` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-website`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-website`.
- Preserve the distinction between website code and application-specific or infrastructure-docs work.

