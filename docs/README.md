---
type: readme
title: Documentation Baseline
description: Durable baseline, reading paths, and documentation layers for the repository.
---

# Documentation Baseline

## Purpose
Provide a single navigation layer for Twenty CRM monorepo documentation. This index organizes the current state, the target state, major architectural decisions, and operational rules that AI agents and engineers should follow.

## Primary Audience
AI agents (Claude Code, Codex), engineers, architects, and reviewers working on the Twenty CRM monorepo.

## Executive Summary
Twenty is a mature, production-grade open-source CRM with a 22-package Nx
monorepo, full CI/CD pipelines, and a metadata-driven architecture. This
repository now exposes a coherent internal documentation baseline that
consolidates architecture, decisions, governance, and operations. Root
`AGENTS.md` remains the operational entrypoint, root `index.md` is the
canonical routing map, and `docs/` adds depth, traceability, and durable
context.

## Documentation Structure

| Area | File Or Folder | What It Covers |
| --- | --- | --- |
| Product vision | `vision-product.md` | Why Twenty exists, who it serves, product register, and MVP scope. |
| Business | `business/` | Procurement domain: business case, lifecycle, source contracts, workflows, and market positioning for Mercado Publico / ChileCompra data ingestion. |
| Architecture | `architecture/` | Current state, target state, reference architecture, data model, security, and repository strategy. |
| Docs topology | `architecture/documentation-topology.md` | OKF bundle shape, index hierarchy, and documentation topology. |
| Design | `design/` | Design system, visual tokens, interaction patterns, and wireframe grammar. |
| Governance | `governance/` | Ownership, decision boundaries, AI-assisted delivery rules, context management, and domain operating model. |
| Operations | `operations/` | Local development, command surface, database operations, CI/CD, release expectations, and documentation authoring guidance. |
| Decisions | `decisions/` | ADR index and repository-level architectural decisions. |
| Templates | `templates/` | Standard templates for ADR creation and governance assets. |
| Standards | `standards/` | Technology-specific standards plus repository documentation standards such as OKF adoption guidance. |

## Reading Paths

### For AI agents (onboarding)

1. `../CLAUDE.md` — Fast operational rules (dev workflow, testing, lint commands)
2. `../index.md` — Canonical root routing map
3. `index.md` — `docs/` routing index
4. `architecture/current-state.md` — What Twenty is today (packages, stack, architecture)
5. `architecture/reference-architecture.md` — Architecture diagram and integration rules
6. `architecture/repository-strategy.md` — Monorepo layout, package dependencies, build order
7. `architecture/data-model.md` — Multi-tenant data model, entities, field types
8. `architecture/security-and-identity.md` — Authentication, RBAC, RLS, guards
9. `architecture/documentation-topology.md` — Documentation topology and index hierarchy
10. `vision-product.md` — Product context and scope
11. `governance/ai-assisted-delivery.md` — Agent guardrails and delivery workflow
12. `governance/ai-context-management.md` — Context and handoff rules
13. `operations/command-surface.md` — Developer command contract
14. `operations/local-development.md` — Local setup and runtime
15. `operations/okf-authoring-guide.md` — Safe additive documentation authoring rules
16. `design/design-system.md` — Visual and interaction rules
17. `standards/okf-standard.md` — Repository OKF taxonomy and frontmatter rules
18. `decisions/` — Key architectural decisions with rationale
19. `../.cursor/rules/` — Cursor-specific development rules (16 `.mdc` files)

### For architecture and delivery

1. `architecture/current-state.md`
2. `architecture/reference-architecture.md`
3. `architecture/data-model.md`
4. `architecture/security-and-identity.md`
5. `architecture/technology-standards.md`
6. `architecture/repository-strategy.md`
7. `operations/command-surface.md`
8. `operations/local-development.md`
9. `operations/data-operations.md`
10. `governance/domain-operating-model.md`

### For product and business context

1. `vision-product.md`
2. `business/business-case.md`
3. `business/marketing-positioning.md`
4. `business/licitacion-lifecycle.md`
5. `business/quote-and-bid-workflow.md`

## Current State

| Topic | Current State |
| --- | --- |
| Repository maturity | Production-grade. 22 packages, full CI/CD (40+ GitHub Actions workflows), published SDK (`twenty-sdk` v2.15.0), Docker Compose + Kubernetes Helm charts. |
| Product maturity | Active. Twenty Cloud available at twenty.com. Self-hosting supported. App ecosystem with internal, community, and example apps. |
| Architecture maturity | High but implicit. Architecture is visible in code and `CLAUDE.md` but not consolidated in a single durable document. |
| Documentation maturity | Structured. Public docs at docs.twenty.com (Mintlify), root routing via `AGENTS.md` + `index.md`, and an internal baseline under `docs/`. |
| Technical certainty | High. Stack is ratified: NestJS 11, React 19, TypeScript strict, PostgreSQL 16, Redis 7, BullMQ, GraphQL Yoga, Jotai, Linaria, Nx. |
| Data certainty | High. Multi-tenant per-workspace PostgreSQL schemas. Metadata-driven object/field model. Instance command migration system. |

## Target State

- AI agents can onboard from `docs/` alone, using `CLAUDE.md` for fast lookups.
- Architecture decisions are traceable through ADRs with rationale and alternatives.
- Shared rules are explicit and documented, not implicit in code or tribal knowledge.
- Engineers can challenge architecture decisions with documented evidence.
- The documentation baseline is maintained alongside code, not retroactively patched.

## How The Documentation Layers Relate

| Artifact | Role |
| --- | --- |
| `CLAUDE.md` | Fast operational rules for AI agents and engineers. Shortest path to working commands. |
| `index.md` | Canonical routing map from the root contract into mapped documentation surfaces. |
| `docs/index.md` | Local routing index for durable repository docs before leaf documents. |
| `docs/` | Durable repository context and operating baseline. Architecture, governance, operations. |
| `docs/governance/ai-context-management.md` | Detailed rules for context size, degradation signals, clearing, compaction, and handoff. |
| `docs/standards/okf-standard.md` | Documentation taxonomy, frontmatter contract, and index rules for this repository. |
| `docs/architecture/documentation-topology.md` | OKF bundle shape, surface model, and ordering rules. |
| `docs/operations/okf-authoring-guide.md` | Safe additive update policy for future documentation work. |
| `docs/decisions/` | Traceable long-lived decisions and supersession history. ADR format. |
| `.cursor/rules/` | Reusable per-technology rules for Cursor IDE. 16 `.mdc` files covering TypeScript, NestJS, React, testing, etc. |
| `packages/twenty-docs/` | Public-facing documentation site (Mintlify). User guides, developer guides, API reference. Distinct from internal `docs/`. |

## Required Inputs

- Explicit non-functional requirements (SLOs, SLAs, performance budgets).
- Formal decision records for the 4 foundational ADRs: Nx monorepo, NestJS+TypeORM, metadata-driven UI, per-workspace schema.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Source of truth for technology standards | `docs/standards/` is authoritative. `.cursor/rules/` serves as indexes referencing `docs/standards/` without duplicating content. `CLAUDE.md` remains fast operational reference. |
| First ADRs to formalize | Four foundational ADRs: Nx monorepo choice, NestJS + TypeORM, metadata-driven UI, per-workspace schema isolation. |
| Review process for `docs/` | Same PR process as code: review required, approval before merge. |
| CI gates for `docs/` | Link checker only. Prevents broken references without adding unnecessary friction. |

## Open Decisions

- Should there be a build step to auto-generate `.cursor/rules/` from `docs/standards/`?
- What is the migration timeline for converting `.cursor/rules/` `.mdc` files into index references?
