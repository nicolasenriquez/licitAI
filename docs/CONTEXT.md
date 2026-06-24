# Docs Context

## Purpose

Describe the role of `docs/` in this repository during the workspace routing pilot.

## What Lives Here

- `README.md` is the documentation index and reading-path entrypoint.
- `architecture/` captures current state, reference architecture, repository strategy, data model, security, and technology standards.
- `business/` captures domain-specific context and source contracts.
- `governance/` captures AI-assisted delivery, domain operating model, and shared decision rules.
- `operations/` captures the command surface, local development, data operations, and other runbook-style guidance.
- `decisions/` contains ADRs and the ADR index.
- `standards/` contains the authoritative language and tooling standards.
- `design/`, `templates/`, and `vision-product.md` add design-system and product-context depth.

## Current Routing Status

- `docs/` is a validated pilot surface (wave 0).

## How To Use This Surface

For most documentation-led tasks, prefer this order:

1. `README.md`
2. The sub-area that matches the prompt
3. `decisions/` when a shared architectural decision is involved
4. `standards/` when a technology rule is involved

## Scope Boundary

This surface is for durable repository documentation and shared context.

It is not the working surface for:

- active OpenSpec change artifacts under `openspec/`
- OpenSpec task status updates under `openspec/`
- apply/archive/sync change actions under `openspec/`
- package-scoped code work under `packages/`

If the prompt is about those topics, go back to `../CONTEXT-MAP.md` and reroute.
