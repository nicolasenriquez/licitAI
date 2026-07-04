---
type: context
title: "Twenty E2E Testing Context"
description: "Context and scope guide for Twenty E2e Testing."
okf_version: "0.1"
---
# Twenty E2E Testing Context

## Purpose

Describe the role of `packages/twenty-e2e-testing` during the workspace routing rollout.

## What Lives Here

- End-to-end tests for Twenty using Playwright.
- E2E test specs, fixtures, page objects, and test utilities.
- Playwright configuration, test runner setup, and CI test pipeline integration.

## Current Routing Status

- `packages/twenty-e2e-testing` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-e2e-testing` for E2E testing work such as:

- adding or modifying Playwright test specs
- adjusting test fixtures, page objects, or utility helpers
- working on Playwright config or CI test pipeline setup

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or unit test code in other packages

If the prompt is about those topics, go back to `../../index.md` and reroute.

