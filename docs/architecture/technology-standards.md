---
type: architecture
title: "Technology Standards"
description: "Architecture documentation for Technology Standards."
okf_version: "0.1"
---
# Technology Standards

## Purpose
Define which technology standards are present in the Twenty CRM monorepo, their versions, purposes, and governing rules.

## Primary Audience
Engineers, reviewers, architects, and AI agents working on the Twenty codebase.

## Executive Summary
Twenty's technology stack is mature and ratified. The backend is NestJS 11 with a custom TwentyORM layer on TypeORM for multi-tenant PostgreSQL. The frontend is React 19 with Jotai state management and Linaria styling. The monorepo is managed by Nx 22.7.7 with Yarn 4. Code quality is enforced through oxlint, oxfmt, and tsgo. This document inventories every technology in the stack and its governing standards.

## Existing Standards

### Monorepo & Tooling

| Technology | Version | Purpose | Governing Rules |
| --- | --- | --- | --- |
| Nx | 22.7.7 | Task orchestration, caching, dependency graph | `nx.json`, `.cursor/rules/nx-rules.mdc` |
| Yarn | 4.13.0 (Berry) | Package manager, workspace resolution | `package.json`, `yarn.config.cjs`, `.yarnrc.yml` |
| Node.js | ^24.5.0 | JavaScript runtime | `package.json` engines field |
| oxlint | — | Linter (ESLint equivalent) | `.oxlintrc.json` per package, `nx.json` lint target |
| oxfmt | 0.50.0 | Formatter (Prettier equivalent) | `.oxfmtrc.jsonc`, `nx.json` fmt target |
| tsgo | — | TypeScript type checker | `tsconfig.json` per package |
| SWC | — | Compilation (fast) | Nx generators default compiler |

### Backend Stack

| Technology | Version | Purpose | Governing Rules |
| --- | --- | --- | --- |
| NestJS | 11 | Backend framework, DI, module system | `.cursor/rules/architecture.mdc` |
| TypeORM | 0.3.26 (patched) | Database ORM | `packages/twenty-server/src/database/typeorm/` |
| TwentyORM | — | Custom multi-tenant ORM layer | `packages/twenty-server/src/engine/twenty-orm/` |
| PostgreSQL | 16 | Primary database | Multi-tenant per-workspace schemas |
| Redis | 7 | Cache, session store, queue backing | `docker-compose.dev.yml`, `docker-compose.yml` |
| BullMQ | — | Background job queue | Redis-backed. `packages/twenty-server/src/engine/core-modules/message-queue/` |
| GraphQL Yoga | — | GraphQL server | Triple-endpoint: `/graphql`, `/metadata`, `/admin-panel` |
| ClickHouse | — | Analytics database (optional) | `packages/twenty-server/src/database/clickHouse/` |
| class-validator | — | DTO validation | Used across backend modules |
| class-transformer | — | DTO transformation | Used across backend modules |

### Frontend Stack

| Technology | Version | Purpose | Governing Rules |
| --- | --- | --- | --- |
| React | 19 | UI framework | `.cursor/rules/react-general-guidelines.mdc`, `.cursor/rules/react-state-management.mdc` |
| Jotai | — | Atomic state management | Atoms, selectors, atom families |
| Apollo Client | 4 | GraphQL data fetching | Cache management, typed hooks |
| Linaria | — | Zero-runtime CSS-in-JS | styled-components API. `DESIGN.md` for visual rules |
| Lingui | — | Internationalization | Extract/compile workflow. `.cursor/rules/translations.mdc` |
| Vite | — | Build tool / dev server | `vite.config.ts` per package |
| React Router | 6 | Client-side routing | `packages/twenty-front/src/pages/` |
| TipTap | 3.4 | Rich text editor | Used in notes, comments |
| Mantine | 8 | UI primitives (select) | Complementary to `twenty-ui` |
| Monaco Editor | — | Code editor | Used in advanced text editor |
| @xyflow/react | — | Node graph editor | Used in workflow builder |
| @nivo | — | Charts | Dashboard and analytics |
| framer-motion | — | Animation | Respects `prefers-reduced-motion` |
| React Hook Form | — | Form management | Used across form components |

### Testing Stack

| Technology | Purpose | Governing Rules |
| --- | --- | --- |
| Jest | Unit and integration testing | `jest.config.mjs` per package. `.cursor/rules/testing-guidelines.mdc` |
| Vitest | Vite-native testing | Storybook tests. `vitest.config.ts` per package |
| Playwright | End-to-end testing | `packages/twenty-e2e-testing/playwright.config.ts` |
| Storybook | Visual testing, component catalog | `.storybook/` per package. `nx.json` storybook targets |
| React Testing Library | Component testing | Query by user-visible elements (text, roles, labels) |
| user-event | Realistic user interactions | `@testing-library/user-event` |

### Infrastructure & Observability

| Technology | Purpose | Configuration |
| --- | --- | --- |
| Docker + Docker Compose | Containerization | `packages/twenty-docker/docker-compose.yml`, `docker-compose.dev.yml` |
| Kubernetes | Production orchestration | `packages/twenty-docker/helm/`, `k8s/` |
| OpenTelemetry | Distributed tracing | `packages/twenty-docker/otel-collector/` |
| Sentry | Error tracking | `packages/twenty-server/src/engine/core-modules/sentry/` |
| Grafana | Monitoring dashboards | `packages/twenty-docker/grafana/` |
| Prometheus | Metrics | `packages/twenty-server/src/engine/core-modules/metrics/` |
| Resend | Transactional email | `packages/twenty-server/src/engine/core-modules/email/` |
| Stripe | Billing | `packages/twenty-server/src/engine/core-modules/billing/` |
| AWS SDK | File storage (S3) | `packages/twenty-server/src/engine/core-modules/file-storage/` |
| Crowdin | Translation management | `.github/workflows/i18n-*.yaml` |

### SDK & Apps

| Technology | Version | Purpose | Details |
| --- | --- | --- | --- |
| twenty-sdk | 2.15.0 | Public SDK for building apps | Published to npm. CLI (`twenty`) + library (`define`, `front-component`, `billing`, etc.) |
| create-twenty-app | — | Scaffolding CLI | `npx create-twenty-app my-app` |
| twenty-client-sdk | — | API client library | Bundled into `twenty-server` |

## Code Style Rules

Enforced by lint and typecheck, documented in `AGENTS.md`, `.cursor/rules/`, and this baseline:

| Rule | Detail |
| --- | --- |
| Functional components only | No class components in React |
| Named exports only | No default exports (except SDK `define*()` functions and Next.js conventions) |
| Types over interfaces | Except when extending third-party interfaces |
| String literals over enums | Except for GraphQL enums |
| No `any` type | Strict TypeScript enforced by `tsgo` |
| Event handlers over `useEffect` | For state updates in response to user actions |
| Props down, events up | Unidirectional data flow |
| Composition over inheritance | Both in React components and NestJS modules |
| No abbreviations | `user` not `u`, `fieldMetadata` not `fm` |
| camelCase | Variables and functions |
| SCREAMING_SNAKE_CASE | Constants |
| PascalCase | Types and classes (suffix component props with `Props`) |
| kebab-case | Files and directories with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`) |
| Descriptive generics | `TData` not `T` |
| 300-line component limit | Components under 300 lines |
| 500-line service limit | Services under 500 lines |
| Barrel exports | `index.ts` for clean imports |
| Import order | External libraries → internal (`@/`) → relative |
| Short-form comments | `//` not JSDoc. Explain WHY, not WHAT |
| Linaria styled-components | For all styling in React components |
| Functional state updates | `setState(prev => prev + 1)` |
| 70/20/10 test pyramid | 70% unit, 20% integration, 10% E2E |

## Cursor Rules Reference

The `.cursor/rules/` directory contains 16 authoritative `.mdc` files with detailed per-technology rules. These are the primary reference for AI agents working in Cursor IDE. This document inventories them; the `.mdc` files remain the canonical source.

| Rule File | Area |
| --- | --- |
| `architecture.mdc` | Backend architecture patterns |
| `changelog-process.mdc` | Changelog entry requirements |
| `code-style.mdc` | Code style conventions |
| `creating-syncable-entity.mdc` | Entity creation for sync |
| `feedback-incorporation.mdc` | How to incorporate feedback |
| `file-structure.mdc` | File and directory structure |
| `github-actions-security.mdc` | CI/CD security rules |
| `nx-rules.mdc` | Nx workspace conventions |
| `react-general-guidelines.mdc` | React component rules |
| `react-state-management.mdc` | Jotai and state patterns |
| `sdk-esm-dependencies.mdc` | SDK ESM compatibility |
| `server-migrations.mdc` | Instance command rules |
| `testing-guidelines.mdc` | Testing conventions |
| `translations.mdc` | i18n and Lingui rules |
| `typescript-guidelines.mdc` | TypeScript strict mode rules |
| `README.mdc` | Cursor rules index |

## Standards Policy

| Status | Meaning |
| --- | --- |
| Binding | Enforced by CI gates (lint, typecheck, test). Violations block merge. |
| Convention | Strongly recommended by code review but not automatically enforced. |
| Reference | Available as guidance; not mandatory for all code paths. |

Technology in the "Existing Standards" tables above is **binding** unless otherwise noted.

## Guidance For AI Agents

1. Use existing standards files (`.cursor/rules/*.mdc`, `AGENTS.md`) when they match the implementation surface.
2. Do not assume a technology choice is available unless it is listed in this document or visible in `package.json`.
3. Prefer existing utilities from `twenty-shared` (`isDefined()`, `isNonEmptyString()`, `isNonEmptyArray()`) over manual type guards.
4. Follow the import order: external libraries first, then internal (`@/`), then relative.
5. If a new shared standard becomes necessary, propose adding a standard document in `docs/standards/` with ADR coverage.

## Current Assumptions

- The technology stack is stable. Major framework changes (e.g., NestJS → Fastify, React → alternative) are not planned.
- Nx + Yarn 4 remains the monorepo tooling for the foreseeable future.
- oxlint + oxfmt remain the authoritative lint and format tools. ESLint and Prettier are not used.
- tsgo remains the authoritative TypeScript type checker.
- PostgreSQL 16 and Redis 7 are the minimum required versions.
- Linaria is the styling solution for all React components in the monorepo.
- `docs/standards/` is the authoritative source for technology standards. `.cursor/rules/` serves as indexes referencing `docs/standards/` without duplicating content.
- ClickHouse is optional for development environments. Enable only when analytics features are needed.

## Standards Policy — Deprecation

When a technology is phased out, the following process applies:

1. **Announce** deprecation with 1 major version of anticipation.
2. **Provide** a migration guide for consumers.
3. **Remove** in the next major version.
4. **Update** this document and `.cursor/rules/` references.

This applies to all technologies listed in this document, especially those with public-facing APIs (SDK, metadata API).

## Open Decisions

- Should there be a build step to auto-generate `.cursor/rules/` from `docs/standards/`?
- What is the migration timeline for converting `.cursor/rules/` `.mdc` files into index references?
