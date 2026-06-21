# Documentation Baseline

## Purpose
Provide a single navigation layer for Twenty CRM monorepo documentation. This index organizes the current state, the target state, major architectural decisions, and operational rules that AI agents and engineers should follow.

## Primary Audience
AI agents (Claude Code, Codex), engineers, architects, and reviewers working on the Twenty CRM monorepo.

## Executive Summary
Twenty is a mature, production-grade open-source CRM with a 22-package Nx monorepo, full CI/CD pipelines, and a metadata-driven architecture. This repository did not previously contain a coherent internal documentation baseline consolidating architecture, decisions, governance, and operations. This index organizes that baseline. The existing `CLAUDE.md` at the repo root remains the fast operational reference for AI agents; `docs/` adds depth, traceability, and durable context.

## Documentation Structure

| Area | File Or Folder | What It Covers |
| --- | --- | --- |
| Product vision | `vision-product.md` | Why Twenty exists, who it serves, product register, and MVP scope. |
| Business | `business/` | Procurement domain: business case, lifecycle, source contracts, workflows, and market positioning for Mercado Publico / ChileCompra data ingestion. |
| Architecture | `architecture/` | Current state, target state, reference architecture, data model, security, and repository strategy. |
| Design | `design/` | Design system, visual tokens, interaction patterns, and wireframe grammar. |
| Governance | `governance/` | Ownership, decision boundaries, AI-assisted delivery rules, and domain operating model. |
| Operations | `operations/` | Local development, command surface, database operations, CI/CD, and release expectations. |
| Decisions | `decisions/` | ADR index and repository-level architectural decisions. |
| Templates | `templates/` | Standard templates for ADR creation and governance assets. |
| Standards | `standards/` | Technology-specific standards for TypeScript, NestJS, React, GraphQL, testing, and tooling. |

## Reading Paths

### For AI agents (onboarding)

1. `../CLAUDE.md` — Fast operational rules (dev workflow, testing, lint commands)
2. `architecture/current-state.md` — What Twenty is today (packages, stack, architecture)
3. `architecture/reference-architecture.md` — Architecture diagram and integration rules
4. `architecture/repository-strategy.md` — Monorepo layout, package dependencies, build order
5. `architecture/data-model.md` — Multi-tenant data model, entities, field types
6. `architecture/security-and-identity.md` — Authentication, RBAC, RLS, guards
7. `vision-product.md` — Product context and scope
8. `governance/ai-assisted-delivery.md` — Agent guardrails and delivery workflow
9. `operations/command-surface.md` — Developer command contract
10. `operations/local-development.md` — Local setup and runtime
11. `design/design-system.md` — Visual and interaction rules
12. `decisions/` — Key architectural decisions with rationale
13. `../.cursor/rules/` — Cursor-specific development rules (16 `.mdc` files)

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
| Documentation maturity | Partial. Public docs at docs.twenty.com (Mintlify). `CLAUDE.md` for AI agents. No internal architecture baseline. |
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
| `docs/` | Durable repository context and operating baseline. Architecture, governance, operations. |
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
