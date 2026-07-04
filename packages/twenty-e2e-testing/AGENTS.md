---
type: agent-contract
title: "Twenty E2E Testing Surface Contract"
description: "Routing contract for Twenty E2e Testing."
okf_version: "0.1"
---
# Twenty E2E Testing Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-e2e-testing` during the workspace routing rollout.

## Stay In `packages/twenty-e2e-testing` When

- The task is about end-to-end testing with Playwright.
- The task is to add, modify, or remove E2E test specs, fixtures, or test utilities.
- The task is about Playwright configuration, test runners, or CI test pipelines.
- The task is package-scoped testing code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific test spec, fixture, or config files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or unit test code rather than E2E test code.
- The prompt is general package selection rather than `twenty-e2e-testing` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-e2e-testing`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-e2e-testing`.
- Preserve the distinction between E2E testing code and application-specific or infrastructure-docs work.

