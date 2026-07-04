---
type: context
title: "Twenty Zapier Context"
description: "Context and scope guide for Twenty Zapier."
okf_version: "0.1"
---
# Twenty Zapier Context

## Purpose

Describe the role of `packages/twenty-zapier` during the workspace routing rollout.

## What Lives Here

- The Twenty Zapier integration — connects Twenty to the Zapier platform.
- Zapier triggers, actions, authentication logic, and app definition.
- Zapier platform configuration and deployment metadata.

## Current Routing Status

- `packages/twenty-zapier` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-zapier` for Zapier integration work such as:

- adding or modifying Zapier triggers and actions
- adjusting Zapier authentication or app definition
- working on Zapier platform configuration or deployment

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or other package code in the monorepo

If the prompt is about those topics, go back to `../../index.md` and reroute.

