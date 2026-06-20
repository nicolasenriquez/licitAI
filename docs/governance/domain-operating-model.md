# Domain Operating Model

## Purpose
Define how the Twenty CRM monorepo makes shared decisions and how responsibility is divided across architecture, product, data, and delivery concerns.

## Primary Audience
Maintainers, engineers, architects, and AI agents working on the Twenty codebase.

## Executive Summary
Twenty operates with explicit ownership boundaries defined by package structure and CODEOWNERS. Shared standards are lightweight but real: this repository is designed for AI-assisted delivery, so ambiguity about who decides what is an operational risk. This document defines the decision boundaries, ownership model, documentation requirements, and when architecture review is required.

## Shared Versus Local Decision Boundaries

| Area | Shared Decision | Package-Local Decision |
| --- | --- | --- |
| Domain terminology | Shared | No local overrides of entity names or field types without review. |
| Data model contracts | Shared | Object and field definitions must follow the metadata model. Local additions via SDK are package-local. |
| Security posture | Shared | Auth flows, permission checks, and middleware order are shared. |
| API schema (GraphQL) | Shared | Changes to core or metadata GraphQL schemas affect all consumers. |
| CI/CD pipeline | Shared | Workflow structure and quality gates are shared. Per-package test config is local. |
| Code style | Shared | Naming conventions, import order, lint rules are shared. Component implementation is local. |
| UI components | Shared at `twenty-ui` | Features in `twenty-front` are package-local. |
| Infrastructure (Docker, K8s) | Shared | `twenty-docker` defines the canonical deployment. |
| Documentation | Shared | `docs/`, `CLAUDE.md`, ADRs are shared. Internal module docs are local. |

## Ownership Model

| Capability | Primary Owner | Secondary Owner | Scope |
| --- | --- | --- | --- |
| Backend engine | `twenty-server` maintainers | Architecture lead | NestJS engine, core modules, metadata modules, TwentyORM |
| Frontend app | `twenty-front` maintainers | Architecture lead | React SPA, feature modules, state management, views |
| Design system | `twenty-ui` maintainers | Frontend lead | Component library, theme tokens, styling conventions |
| SDK & Apps | `twenty-sdk` maintainers | Architecture lead | Public SDK, app definitions, app lifecycle |
| Infrastructure | `twenty-docker` maintainers | Operations lead | Docker Compose, Kubernetes, Helm, Grafana, OTEL |
| Documentation | `docs/` authors | Architecture lead | Internal docs baseline, ADRs, standards |
| Public docs | `twenty-docs` maintainers | Product lead | docs.twenty.com (Mintlify) |
| CI/CD | `.github/` maintainers | Architecture lead | GitHub Actions workflows, release pipeline |
| Security | Auth module maintainers | Architecture lead | Authentication, authorization, encryption |

## What Every Product Area Must Document

Every significant capability in the monorepo must document:

| Artifact | Content |
| --- | --- |
| **Purpose** | What this capability does and why it exists. |
| **Primary audience** | Who consumes or maintains it. |
| **Current state** | What exists today (code, configuration, behavior). |
| **Target state** | What it should become (if different from current). |
| **Open decisions** | What remains undecided. |
| **Required inputs** | What external decisions or data are needed. |
| **Dependencies** | What other capabilities it depends on. |

Capabilities are documented in:
- `docs/` for shared architecture, governance, operations, and decisions.
- `CLAUDE.md` for fast operational rules.
- `.cursor/rules/` for IDE-specific development rules.
- Package-level docs for package-local concerns.

## Relationship Between Repository Artifacts

| Artifact | Role | Authority Level |
| --- | --- | --- |
| `CLAUDE.md` | Fast operational rules for AI agents and engineers. | Primary for dev workflow. References `docs/` for depth. |
| `docs/` | Durable repository context and operating baseline. | Authoritative for architecture, governance, operations. |
| `docs/decisions/` | Traceable long-lived decisions with rationale and alternatives. | Authoritative for architectural decisions. |
| `.cursor/rules/` | IDE-specific development rules. 16 `.mdc` files. | Indexes referencing `docs/standards/`. |
| `packages/twenty-docs/` | Public-facing documentation site (Mintlify). | Authoritative for user and developer docs at docs.twenty.com. |
| `docs/standards/` | Technology-specific coding standards. | Authoritative for per-technology rules. |
| `nx.json` | Nx task configuration and pipeline definitions. | Authoritative for build and task orchestration. |

## When Architecture Review Is Required

Architecture review is required for:

- New data contracts (new core entity, new metadata entity type, new field type).
- Cross-cutting workflow changes (changes affecting multiple engine layers or packages).
- Security model changes (new auth provider, new permission model, new middleware).
- Release process changes (CI/CD pipeline restructuring, new deployment target).
- Topology changes (new package, new service, new database, new external dependency).
- Shared rule changes (code style, naming conventions, import patterns).
- New instance command type or migration pattern.

Architecture review is **not** required for:

- Feature implementation within a single package.
- Bug fixes that don't change contracts.
- Test additions.
- Documentation improvements.
- Dependency version bumps (unless they change behavior).

## When An ADR Is Required

Create an ADR when:

- A new architectural decision is made that affects multiple packages.
- A shared rule is established or changed.
- A technology choice is made (new framework, new database, new tool).
- An existing decision is superseded.

An ADR **can be skipped** for:

- Typo fixes or formatting changes.
- Documentation wording changes that do not change meaning.
- Local feature implementations within a single package.
- Test additions or improvements.
- Minor dependency updates.

## CI Gate Enforcement

| Gate | Enforcement | Blocks Merge |
| --- | --- | --- |
| `lint` (oxlint + oxfmt) | Per package in CI | Yes |
| `lint:diff-with-main` | Per PR in CI | Yes |
| `typecheck` (tsgo) | Per package in CI | Yes |
| `test` (Jest/Vitest) | Per package in CI | Yes |
| `build` | Per package in CI | Yes |
| Secret scan (Gitleaks) | Pre-merge CI | Yes |
| E2E (Playwright) | Main branch CI | Post-merge verification |
| Storybook visual diff | Informational | No |

## Current Assumptions

- The team is small enough that one person may hold multiple ownership roles, but decision boundaries must remain explicit.
- Architecture review is triggered by the change author's judgment. No formal review board exists.
- ADRs are written after the decision is accepted, not as proposals.
- `docs/` changes follow the same PR review process as code changes.
- CI gates are enforced uniformly across all packages.

## Open Decisions

- What is the minimum reviewer set for shared-rule changes?
- Should ADR acceptance require one owner or two?
- Should there be a formal architecture review board or does the current lightweight model suffice?
- How should ownership be transferred when a maintainer leaves or changes role?
