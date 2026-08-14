---
type: readme
title: "Architecture Decision Records"
description: "README for the repository decision record set."
okf_version: "0.1"
---
# Architecture Decision Records

## When To Create Or Update An ADR

Create an ADR when:
- A shared architectural rule is established or changed.
- A technology choice affects multiple packages.
- A cross-cutting concern (security, data, deployment) requires documented rationale.
- An existing decision is superseded by a new one.

Update an ADR when:
- The decision is superseded (change status to Superseded, link to new ADR).
- New consequences or constraints are discovered.

## Naming Convention

Zero-padded numeric prefix: `0001-<kebab-case-title>.md`. Numbers are sequential by acceptance date.

## Required ADR Sections

| Section | Description |
| --- | --- |
| Status | Proposed / Accepted / Deprecated / Superseded. Include date. |
| Purpose | Why this ADR exists. One sentence. |
| Context | The problem being solved. What forces drove this decision. |
| Decision | What was decided. Specific rules and constraints. |
| Consequences | Positive outcomes, costs, and constraints that result from the decision. |
| Alternatives Considered | What other options were evaluated and why they were rejected. |
| Related Documents | Links to other docs in the harness. |

## Current ADRs

| # | Title | Status |
|---|-------|--------|
| 0001 | Nx Monorepo with Yarn 4 Workspaces | Accepted (2026-06-20) |
| 0002 | NestJS + TypeORM + PostgreSQL Backend Stack | Accepted (2026-06-20) |
| 0003 | Metadata-Driven UI with Runtime GraphQL Schema Generation | Accepted (2026-06-20) |
| 0004 | Per-Workspace PostgreSQL Schema Isolation | Accepted (2026-06-20) |
| 0005 | Deployment-Local Mercado Publico Schema | Accepted (2026-06-20) |
| 0007 | Local CI Surface via justfile | Proposed (2026-07-30) |
| 0008 | AI Context Management | Proposed (2026-08-12) |
