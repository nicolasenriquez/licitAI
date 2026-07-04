---
type: standard
title: "GraphQL Standard"
description: "Repository standard for GraphQL Standard."
okf_version: "0.1"
---
# GraphQL Standard

## Overview

Twenty uses **GraphQL Yoga** as the GraphQL server with a **triple-endpoint** design. The schema for the core data API is generated dynamically at runtime from workspace metadata via `WorkspaceSchemaFactory`. Frontend types are generated via Apollo codegen. GraphQL is the primary API protocol; REST and MCP are complementary.

## Core Principles

- **Triple-endpoint design.** Three separate GraphQL endpoints with distinct schemas and purposes.
- **Runtime schema generation.** Core data API schema is generated per workspace from metadata, not defined statically.
- **Code-first metadata/admin schemas.** Metadata and admin schemas are built from NestJS modules with decorators.
- **Type-safe frontend.** Apollo codegen generates typed hooks and fragments from all three schemas.
- **Dataloaders for batching.** `DataLoader` instances prevent N+1 queries on relations.

## Endpoint Architecture

| Endpoint | Purpose | Schema Source |
| --- | --- | --- |
| `POST /graphql` | Core data API. CRUD on workspace entities (companies, contacts, deals, custom objects). | `WorkspaceSchemaFactory`: generates SDL + resolvers per workspace at runtime from ObjectMetadata and FieldMetadata. |
| `POST /metadata` | Schema management API. CRUD on object definitions, fields, views, roles, permissions. | `MetadataModuleFactory`: auto-generates schema from MetadataEngineModule. |
| `POST /admin-panel` | Admin API. Workspace management, feature flags, event logs, billing. | `AdminModuleFactory`: auto-generates schema from AdminPanelModule. |

## Schema Generation (Core API)

```
WorkspaceSchemaFactory (per workspace):
  1. WorkspaceGraphqlSchemaSDLService generates SDL string from workspace metadata
     (objects → GraphQL types, fields → fields, relations → connections)
  2. WorkspaceResolverFactory auto-generates resolvers:
     - Query resolvers: findMany, findOne, search
     - Mutation resolvers: create, update, delete
     - Relation resolvers: resolve relations between objects
  3. ScalarsExplorerService wires custom scalars (DateTime, JSON, etc.)
  4. makeExecutableSchema() produces the final GraphQL schema
```

## Running Codegen

After any GraphQL schema change in `twenty-server`, regenerate frontend types:

```bash
# Core data schema types
npx nx run twenty-front:graphql:generate

# Metadata schema types
npx nx run twenty-front:graphql:generate --configuration=metadata

# Admin schema types
npx nx run twenty-front:graphql:generate --configuration=admin
```

Codegen configs are in `packages/twenty-front/codegen.cjs`, `codegen-metadata.cjs`, and `codegen-admin.cjs`.

## Usage Patterns

### Resolver with Permissions

```typescript
@Resolver(() => Company)
export class CompanyResolver {
  constructor(private readonly companyService: CompanyService) {}

  @Query(() => [Company])
  @UseGuards(WorkspaceAuthGuard)
  async companies(
    @Args() args: FindManyCompanyArgs,
  ): Promise<Company[]> {
    return this.companyService.findMany(args);
  }
}
```

### Schema Field from Metadata

Fields on workspace objects are generated from FieldMetadata definitions:

```
ObjectMetadata: { nameSingular: "company", namePlural: "companies" }
  └── FieldMetadata: { name: "name", type: TEXT }
  └── FieldMetadata: { name: "employees", type: NUMBER }
  └── FieldMetadata: { name: "industry", type: SELECT, options: [...] }
       │
       ▼
GraphQL Type:
  type Company {
    id: ID!
    name: String
    employees: Float
    industry: String
    createdAt: DateTime
    updatedAt: DateTime
  }
```

### Typed Query on Frontend

```typescript
// After codegen, use typed hooks:
import { useGetCompaniesQuery } from '~/generated/graphql';

const { data, loading, error } = useGetCompaniesQuery({
  variables: { filter: { name: { eq: 'Acme' } } },
});
```

## Do's

- Do regenerate frontend types after any GraphQL schema change in `twenty-server`.
- Do use typed hooks from codegen (never raw `useQuery` with string queries).
- Do add new resolvers in the correct module (core, metadata, or admin).
- Do use guards (`WorkspaceAuthGuard`, `UserAuthGuard`, `SettingsPermissionGuard`) on resolvers.
- Do use DataLoaders for relation resolution to avoid N+1 queries.
- Do keep resolvers thin. Delegate business logic to services.
- Do verify backward compatibility before changing the GraphQL schema.

## Don'ts

- Don't commit code with outdated generated types. CI should catch this.
- Don't use raw `useQuery` or `useMutation` in the frontend. Use codegen hooks.
- Don't expose internal entity fields in the GraphQL schema without review.
- Don't skip permission checks on resolvers. Every data-accessing resolver must have appropriate guards.
- Don't make breaking changes to the GraphQL schema without a migration plan.

## References

- `CLAUDE.md` — GraphQL codegen commands.
- `docs/architecture/current-state.md` — GraphQL API overview.
- `docs/architecture/data-model.md` — Metadata-driven schema generation.
- `packages/twenty-front/codegen.cjs` — Core codegen configuration.
- `packages/twenty-server/src/engine/api/graphql/` — GraphQL engine source.
