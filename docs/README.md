---
type: readme
title: Documentation Baseline
description: Durable baseline, reading paths, and documentation layers for the repository.
okf_version: "0.1"
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
| CRM dossier baseline | `business/crm-dossier-playwright-baseline.md` | Read-only user flow and Playwright evidence for the seeded CRM demonstration workspace. |
| Architecture | `architecture/` | Current state, target state, reference architecture, data model, security, and repository strategy. |
| Docs topology | `architecture/documentation-topology.md` | OKF bundle shape, index hierarchy, and documentation topology. |
| Agent documentation workflow | `architecture/agent-context-and-documentation-workflows.md` | Evidence model, ICM evaluation, and documentation-audit pilot. |
| Design | `design/` | Design system, visual tokens, interaction patterns, and wireframe grammar. |
| Governance | `governance/` | Ownership, decision boundaries, AI-assisted delivery rules, context management, and domain operating model. |
| Documentation authority | `governance/documentation-authority.md` | Canonical sources, owners, review triggers, and verifiers for shared docs. |
| Operations | `operations/` | Local development, command surface, database operations, CI/CD, release expectations, and documentation authoring guidance. |
| Decisions | `decisions/` | ADR index and repository-level architectural decisions. |
| Templates | `templates/` | Standard templates for ADR creation and governance assets. |
| Standards | `standards/` | Technology-specific standards plus repository documentation standards such as OKF adoption guidance. |

## Reading Paths

### For AI agents (onboarding)

1. `../AGENTS.md` — Canonical operational entrypoint.
2. `../index.md` — Canonical root routing map.
3. `AGENTS.md` — `docs/` contract.
4. `CONTEXT.md` — `docs/` scope and reading order.
5. `index.md` — `docs/` routing index.
6. This file — Durable documentation baseline.
7. The document that matches the task. Read an ADR or standard only when it applies.

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
| Repository maturity | Production-grade. 22 packages, 22 GitHub Actions workflows, published SDK (`twenty-sdk` v2.15.0), Docker Compose + Kubernetes Helm charts. |
| Product maturity | Active. Twenty Cloud available at twenty.com. Self-hosting supported. App ecosystem with internal, community, and example apps. |
| Architecture maturity | High but implicit. Architecture is visible in code and existing durable documents, but not consolidated in a single document. |
| Documentation maturity | Structured. Public docs at docs.twenty.com (Mintlify), root routing via `AGENTS.md` + `index.md`, and an internal baseline under `docs/`. |
| Technical certainty | High. Stack is ratified: NestJS 11, React 19, TypeScript strict, PostgreSQL 16, Redis, BullMQ, GraphQL Yoga, Jotai, Linaria, Nx. |
| Data certainty | High. Multi-tenant per-workspace PostgreSQL schemas. Metadata-driven object/field model. Instance command migration system. |

## Target State

- AI agents can route from `AGENTS.md` to the selected documentation surface with progressive disclosure.
- Architecture decisions are traceable through ADRs with rationale and alternatives.
- Shared rules are explicit and documented, not implicit in code or tribal knowledge.
- Engineers can challenge architecture decisions with documented evidence.
- The documentation baseline is maintained alongside code, not retroactively patched.

## How The Documentation Layers Relate

| Artifact | Role |
| --- | --- |
| `AGENTS.md` | Canonical operational entrypoint for agents and engineers. |
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

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Source of truth for technology standards | `docs/standards/` is authoritative. `.cursor/rules/` serves as indexes referencing `docs/standards/` without duplicating content. `AGENTS.md` remains the root operational entrypoint. |
| First ADRs to formalize | Four foundational ADRs: Nx monorepo choice, NestJS + TypeORM, metadata-driven UI, per-workspace schema isolation. |
| Review process for `docs/` | Same PR process as code: review required, approval before merge. |
| CI gates for `docs/` | `ci-docs.yaml` lints `twenty-docs` when `package.json` or `packages/twenty-docs/**` changes. Internal `docs/` has no CI validation yet. |

## Open Decisions

- Should there be a build step to auto-generate `.cursor/rules/` from `docs/standards/`?
- What is the migration timeline for converting `.cursor/rules/` `.mdc` files into index references?
