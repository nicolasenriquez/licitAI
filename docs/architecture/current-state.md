---
type: architecture
title: "Current State Architecture"
description: "Architecture documentation for Current State Architecture."
okf_version: "0.1"
---
# Current State Architecture

## Purpose
Describe the current architecture of the licitai/Twenty monorepo as visible in the codebase and CI configuration. This document captures what exists and is supportable today, not what is proposed or planned.

## Primary Audience
AI agents, engineers, architects onboarding to the Twenty codebase.

## Executive Summary
Licitai is a Twenty-derived, production-grade open-source CRM with a 22-package Nx monorepo. The architecture follows a metadata-driven design: object definitions, field definitions, views, roles, and permissions are stored as metadata and drive both the backend API and the frontend UI dynamically. The backend is a NestJS application with a custom ORM layer (TwentyORM) for multi-tenant per-workspace PostgreSQL schemas. The frontend is a React 19 SPA using Jotai for state management and Linaria for styling. Background jobs run via BullMQ with Redis. The monorepo is managed by Nx with Yarn 4.

## Confirmed Current State

### Product Contract

| Area | Current State |
| --- | --- |
| Product type | Open-source CRM. Cloud-hosted (twenty.com) and self-hosted. |
| Core primitives | Objects, fields, views, workflows, agents. Metadata-driven, extensible via apps. |
| App ecosystem | Internal apps (Slack, Linear, Discord, etc.), community apps, example apps. SDK published to npm (`twenty-sdk` v2.15.0). |
| AI features | AI agents, chat, model registry, tool provider system, text generation, and optional code interpreter. See `ai-and-mcp-layer.md` for runtime boundaries. |
| User model | Multi-tenant with per-workspace users. JWT auth, SSO (SAML/OIDC), OAuth, API keys. |
| Maturity | Active production use. Regular releases. Public roadmap. |

### Architecture Decisions

| Area | Decision |
| --- | --- |
| Monorepo tool | Nx 22.7.5 with Yarn 4 (Berry). 22 packages with defined task pipelines. |
| Backend framework | NestJS 11. Code-first approach with modules, decorators, dependency injection. |
| API protocol | GraphQL (GraphQL Yoga) with triple-endpoint design: `/graphql` (core data), `/metadata` (schema management), `/admin-panel` (admin operations). REST at `/rest/*`, MCP at `/mcp`. |
| ORM | TypeORM 0.3.26 (patched) with custom TwentyORM layer for multi-tenant schema isolation. |
| Database | PostgreSQL 16. Multi-tenant via per-workspace schemas. Optional ClickHouse for analytics. |
| Cache & queues | Redis 7. BullMQ for background job processing (queue worker process). |
| Frontend framework | React 19 SPA with Vite. Jotai for state, Apollo Client for GraphQL, Linaria for CSS. |
| Styling | Linaria (zero-runtime CSS-in-JS), styled-components API. CSS variables for theming. |
| i18n | Lingui. Extract/compile workflow. Crowdin for translations. |
| Testing | Jest (unit/integration), Playwright (E2E), Vitest (Vite-native). |
| CI | GitHub Actions (22 workflows). Per-package CI, documentation checks, integration/E2E coverage, and package-specific validation. No deployment or promotion workflow is part of the current contract. |
| Containerization | Docker Compose for dev/prod. Kubernetes Helm charts available. |

### Package Structure

| Package | Role | Type |
| --- | --- | --- |
| `twenty-server` | NestJS backend API, queue worker, CLI commands, migrations | Application |
| `twenty-front` | React SPA (CRM UI) | Application |
| `twenty-shared` | Foundation types, utilities, constants shared by all packages | Library |
| `twenty-ui` | Design system (React components, themes, icons) | Library |
| `twenty-emails` | Transactional email templates (React Email) | Library |
| `twenty-website` | Marketing website (Next.js 16) | Application |
| `twenty-website-redone` | Redesigned marketing website | Application |
| `twenty-docs` | Public documentation site (Mintlify) | Application |
| `twenty-docker` | Docker Compose, K8s Helm charts, Grafana, OTEL | Infrastructure |
| `twenty-e2e-testing` | Playwright E2E tests | Testing |
| `twenty-zapier` | Zapier integration app | Application |
| `twenty-utils` | Dev setup scripts, dangerfile, translation QA | Tooling |
| `twenty-sdk` | Public SDK for building apps (CLI + library) | Library (published) |
| `twenty-cli` | Deprecated CLI, redirects to `twenty-sdk` | Tooling |
| `twenty-client-sdk` | Client-side API library | Library |
| `twenty-front-component-renderer` | Renders remote front components | Library |
| `twenty-apps/` | App definitions (internal 12, community 1, examples 2, fixtures 4) | Applications |
| `twenty-codex-plugin` | OpenAI Codex plugin | Plugin |
| `twenty-companion` | Electron desktop companion app | Application |
| `twenty-oxlint-rules` | Custom oxlint rules (ESLint plugin equivalent) | Tooling |
| `twenty-claude-skills` | Claude Code skills directory | Tooling |
| `create-twenty-app` | Scaffolding CLI (`npx create-twenty-app`) | Tooling |

### Backend Engine Architecture

The backend (`packages/twenty-server/src/engine/`) is organized in four layers:

**Layer 1: API** (`engine/api/`)
- `POST /graphql` — Core GraphQL API. Schema generated dynamically per workspace from metadata. Uses `WorkspaceSchemaFactory` that generates SDL and resolvers at runtime. Serves user-defined objects (companies, contacts, deals, custom objects).
- `POST /metadata` — Metadata GraphQL API. Manages object definitions, field definitions, roles, permissions, views, layouts, AI settings.
- `POST /admin-panel` — Admin Panel GraphQL API. Workspace management, feature flags, event logs, billing.
- `GET/POST /rest/*` — REST API endpoints.
- `/mcp` — Model Context Protocol server for AI agent integration.

**Layer 2: Core Modules** (`engine/core-modules/`) — 76 infrastructure modules
- Auth: JWT, SSO (SAML/OIDC), API keys, impersonation, OAuth
- Billing: Stripe subscriptions, usage tracking, webhooks
- Workspace: creation, lifecycle, invitations, user memberships
- Communication: email (Resend), messaging, calendar sync (IMAP/SMTP/CalDAV)
- Storage: file metadata, S3-compatible file storage
- Search: Elasticsearch/OpenSearch integration
- AI: code interpreter, tool provider, workflow engine, logic functions
- Infrastructure: Redis, BullMQ message queue, caching, logging, telemetry, Sentry

**Layer 3: Metadata Modules** (`engine/metadata-modules/`) — 72 modules
- Object metadata and field metadata CRUD
- View definitions (list, kanban, calendar, table)
- Page layouts, navigation menus, command palette items
- Roles and permissions (RBAC + row-level security predicates)
- AI agent and skill definitions
- Webhook and integration definitions
- Denormalized "flat" metadata caches for fast reads

**Layer 4: TwentyORM** (`engine/twenty-orm/`)
- Custom ORM built on TypeORM for multi-tenant schema-per-workspace architecture
- `WorkspaceEntityManager` — typed, workspace-scoped CRUD with hooks and cache invalidation
- `WorkspaceSchemaManager` — manages per-workspace PostgreSQL schemas
- `EntitySchemaFactory` — builds TypeORM entity schemas dynamically from workspace metadata at runtime
- Per-request: resolves workspace → creates/fetches per-workspace TypeORM DataSource → compiles entity schemas → provides entity manager

**Data flow**: Request → Middleware (JWT hydrate → workspace context) → API endpoint → Core/Metadata modules → TwentyORM → PostgreSQL (isolated schema per workspace).

### Frontend Architecture

The frontend (`packages/twenty-front/src/`) is organized around feature modules:

- **56 feature modules** (`src/modules/`): accounts, activities, AI, Apollo config, auth, companies, contacts, workflow, settings, dashboards, navigation, command menu, etc.
- **6 route pages** (`src/pages/`): auth, object-record (list/detail), settings, onboarding, layout, 404
- **State management**: Jotai atoms for global state, Apollo Client cache for GraphQL data
- **Metadata-driven UI**: Object and field definitions from the metadata API drive form rendering, table columns, and record detail layouts
- **Code generation**: Three GraphQL codegen configs (`codegen.cjs`, `codegen-metadata.cjs`, `codegen-admin.cjs`) generate typed hooks and fragments into `generated/`, `generated-metadata/`, `generated-admin/`
- **Styling**: Linaria styled-components with theme tokens from `twenty-ui`
- **i18n**: Lingui with extract/compile workflow. Translation catalog in `src/locales/`

### App System

Apps extend Twenty with custom objects, fields, views, roles, agents, logic functions, and front components. Defined as code using the `twenty-sdk/define` module:

- `defineApplication()` — app manifest
- `defineObject()` — custom database object with fields inline
- `defineField()` — add field to existing object
- `defineView()` — list, kanban, or calendar view
- `defineRole()` — permission role
- `defineAgent()` / `defineSkill()` — AI agent definitions
- `defineNavigationMenuItem()` — sidebar navigation
- `defineFrontComponent()` — embeddable React component
- `definePageLayout()` — record page layout with tabs and widgets
- `defineLogicFunction()` — serverless function with HTTP, DB event, or cron triggers
- `defineConnectionProvider()` — external service OAuth
- `defineIndex()` — database index
- `defineCommandMenuItem()` — command palette shortcut
- `definePermissionFlag()` — granular permission

Apps are installed via `npx twenty app:install` and published with `npx twenty app:publish`.

### Data Model

- **Multi-tenant**: Single PostgreSQL instance with per-workspace schemas (`workspace_<id>`)
- **Core schema**: Shared metadata tables (workspaces, users, global config)
- **Metadata schema**: Object definitions, field definitions, views, roles, permissions (workspace-scoped)
- **Workspace schemas**: Actual CRM data (companies, contacts, deals, custom objects). Schema shape is dynamic, driven by metadata definitions.
- **Migrations**: Instance commands with decorator-based discovery (`@RegisteredInstanceCommand`, `@RegisteredWorkspaceCommand`). Fast commands = schema changes. Slow commands = schema + data migration.
- **Soft deletes**: Supported via trash-cleanup module for garbage collection.

### Infrastructure

- **Development**: The complete Docker Compose stack is the canonical local runtime for the server, compiled frontend, worker, PostgreSQL 16, and Redis 7. The default tag is `twentycrm/twenty:mp-local`; a normal start reuses it and an explicit build refreshes it.
- **Deployment artifacts**: Docker Compose and Kubernetes Helm charts remain available; deployment is outside the current CI contract.
- **Monitoring**: OpenTelemetry collector, Grafana dashboards, Sentry error tracking, Prometheus metrics.
- **CI**: GitHub Actions (22 workflows) cover package checks, documentation, integration/E2E, and targeted application validation. Deployment and promotion CD workflows are absent.

### Mercado Publico ingestion

- Deployment-local `mp` schema stores raw API/CSV evidence, staging rows, canonical procurement entities, reconciliation records, and gold/read objects.
- API V1, API V2 Compra Agil, and Datos Abiertos CSV remain separate source families; raw provenance is retained before normalization.
- Manual ingestion jobs run through the internal `mercado-publico:run` command and persist job status plus run-scoped counters. See `docs/operations/mercado-publico-ingestion.md`.

### Quality Gates

| Gate | Tool | Configuration |
| --- | --- | --- |
| Lint | oxlint, oxfmt | `.oxfmtrc.jsonc`, custom `twenty-oxlint-rules` |
| Type check | tsgo | `tsconfig.base.json` |
| Test | Jest, Vitest, Playwright | Per-package jest configs, `playwright.config.ts` |
| Diff lint | `lint:diff-with-main` | Compares against main branch (fast path) |
| Secret scan | Gitleaks | CI workflow |

## What Does Not Yet Exist

- Consolidated architecture documentation (this baseline addresses that gap).
- Formal ADRs for major architectural decisions made during initial development.
- Explicit non-functional requirements (SLOs, SLAs, performance budgets).
- Documented governance model (CODEOWNERS exists but decision boundaries are implicit).
- External-facing architecture reference beyond the public docs at docs.twenty.com.

## Current Assumptions

- The monorepo structure (Nx + Yarn) is stable and unlikely to change.
- The metadata-driven architecture (object/field definitions driving both API and UI) is the long-term design.
- PostgreSQL per-workspace schema isolation is the preferred multi-tenant strategy.
- BullMQ + Redis is the preferred job queue for the foreseeable future.
- The app system (SDK-based extensions) is the primary extensibility mechanism, not direct code modification of core packages.
- GraphQL with runtime schema generation per workspace is the API strategy; REST and MCP are complementary.
- Linaria for styling and Jotai for state management are ratified and stable choices.
