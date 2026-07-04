---
type: agent-contract
title: "Twenty Emails Surface Contract"
description: "Routing contract for Twenty Emails."
okf_version: "0.1"
---
# Twenty Emails Surface Contract

## Purpose

Define when work should stay inside `packages/twenty-emails` during the workspace routing rollout.

## Stay In `packages/twenty-emails` When

- The task is about the Twenty email templates package.
- The task is to add, modify, or remove React Email templates, email components, or email styling.
- The task is about email template rendering, email transport configuration, or email package build configuration.
- The task is package-scoped email template code rather than application code, OpenSpec changes, or architecture docs.

## Required Reads

Before substantive work in this surface, read:

1. `../../AGENTS.md`
2. `../../index.md`
3. `../AGENTS.md`
4. `../CONTEXT.md`
5. `AGENTS.md`
6. `CONTEXT.md`
7. The specific email template or component files relevant to the task

## Bounce Back To Root When

- The prompt is about active OpenSpec change work.
- The prompt is about durable repository architecture, governance, or ADR docs under root `docs/`.
- The prompt is about backend server code, frontend app code, or UI component library code rather than email template code.
- The prompt is general package selection rather than `twenty-emails` specifically.

When that happens, return to `../../index.md` first and reroute from there. Do not keep working from `packages/twenty-emails`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `packages/twenty-emails`.
- Preserve the distinction between email template package code and application-specific or infrastructure-docs work.

