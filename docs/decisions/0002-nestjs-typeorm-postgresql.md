# ADR 0002: NestJS + TypeORM + PostgreSQL Backend Stack

## Status
Accepted (2026-06-20)

## Purpose
Formalize the decision to use NestJS 11, TypeORM 0.3.26, and PostgreSQL 16 as the backend stack for Twenty CRM.

## Context
Twenty needed a backend framework that supports:

- **Modular architecture**: clear separation between infrastructure, metadata, and business logic
- **Dependency injection**: testable, composable services
- **GraphQL API**: native GraphQL support with runtime schema generation
- **Multi-tenant database**: per-tenant data isolation
- **TypeScript**: end-to-end type safety from frontend to database

The project evaluated NestJS vs Express/Fastify, TypeORM vs Prisma/Drizzle, and PostgreSQL vs MySQL.

## Decision

**Use NestJS 11 as the backend framework, TypeORM 0.3.26 (patched) as the ORM, and PostgreSQL 16 as the primary database.**

Key specifics:
- **NestJS**: Provides module system, dependency injection, decorators, guards, middleware, and GraphQL integration via GraphQL Yoga. The engine is organized in four layers: API → Core Modules → Metadata Modules → TwentyORM.
- **TypeORM**: Chosen for its decorator-based entity definitions, migration system, and DataSource management. A custom TwentyORM layer was built on top for multi-tenant schema-per-workspace isolation.
- **PostgreSQL**: Chosen for per-workspace schema isolation, native JSONB support, full-text search (`tsvector`), and extensions (`pgvector`, `pg_trgm`).
- **Redis 7**: Session cache and BullMQ job queue backing.
- **BullMQ**: Background job processing with Redis-backed queues.

## Consequences

### Positive
- NestJS modules provide clear separation between 76 core modules, 72 metadata modules, and business logic modules.
- Dependency injection enables isolated unit testing of services.
- GraphQL Yoga with runtime schema generation allows dynamic API shapes per workspace.
- The TwentyORM layer provides per-workspace DataSource management, dynamic entity schema compilation, and ORM-level permission enforcement.
- PostgreSQL schema isolation gives strong multi-tenant boundaries.

### Costs
- TypeORM 0.3.26 required internal patches for workspace-scoped DataSource management.
- The TwentyORM layer (1844-line WorkspaceEntityManager) adds significant custom code that must be maintained.
- Runtime schema generation means entity schemas are not known at compile time, complicating type safety in some paths.
- BullMQ requires Redis, adding infrastructure complexity.

### Constraints
- NestJS modules must follow the engine layer structure (API → Core → Metadata → TwentyORM).
- Entity changes require instance commands (migrations) with both `up` and `down` logic.
- Workspace data is isolated in `workspace_<id>` PostgreSQL schemas. Cross-workspace queries are not supported at the ORM level.
- TypeORM entity definitions use decorators (`@Entity`, `@Column`, `@ManyToOne`).

## Alternatives Considered

### Express / Fastify
- **Rejected**: Express lacks a built-in module system and DI. Fastify has better performance but NestJS provides a more structured architecture for a large codebase. NestJS can use Fastify as its HTTP adapter if performance becomes critical.

### Prisma
- **Rejected**: Prisma's schema-first approach conflicts with Twenty's metadata-driven runtime schema generation. Prisma requires a static `schema.prisma` file; Twenty generates entity schemas dynamically from workspace metadata.

### Drizzle
- **Rejected**: Drizzle is newer and less mature than TypeORM. The custom TwentyORM layer built on TypeORM provides schema-per-tenant isolation that Drizzle does not natively support.

### MongoDB / NoSQL
- **Rejected**: Twenty's data model is relational (objects, fields, relationships). PostgreSQL with schema isolation is the correct fit.

## Related Documents
- `docs/architecture/current-state.md` — Engine architecture overview
- `docs/architecture/data-model.md` — Data model and entity definitions
- `docs/architecture/reference-architecture.md` — System architecture diagram
- `docs/architecture/technology-standards.md` — Technology stack inventory
