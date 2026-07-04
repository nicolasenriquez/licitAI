---
type: standard
title: "Database Standard"
description: "Repository standard for Database Standard."
okf_version: "0.1"
---
# Database Standard

## Overview

Twenty uses **PostgreSQL 16** with a multi-tenant schema-per-workspace architecture. Database changes are managed through **instance commands** (decorator-based migration system) rather than ad hoc SQL or TypeORM auto-sync. A custom **TwentyORM** layer provides workspace-scoped entity management, dynamic schema generation, and ORM-level permission enforcement.

## Core Principles

- **Instance commands are the source of truth for DDL.** No auto-sync, no manual schema changes.
- **Migrations must be reversible.** Every `up` must have a corresponding `down`.
- **Migrations must be idempotent.** Use `IF EXISTS` / `IF NOT EXISTS`.
- **Per-workspace schema isolation.** Each tenant has its own PostgreSQL schema (`workspace_<id>`).
- **Dynamic entity schemas.** Workspace data entities are generated from metadata at runtime, not hardcoded.
- **Never modify committed instance commands.** Write new commands for further changes.

## Configuration

### Instance Command Generation

```bash
# Fast command (schema only)
npx nx run twenty-server:database:migrate:generate --name add-new-column --type fast

# Slow command (schema + data migration)
npx nx run twenty-server:database:migrate:generate --name backfill-data --type slow
```

### Database Commands

```bash
npx nx database:reset twenty-server                         # Truncate + migrate + seed
npx nx run twenty-server:database:migrate:prod              # Run pending fast commands
npx nx run twenty-server:database:init:prod                 # Initialize from scratch
```

## Schema Layers

| Schema | Purpose | Managed By |
| --- | --- | --- |
| `core` | Workspaces, users, billing, signing keys | Core modules |
| `metadata` | Object/field definitions, views, roles, permissions | Metadata modules |
| `workspace_<id>` | Tenant CRM data. Dynamic shape. | TwentyORM runtime generation |

## Usage Patterns

### Fast Instance Command

```typescript
import { QueryRunner } from 'typeorm';
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.15.0', 1781600000000)
export class AddIsSystemSideEffectFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['view', 'fieldMetadata', 'objectMetadata']) {
      await queryRunner.query(
        `ALTER TABLE "core"."${table}" ADD COLUMN IF NOT EXISTS "isSystemSideEffect" boolean NOT NULL DEFAULT false`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['view', 'fieldMetadata', 'objectMetadata']) {
      await queryRunner.query(
        `ALTER TABLE "core"."${table}" DROP COLUMN IF EXISTS "isSystemSideEffect"`,
      );
    }
  }
}
```

### Slow Instance Command

```typescript
import { DataSource, QueryRunner } from 'typeorm';
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.14.0', 1781515653781, { type: 'slow' })
export class BackfillViewVisibilitySlowInstanceCommand implements SlowInstanceCommand {
  async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.query(
      `UPDATE "core"."view" SET "visibility" = 'WORKSPACE' WHERE "type" = 'TABLE_WIDGET' AND "visibility" = 'UNLISTED'`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {}
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
```

### TwentyORM Entity Manager

```typescript
// WorkspaceEntityManager provides:
// - Permission enforcement (validateOperationIsPermittedOrThrow)
// - Row-level security predicate injection
// - Nested relation connect/disconnect
// - File field synchronization
// - Event emission on mutations
// - Upgrade-aware proxying (blocks writes during upgrades)

const entityManager = workspaceDataSource.getEntityManager();
const company = await entityManager.findOne('company', { where: { id: companyId } });
```

### Workspace Schema Manager

```typescript
// Managed by five sub-managers:
// - WorkspaceSchemaTableManagerService   (CREATE/DROP/ALTER/RENAME tables)
// - WorkspaceSchemaColumnManagerService  (ADD/DROP/ALTER columns)
// - WorkspaceSchemaIndexManagerService   (CREATE/DROP indexes)
// - WorkspaceSchemaEnumManagerService    (CREATE/DROP enum types)
// - WorkspaceSchemaForeignKeyManagerService (ADD/DROP foreign keys)

// All operate via raw SQL through QueryRunner.query()
```

## Column Type Mapping

| FieldMetadataType | PostgreSQL Column Type |
| --- | --- |
| UUID | uuid |
| TEXT, RICH_TEXT | text |
| BOOLEAN | boolean |
| NUMBER | double precision |
| NUMERIC | numeric |
| DATE | date |
| DATE_TIME | timestamptz |
| SELECT | varchar |
| MULTI_SELECT | varchar[] |
| RELATION (ManyToOne) | uuid (join column) |
| RAW_JSON, ARRAY | jsonb |
| TS_VECTOR | tsvector |

## Do's

- Do generate an instance command after any entity file change.
- Do implement both `up` and `down` in every instance command.
- Do use `IF EXISTS` / `IF NOT EXISTS` for idempotent migrations.
- Do run `database:migrate:prod` after deployment to apply pending commands.
- Do use the TwentyORM `WorkspaceEntityManager` for workspace data access.
- Do use raw SQL in instance commands (`queryRunner.query()`).
- Do test migrations with `database:reset` locally before committing.

## Don'ts

- Don't modify committed instance command `up`/`down` logic. Write a new command.
- Don't use TypeORM auto-sync (`synchronize: true`) in any environment.
- Don't write raw SQL outside of instance commands and schema managers.
- Don't skip `down` implementation. Reversible migrations are required.
- Don't use cross-schema queries. Workspace data is isolated per schema.
- Don't hardcode workspace IDs in migrations. Use workspace commands for per-tenant changes.
- Don't run migrations without testing them locally first.

## References

- `CLAUDE.md` — Database commands and instance command documentation.
- `.cursor/rules/server-migrations.mdc` — IDE-specific migration rules.
- `docs/architecture/data-model.md` — Entity model and schema layers.
- `docs/architecture/security-and-identity.md` — Permission enforcement in ORM.
- `packages/twenty-server/src/database/commands/` — Instance command examples.
- `packages/twenty-server/src/engine/twenty-orm/` — TwentyORM source code.
