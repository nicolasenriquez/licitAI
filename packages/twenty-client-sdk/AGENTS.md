---
type: agent-contract
title: "Twenty Client SDK Surface Contract"
description: "Routing contract for Twenty Client Sdk."
okf_version: "0.1"
---
# Twenty Client SDK Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-client-sdk` during the workspace routing rollout.

## Stay In `packages/twenty-client-sdk` When

- The task is about the Twenty Client SDK package.
- The task is to add, modify, or remove client SDK exports, type definitions, or public API surface.
- The task is about client SDK build configuration, package publishing, or export maps.
- The task is package-scoped client SDK code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific client SDK module files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or other package code rather than client SDK code.
- The prompt is general package selection rather than `twenty-client-sdk` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-client-sdk`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-client-sdk`.
- Preserve the distinction between client SDK package code and application-specific or infrastructure-docs work.

