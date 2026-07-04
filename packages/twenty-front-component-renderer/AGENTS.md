---
type: agent-contract
title: "Twenty Front Component Renderer Surface Contract"
description: "Routing contract for Twenty Front Component Renderer."
okf_version: "0.1"
---
# Twenty Front Component Renderer Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-front-component-renderer` during the workspace routing rollout.

## Stay In `packages/twenty-front-component-renderer` When

- The task is about the frontend component renderer package.
- The task is to add, modify, or remove component rendering logic, rendering pipelines, or renderer configuration.
- The task is about rendering integration with app components or the renderer build configuration.
- The task is package-scoped renderer code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific renderer module files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or UI component library code rather than renderer code.
- The prompt is general package selection rather than `twenty-front-component-renderer` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-front-component-renderer`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-front-component-renderer`.
- Preserve the distinction between renderer package code and application-specific or infrastructure-docs work.

