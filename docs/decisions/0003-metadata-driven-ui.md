---
type: decision
title: "ADR 0003: Metadata-Driven UI with Runtime GraphQL Schema Generation"
description: "Architecture decision record for ADR 0003: Metadata-Driven UI with Runtime GraphQL Schema Generation."
okf_version: "0.1"
---
# ADR 0003: Metadata-Driven UI with Runtime GraphQL Schema Generation

## Status
Accepted (2026-06-20)

## Purpose
Formalize the decision to use a metadata-driven architecture where object and field definitions stored in the database dynamically generate the GraphQL schema at runtime, and the frontend renders UI components from metadata rather than hardcoded schemas.

## Context
Traditional CRMs hardcode their data model in both backend and frontend: a `Company` entity has a fixed set of fields, a fixed GraphQL type, and a fixed table component. This makes customization slow — adding a field requires changes in the database schema, GraphQL schema, backend resolvers, and frontend components.

Twenty's core value proposition is customizability: users define their own objects, fields, views, and workflows as code or through the UI. The system must support dynamic schemas without manual code changes to the core.

The project evaluated metadata-driven vs code-first static schemas, and runtime GraphQL schema generation vs code-first GraphQL with static types.

## Decision

**Use metadata-driven architecture where ObjectMetadata and FieldMetadata entities in the database drive both the GraphQL schema and the frontend UI.**

Key specifics:
- **ObjectMetadata**: defines a database object (table). Fields: `nameSingular`, `namePlural`, `labelSingular`, `icon`, `isActive`, `isSystem`.
- **FieldMetadata**: defines a field (column) on an object. Fields: `name`, `label`, `type` (27 FieldMetadataType values), `options`, `settings`, `relationTargetObjectMetadataId`.
- **GraphQL schema generation**: `WorkspaceSchemaFactory` reads ObjectMetadata and FieldMetadata per workspace, generates SDL (Schema Definition Language) strings, creates resolvers dynamically via `WorkspaceResolverFactory`, and produces an executable schema at runtime via `makeExecutableSchema()`.
- **Frontend metadata consumption**: The frontend fetches metadata from `POST /metadata` (MetadataGraphQLApiModule), stores it in Jotai atoms, and renders tables, forms, and record pages dynamically. Columns, field types, and validation rules come from metadata, not hardcoded components.
- **App SDK**: `defineObject()`, `defineField()`, `defineView()` functions generate metadata definitions as code. These are published to the server which stores them in the metadata tables.

## Consequences

### Positive
- Adding a new object or field does not require changes to core backend or frontend code.
- The frontend is a generic renderer: any object with any fields renders correctly without per-object special casing.
- The app SDK enables third-party developers to extend the CRM without forking the core.
- Metadata is version-controlled through the SDK and instance commands.
- GraphQL schema is always in sync with workspace metadata by construction.

### Costs
- Runtime schema generation adds latency on first request to a workspace (mitigated by caching).
- GraphQL schema changes require running `graphql:generate` manually to regenerate frontend types.
- Type safety is weaker: the frontend receives generic types rather than specific `Company`, `Deal` types. Codegen partially mitigates this.
- Complex field types (composite types like ADDRESS, CURRENCY) require special handling in both schema generation and UI rendering.

### Constraints
- All objects and fields must be representable in the 27 FieldMetadataType values.
- Composite types (ADDRESS, CURRENCY, LINKS, PHONES, EMAILS, FULL_NAME) are stored as exploded columns, not as nested objects, to maintain queryability in PostgreSQL.
- GraphQL codegen must be run after any metadata schema change.
- The frontend must handle any object/field combination generically; per-object custom UI is limited to page layouts and widgets.

## Alternatives Considered

### Code-First Static Schemas
- **Rejected**: Would require manual code changes for every new object or field. Incompatible with the SDK-based app system.

### GraphQL Schema Stitching
- **Rejected**: Stitching multiple static schemas together was considered but rejected in favor of single-workspace schema generation. Schema stitching adds complexity for cross-object relationships.

### No Metadata Layer (direct SQL)
- **Rejected**: Exposing raw SQL to the frontend or apps would break the security model and prevent permission enforcement at the ORM level.

## Related Documents
- `docs/architecture/current-state.md` — Metadata engine overview
- `docs/architecture/data-model.md` — ObjectMetadata and FieldMetadata entity definitions
- `docs/architecture/reference-architecture.md` — Data flow diagram
- `docs/vision-product.md` — Product primitives (objects, views)
