---
type: agent-contract
title: "Create Twenty App Surface Contract"
description: "Routing contract for Create Twenty App."
okf_version: "0.1"
---
# Create Twenty App Surface Contract

## Purpose

Define when work should stay inside `packages/create-twenty-app` during the workspace routing rollout.

## Stay In `packages/create-twenty-app` When

- The task is about the `create-twenty-app` scaffolder package.
- The task is to add, modify, or remove scaffolding logic, templates, or generators.
- The task is about the app creation CLI, init scripts, or project template files.
- The task is package-scoped scaffolder code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific template, script, or generator files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or runtime code rather than scaffolding logic.
- The prompt is general package selection rather than `create-twenty-app` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/create-twenty-app`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/create-twenty-app`.
- Preserve the distinction between scaffolder package code and runtime application or infrastructure-docs work.
- The `src/constants/template/AGENTS.md` file is a template shipped to generated apps and must be harmonized separately.
