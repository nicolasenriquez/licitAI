# Product Vision

## Purpose
State why Twenty exists, what problem space it addresses, and how the current product registers differ from the target intent.

## Primary Audience
Product stakeholders, engineers, architects, AI agents, and community contributors.

## Executive Summary
Twenty is an open-source CRM that gives technical teams the building blocks for a custom CRM that meets complex business needs and quickly adapts as the business evolves. Unlike traditional rigid CRMs, Twenty is designed to be built, shipped, and versioned like the rest of the software stack. The product operates on four core primitives — objects, views, workflows, and agents — and is extensible via a public SDK that lets developers define custom objects, fields, views, roles, AI agents, logic functions, and front-end components as code.

## Product Problem Statement

Traditional CRMs force teams into predefined data models and workflows. Customization requires configuration through admin panels, not code. As businesses evolve, the CRM becomes a bottleneck — changes are slow, risky, and often impossible without vendor lock-in or expensive consultants. Teams that build their own software cannot bring the same engineering practices (version control, CI/CD, code review) to their CRM.

Twenty solves this by treating the CRM as a software product rather than a configured tool. Teams define their data model, views, workflows, and AI agents as code. They version it, test it, review it, and ship it — just like the rest of their stack.

## Why Twenty Exists

| Need | Why It Matters |
| --- | --- |
| Programmable data model | Teams need custom objects, fields, and relationships that match their business domain, not a vendor's assumptions. |
| Version-controlled CRM | CRM configuration should live in git, be reviewed in PRs, and deployed through CI/CD — not click-through admin panels. |
| Extensible via code | Adding a new integration, automation, or view should be a code change, not a marketplace purchase or professional service engagement. |
| Metadata-driven UI | The frontend should render dynamically from metadata, eliminating the need to hardcode schemas in both backend and frontend. |
| AI-native design | AI agents should be first-class actors in the CRM — reading data, suggesting actions, and executing confirmed mutations — not an afterthought bolted on. |
| Open-source core | The CRM should be inspectable, forkable, and self-hostable. No black-box vendor logic. |

## Business Posture

| Category | Current State | Target State |
| --- | --- | --- |
| Business model | Open-source (AGPL-3.0). Self-hosted. Cloud hosting available at twenty.com. | Self-hosted-first deployment. Cloud as convenience option. |
| Monetization | None. Open-source under free license. No subscription billing, no Stripe integration for this deployment. | Open-source libre. Monetization not a goal for this deployment. |
| Product type | Open-source CRM platform. Self-hosted. | Mature platform with app ecosystem and community contributions. |
| Primary ICP | Technical teams (startups, scale-ups) that build their own software and want a CRM that matches their engineering practices. | Technical teams that self-host and customize their CRM as code. |
| Geographic scope | Global. English-first UI with Crowdin-based community translations. | Community-driven localization. |

## Target Users And Stakeholders

| Group | Role In The System | Confidence |
| --- | --- | --- |
| Technical teams (builders) | Define objects, views, workflows as code. Customize the CRM programmatically. | High |
| End-users (CRM operators) | Use the CRM daily: manage contacts, deals, tasks, timelines. Consume views built by technical teams. | High |
| App developers | Build apps using the Twenty SDK. Publish integrations and custom objects to workspaces. | High |
| Community contributors | Contribute to the open-source core, fix bugs, add features, translate. | High |
| System administrators | Self-host Twenty, manage infrastructure, configure SSO, monitor deployments. | High |

## Product Primitives

Twenty is built around four core primitives that compose into a complete CRM:

| Primitive | Description | Defined Via |
| --- | --- | --- |
| **Objects** | Custom database entities with fields, relationships, and metadata. The data model of the CRM. | SDK (`defineObject`), metadata API |
| **Views** | Configurable ways to display object records: table, kanban, calendar. Filters, sorts, groups. | SDK (`defineView`), drag-and-drop in UI |
| **Workflows** | Automated sequences triggered by database events, HTTP requests, or cron schedules. | SDK (`defineLogicFunction`), workflow builder UI |
| **Agents** | AI agents with skills, tools, and prompts. Contextual assistant in the product shell. | SDK (`defineAgent`, `defineSkill`), agent configuration UI |

These primitives are complemented by:

| Capability | Description |
| --- | --- |
| **Command menu** | Keyboard-driven command palette for navigation and actions across the product. |
| **Page layouts** | Configurable record pages with tabs and widgets. |
| **Roles & permissions** | RBAC with row-level security predicates. Per-object, per-view permission control. |
| **App ecosystem** | Internal apps (Slack, Linear, Discord, etc.), community apps, and custom apps built with the SDK. |
| **Timeline** | Activity feed on records showing emails, notes, calls, and system events. |
| **Email & calendar sync** | IMAP/SMTP email integration and CalDAV calendar sync. |

## Value Hypotheses

- Twenty reduces the time from CRM requirement to deployed feature by replacing admin-panel configuration with code-based customization that follows standard engineering workflows.
- The app SDK enables teams to build custom integrations and objects without forking the core codebase, accelerating the ecosystem.
- Metadata-driven UI eliminates the duplication of schema definitions across backend and frontend, reducing bugs and development time.
- AI agents grounded in the product context (objects, views, records) provide more accurate and actionable assistance than generic AI chatbots.
- Open-source licensing and self-hosting capability reduce vendor lock-in risk and allow inspection of the entire codebase.

## MVP Scope

| Scope Area | Status | Details |
| --- | --- | --- |
| Custom objects and fields | In scope | Define via metadata API or SDK. Dynamic schema in PostgreSQL. |
| Views (table, kanban, calendar) | In scope | Configurable per object. Filters, sorts, groups. |
| Record detail pages | In scope | Persistent right-side panel + full record page. |
| Page layouts | In scope | Configurable tabs and widgets per object record page. |
| Command menu | In scope | Keyboard-driven navigation and action palette. |
| Workflows | In scope | Triggered by DB events, HTTP, or cron. Built via workflow builder UI. |
| AI agents and chat | In scope | Contextual AI assistant with tool access. Read by default, mutations require confirmation. |
| App SDK | In scope | Public npm package (`twenty-sdk` v2.15.0). CLI for scaffolding and publishing. |
| Internal apps | In scope | 12 built-in apps (Slack, Linear, Discord, Fireflies, etc.). |
| Email sync (IMAP/SMTP) | In scope | Timeline messaging. Email sending via Resend. |
| Calendar sync (CalDAV) | In scope | Calendar integration with external providers. |
| Timeline | In scope | Activity feed with emails, notes, calls, system events. |
| Authentication | In scope | JWT, SSO (SAML/OIDC), OAuth (Google, Microsoft), API keys. |
| Role-based access control | In scope | Roles with CRUD permissions. Row-level security predicates. |
| Multi-tenant | In scope | Per-workspace PostgreSQL schemas. Workspace isolation. |
| Self-hosting (Docker) | In scope | Docker Compose for production. Kubernetes Helm charts available. |
| Cloud hosting (twenty.com) | In scope | Managed cloud with Stripe billing. |
| File storage | In scope | Local or S3-compatible storage. |
| Analytics (ClickHouse) | Optional | ClickHouse integration for analytics. Optional to enable. |
| App marketplace | Post-MVP | Public marketplace for community and third-party apps. |
| Workflow templates | Post-MVP | Pre-built workflow templates for common CRM patterns. |
| Advanced AI agent autonomy | Post-MVP | Full agent with multi-step planning and execution. |
| Mobile app | Post-MVP | Native mobile experience. |

## Current State

- **Active production**: Twenty Cloud available at twenty.com. Regular releases (version 0.2.1).
- **22-package monorepo**: Full CI/CD with 40+ GitHub Actions workflows.
- **SDK published**: `twenty-sdk` v2.15.0 on npm. CLI scaffolding and app publishing.
- **12 internal apps**: Slack, Linear, Discord, Fireflies, and more.
- **Community**: Discord server, GitHub discussions, public roadmap, Crowdin translations.
- **Self-hosting**: Docker Compose and Kubernetes Helm charts available.
- **Documentation**: Public docs at docs.twenty.com (Mintlify). CLAUDE.md for AI agents.

## Target State

- Twenty has an explicit product posture: the CRM that technical teams build, version, and ship like the rest of their stack.
- The app marketplace makes third-party apps discoverable and installable with a single command.
- AI agents are deeply integrated — not just a chat sidebar, but active participants in CRM workflows.
- Enterprise self-hosting is a first-class offering with dedicated support and licensing.
- The product shell (object → view → record) is the universal grammar for all CRM interactions.
- Documentation is comprehensive enough that AI agents can onboard and implement features from repository context alone.

## Current Assumptions

- The primary value proposition is programmability and versionability, not ease of use for non-technical users.
- The app SDK will be the primary extensibility mechanism, not core code modification.
- Metadata-driven architecture (runtime schema generation) is the long-term design, not code-first static schemas.
- PostgreSQL multi-tenant per-workspace isolation is sufficient for the foreseeable future.
- Open-source is a strategic advantage, not a temporary marketing tactic.
- AI-assisted development (Claude Code, Cursor) is an operating assumption for Twenty's own engineering team.
- Deployment is self-hosted-first. No cloud monetization or Stripe billing is planned for this deployment.
- The product remains a horizontal CRM platform. Vertical industry specialization is delivered via apps, not core forks.

## Required Inputs

- Mobile strategy: native app or progressive web app.
- Partner and reseller program definition.
- Community governance model for contributions and app ecosystem.

## Resolved Decisions

| Decision | Resolution |
| --- | --- |
| Vertical SaaS editions | No. Twenty remains a horizontal CRM platform. Vertical specialization is delivered through apps in the marketplace, not core forks. |
| Cloud vs self-hosted | Self-hosted-first. Cloud is a convenience option for those who prefer not to operate infrastructure. |
| App marketplace model | Mixed: official/internal apps are curated. Community apps are open with ratings and reviews. |
| AI agent autonomy | Progressive by risk level. Reads are automatic. Mutations require human confirmation. Low-risk actions may become automatic over time. Admin actions always require human approval. |
| SDK backward compatibility | Strict SemVer. Breaking changes only in major versions. Deprecation warnings one major before removal. Migration guides provided. |
| Monetization | No monetization planned for this deployment. Open-source libre use under AGPL-3.0. |

## Open Decisions

- Should there be a formal community governance model for accepting apps into the official curated list?
- What is the long-term strategy for the cloud convenience option if self-hosted remains the priority?

## Candidate Success Metrics

- Number of active workspaces (cloud + self-hosted).
- SDK downloads and published apps.
- Time from SDK scaffold to first deployed app.
- Community contributions (PRs, apps, translations).
- Developer satisfaction with CRM customization speed vs traditional CRMs.
- AI agent accuracy and action completion rate.
