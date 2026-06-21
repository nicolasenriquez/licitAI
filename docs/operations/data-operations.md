# Data Operations

## Purpose
Define the operating baseline for database management, migrations, seed data, and data lifecycle operations in the Twenty CRM platform.

## Primary Audience
Backend engineers, AI agents, and operators managing Twenty databases.

## Executive Summary
Twenty uses PostgreSQL 16 with a multi-tenant schema-per-workspace architecture. Database changes are managed through instance commands (decorator-based migration system) rather than ad hoc SQL. Seed data bootstraps the initial workspace. Database inspection is available via a read-only Postgres MCP server. ClickHouse provides optional analytics storage. Soft deletes are garbage-collected by the trash-cleanup module.

## Database Schema Layers

| Layer | Schema | Purpose | Managed By |
| --- | --- | --- | --- |
| Core | `core` | Shared infrastructure: workspaces, users, billing, signing keys | Core modules (76) |
| Metadata | metadata schema | Workspace-scoped definitions: objects, fields, views, roles, permissions | Metadata modules (72) |
| Workspace data | `workspace_<id>` | Tenant CRM data: companies, contacts, deals, custom objects | TwentyORM runtime schema generation |
| Mercado Publico | `mp` | Deployment-local public procurement corpus: raw source data, canonical entities, reconciliation, gold/read objects | Instance commands and Mercado Publico ingestion modules |
| Analytics | ClickHouse | Event tracking and reporting (optional) | ClickHouse module |

## Database Management Commands

| Command | Purpose | Destructive |
| --- | --- | --- |
| `npx nx database:reset twenty-server` | Truncate, migrate, seed. Wipes all data. | Yes |
| `npx nx run twenty-server:database:init:prod` | Initialize production database from scratch | Yes |
| `npx nx run twenty-server:database:migrate:prod` | Run pending instance commands (fast only) | No |
| `npx nx run twenty-server:database:migrate:generate --name <name> --type fast` | Generate fast instance command (schema only) | Creates file |
| `npx nx run twenty-server:database:migrate:generate --name <name> --type slow` | Generate slow instance command (schema + data migration) | Creates file |

## Instance Commands

### Command Types

| Type | Interface | Purpose | Runs |
| --- | --- | --- | --- |
| **Fast** | `FastInstanceCommand` | Schema-only changes: add/drop columns, create tables, alter types | `up(queryRunner)`, `down(queryRunner)` |
| **Slow** | `SlowInstanceCommand` | Schema changes + data backfills/transformations | `up(queryRunner)`, `down(queryRunner)`, `runDataMigration(dataSource)` |

### Command Registration

```typescript
@RegisteredInstanceCommand('2.15.0', 1781600000000)
export class AddFieldFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."table_name" ADD COLUMN IF NOT EXISTS "new_column" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."table_name" DROP COLUMN IF EXISTS "new_column"`,
    );
  }
}
```

### Operating Rules

1. **Never delete or rewrite committed instance command logic.** Commands are immutable once committed. Write new commands for further changes.
2. **Always implement both `up` and `down`.** Commands must be reversible where possible. Use `IF EXISTS` / `IF NOT EXISTS` for idempotency.
3. **Fast commands run before slow commands.** Schema changes must complete before data migrations can run.
4. **Slow commands receive a full DataSource.** Use `dataSource.query()` or repository access for data migrations.
5. **Generate after entity changes.** Any change to entity classes, field definitions, or relationships requires a new instance command.
6. **Version and timestamp must be unique.** The timestamp (e.g., `1781600000000`) ensures deterministic ordering.
7. **Keep `mp` deployment-local.** The `mp` schema is an exception for public Mercado Publico reference data. Do not store tenant-owned CRM records in it.

### Execution Flow

```
database:migrate:prod
  → UpgradeSequenceReaderService reads all registered commands
  → UpgradeSequenceRunnerService executes in order:
    1. All fast instance commands (up)
    2. All slow instance commands (up + runDataMigration)
  → Workspace commands iterate over active/suspended workspaces
```

### Workspace Commands

Separate from instance commands. Iterate over all active/suspended workspaces for per-workspace data changes. Use `@RegisteredWorkspaceCommand` decorator.

## Seed Data

### Development Seed

`data-seed-dev-workspace.command.ts` creates a bootstrap workspace:

| Entity | What Is Seeded |
| --- | --- |
| Workspace | 1 workspace with default configuration |
| User | 1 admin user with email/password auth |
| UserWorkspace | Membership linking user to workspace |
| Standard objects | Companies, Contacts, Deals, Tasks, Notes, etc. |
| Standard fields | Default fields on each standard object |
| Standard views | Default views (table, kanban) per object |
| Roles | Default roles with permission flags |
| Feature flags | Default feature flag configuration |

### Running Seeds

```bash
npx nx database:reset twenty-server    # Truncate + migrate + seed (dev)
```

## Database Inspection (Postgres MCP)

A read-only PostgreSQL MCP server is configured in `.mcp.json` for AI-assisted debugging:

- **Inspect workspace data**: query workspace schemas to see actual records
- **Verify migrations**: check column types, constraints, indexes after running instance commands
- **Explore metadata**: inspect object and field definitions
- **Debug GraphQL issues**: trace schema generation by inspecting metadata tables

The MCP server is **read-only**. Use CLI commands for write operations.

## ClickHouse (Analytics)

Optional analytics database. Enable via environment configuration.

### Enable ClickHouse

Set `CLICKHOUSE_URL` in environment configuration and enable the ClickHouse module.

### ClickHouse Migrations

Located in `twenty-server/src/database/clickHouse/`. Follow the same pattern as instance commands (up/down).

### ClickHouse Seeds

Seed initial analytics data. Run after migrations.

## Soft Deletes & Trash Cleanup

Twenty uses soft deletes (sets `deletedAt` timestamp) for workspace data entities.

| Aspect | Detail |
| --- | --- |
| Retention | 14 days default (configurable per workspace via `trashRetentionDays`) |
| Cleanup | `trash-cleanup` module runs garbage collection periodically |
| Recovery | Records within retention period can be restored |
| Hard delete | After retention period, records are permanently deleted |

## Backup Strategy

### Docker Compose

```bash
# Backup PostgreSQL data
docker compose -f docker-compose.yml exec db pg_dump -U postgres > backup.sql

# Backup volumes
docker run --rm -v twenty_dev-db-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .
```

### Kubernetes

Use Helm chart with persistent volume snapshots. See `packages/twenty-docker/helm/` for configuration.

## Quality Gates

| Gate | Action |
| --- | --- |
| Migration fails | Rollback `down` for that command, stop execution. Previous commands remain applied. |
| Seed fails | Fail loudly. Do not proceed with incomplete data. |
| Schema drift detected | Reconcile with instance command generation. |
| Soft-deleted records past retention | `trash-cleanup` hard-deletes automatically. |
| ClickHouse unavailable | Degrade gracefully. Core CRM features unaffected. |

## Current Assumptions

- PostgreSQL 16 with per-workspace schema isolation remains the primary data store.
- The `mp` schema is allowed only as a deployment-local public procurement corpus and does not change workspace data isolation.
- Instance commands are immutable once committed to the repository.
- Seed data is minimal bootstrap for development. Production data is populated through the application.
- Soft deletes with 14-day retention are sufficient for recovery needs.
- ClickHouse is optional and can be disabled without affecting core CRM functionality.

## Open Decisions

- Should there be an automated backup schedule for Docker deployments?
- Should seed data include performance testing datasets (1000+ records)?
- Should ClickHouse become a required component for production deployments?
- Should the trash-cleanup retention period be configurable per object type?
