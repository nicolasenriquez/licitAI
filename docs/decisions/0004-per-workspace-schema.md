---
type: decision
title: "ADR 0004: Per-Workspace PostgreSQL Schema Isolation"
description: "Architecture decision record for ADR 0004: Per-Workspace PostgreSQL Schema Isolation."
okf_version: "0.1"
---
# ADR 0004: Per-Workspace PostgreSQL Schema Isolation

## Status
Accepted (2026-06-20)

## Purpose
Formalize the decision to use per-workspace PostgreSQL schema isolation as the multi-tenant data isolation strategy.

## Context
Twenty is a multi-tenant CRM platform where each workspace represents a separate tenant with its own users, data model, and records. Data isolation between tenants is critical for security and data integrity. The system must support:

- **Strong isolation**: one tenant cannot access another tenant's data, even through bugs
- **Dynamic schemas**: each tenant may define custom objects and fields
- **Single database**: a single PostgreSQL instance for operational simplicity
- **Connection efficiency**: cannot open a new database connection per tenant

Three standard multi-tenant strategies were evaluated: database-per-tenant, schema-per-tenant, and row-level multi-tenancy (shared tables with tenant_id column).

## Decision

**Use per-workspace PostgreSQL schema isolation. Each workspace gets its own PostgreSQL schema (`workspace_<id>`) within a shared database instance.**

Key specifics:
- **Core schema**: shared tables (`workspace`, `user`, `userWorkspace`, `billingSubscription`) live in the `core` schema. These are shared across all tenants.
- **Metadata schema**: workspace-scoped metadata tables (`objectMetadata`, `fieldMetadata`, `view`, `role`, `permissionFlag`) live in a metadata schema. One per workspace.
- **Workspace data schemas**: CRM data for each tenant lives in `workspace_<id>`. Schema shape is dynamic, generated from ObjectMetadata and FieldMetadata definitions.
- **TwentyORM layer**: `WorkspaceSchemaManager` manages schema lifecycle (create, alter, drop). `GlobalWorkspaceDataSource` manages per-workspace TypeORM DataSources. `EntitySchemaFactory` compiles TypeORM entity schemas dynamically from metadata.
- **Schema resolution flow**: Request → middleware resolves workspace → TwentyORM fetches/creates per-workspace DataSource → entity schemas compiled → ORM operations executed within schema.

## Consequences

### Positive
- **Strong isolation**: PostgreSQL schemas provide a hard boundary. No query can accidentally cross schemas.
- **Dynamic schemas**: Each workspace can define its own custom tables and columns without affecting other workspaces.
- **Single connection**: The application uses a single database connection, switching schemas via TypeORM DataSource.
- **Independent backups**: PostgreSQL schemas can be dumped/restored independently.
- **No tenant_id column pollution**: Tables do not carry a `workspaceId` column; the schema itself is the boundary.

### Costs
- **Cross-workspace queries are impossible**: cannot join or aggregate across workspaces at the database level. Admin analytics require application-level aggregation or separate ClickHouse pipeline.
- **Connection pooling complexity**: TypeORM DataSources are per-workspace. The `GlobalWorkspaceDataSource` manages a pool of DataSources, limiting the number of active workspaces per process.
- **Schema migration overhead**: instance commands must iterate over all active/suspended workspaces for per-workspace changes.
- **Maximum schema limit**: PostgreSQL has a practical limit on the number of schemas per database (thousands, not millions).

### Constraints
- Workspace data schemas are named `workspace_<id>`. This naming convention is enforced by `WorkspaceSchemaManager`.
- All workspace-scoped entity schemas are compiled at runtime from metadata. Static entity classes exist only for core and metadata entities.
- `WorkspaceEntityManager` blocks writes during metadata upgrades to prevent schema drift.
- The `GlobalWorkspaceDataSource` must maintain a cache of active DataSources. Inactive workspaces are evicted from the cache.

## Alternatives Considered

### Database-Per-Tenant
- **Rejected**: Each tenant in a separate PostgreSQL database provides maximum isolation but requires per-tenant connection pools and complicates operations (backups, migrations, monitoring). Not practical for a SaaS with many small tenants.

### Row-Level Multi-Tenancy (shared tables + tenant_id)
- **Rejected**: Adding `workspaceId` to every table and filtering every query is simpler at the database level but:
  - Leaks tenant awareness into application code (every query must include workspaceId)
  - Makes dynamic schemas harder (custom object columns affect all tenants)
  - A missing WHERE clause exposes data across tenants
  - PostgreSQL Row-Level Security policies can mitigate this but add their own complexity

### Separate PostgreSQL Instances
- **Rejected**: Full instance isolation is the strongest model but requires per-tenant infrastructure (separate servers, backups, monitoring). Not cost-effective for the expected tenant scale.

## Related Documents
- `docs/architecture/data-model.md` — Multi-tenant architecture, entity schemas
- `docs/architecture/security-and-identity.md` — Security boundaries
- `docs/architecture/current-state.md` — Engine architecture
- `docs/architecture/reference-architecture.md` — System diagram
