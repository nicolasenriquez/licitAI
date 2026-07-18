---
type: change-schema-catalog
title: "Schema Catalog: mercado-publico-ingestion-cue-hardening"
description: "Frozen mp schema inventory for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Schema Catalog: mercado-publico-ingestion-cue-hardening

## Purpose

Freeze the `mp` schema layer inventory — tables, columns, constraints, and
counter fields — so the implementation slices in this change operate against a
known snapshot. Mirrors the backbone `schema-catalog.md` format. Non-implementing
by design (Phase 0 scope lock).

Authoritative source: committed migration file
`src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run.ts`
and the `2-16-*-mp-*` slow migrations. No live DB was queried for this catalog
(operator opted for code-only confirmation).

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`, `openspec/AGENTS.md`,
`openspec/CONTEXT.md`, change `proposal.md`, `design.md`, `tasks.md`,
`packages/twenty-server/AGENTS.md`, `packages/twenty-server/docs/UPGRADE_COMMANDS.md`,
`openspec/changes/mercado-publico-ingestion-backbone/schema-catalog.md`.

---

## Table Inventory

### Raw Layer

| Table | Primary Key | Unique Constraints | Foreign Keys |
|-------|-------------|-------------------|--------------|
| `mp.raw_api_payload` | `id` (uuid, gen_random_uuid) | `uk_mp_raw_api_payload_checksum` (`checksum`) | `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL |
| `mp.raw_csv_file` | `id` (uuid, gen_random_uuid) | `uk_mp_raw_csv_file_compound` (`source_dataset`, `source_period`, `source_modality`, `file_checksum`) | `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL |
| `mp.raw_csv_row` | `id` (uuid, gen_random_uuid) | `uk_mp_raw_csv_row_checksum` (`row_checksum`) | `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL |

### Job Run

| Table | Primary Key | Unique Constraints | Foreign Keys | Check Constraints |
|-------|-------------|-------------------|--------------|-------------------|
| `mp.stg_job_run` | `id` (uuid, gen_random_uuid) | `uk_mp_stg_job_run_name_run_id` (`job_name`, `job_run_id`) | `raw_csv_file_id` → `mp.raw_csv_file(id)` ON DELETE SET NULL | `ck_mp_stg_job_run_status`: `status IN ('success','failed','soft_miss','param_error','retryable_failed')` — **`skipped` absent** |

### Staging Layer (API)

| Table | Primary Key | Triggering Migration |
|-------|-------------|---------------------|
| `mp.stg_api_v1_licitacion` | `id` (uuid) | `2-16-instance-command-fast-1782340007800-mp-stg-api-v1-licitacion` |
| `mp.stg_api_v1_orden_compra` | `id` (uuid) | `2-16-instance-command-fast-1782340007800-mp-stg-api-v1-oc` |
| `mp.stg_api_v2_compra_agil` | `id` (uuid) | `2-16-instance-command-fast-1782340007800-mp-stg-api-v2-compra-agil` |

### Staging Layer (CSV)

| Table | Primary Key | Unique Constraints |
|-------|-------------|-------------------|
| `mp.stg_csv_licitacion` | `id` (uuid) | `uk_mp_stg_csv_licitacion_row_columns` (`raw_csv_row_id`, all column values) |
| `mp.stg_csv_orden_compra` | `id` (uuid) | `uk_mp_stg_csv_orden_compra_row_columns` (`raw_csv_row_id`, all column values) |

### Canonical Layer

| Table | Primary Key | De facto Unique Key (ON CONFLICT) | Source |
|-------|-------------|-----------------------------------|--------|
| `mp.licitacion` | `id` (uuid) | `codigo_externo` (`uk_mp_licitacion_codigo_externo`) | `stg_api_v1_licitacion` |
| `mp.orden_compra` | `id` (uuid) | `codigo` (`uk_mp_orden_compra_codigo`) | `stg_api_v1_orden_compra` |
| `mp.compra_agil` | `id` (uuid) | `codigo` (ON CONFLICT (codigo) DO UPDATE) | `stg_api_v2_compra_agil` |
| `mp.licitacion_item` | `id` (uuid) | `(codigo_externo, codigoitem)` | `stg_csv_licitacion` (via raw_csv_row) |
| `mp.licitacion_oferta` | `id` (uuid) | `(codigo_externo, codigoitem, codigo_proveedor, nombre_de_la_oferta)` | `stg_csv_licitacion` (via raw_csv_row) |
| `mp.licitacion_adjudicacion` | `id` (uuid) | `(codigo_externo, codigoitem, rut_proveedor)` | `stg_csv_licitacion` (via raw_csv_row) |
| `mp.orden_compra_item` | `id` (uuid) | `iditem` | `stg_csv_orden_compra` (via raw_csv_row) |
| `mp.compra_agil_cotizacion` | `id` (uuid) | — | (future) |
| `mp.compra_agil_producto_solicitado` | `id` (uuid) | — | (future) |

### Reconciliation / Gold Layer

| Table | Primary Key | Unique Constraints |
|-------|-------------|-------------------|
| `mp.reconciliation_public_market_entities` | `id` (uuid) | `(entity_a_source, entity_a_type, entity_a_key, entity_b_source, entity_b_type, entity_b_key, match_type)` |
| `mp.reconciliation_event` | `id` (uuid) | `event_fingerprint` (SHA-256) |
| `mp.gold_api_quota_usage` | `id` (uuid) | — |
| `mp.gold_conciliacion_licitacion_oc` | `id` (uuid) | — |
| `mp.gold_csv_file_health` | `id` (uuid) | — |
| `mp.gold_detected_process` | `id` (uuid) | `(process_type, process_code)` |
| `mp.gold_pipeline_health` | `id` (uuid) | — |

---

## stg_job_run Column Catalog

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `job_name` | `text` | NO | — | Manual job name (e.g. `api-v2-compra-agil-detail-by-codigo`) |
| `job_run_id` | `text` | NO | — | Unique run identifier (UUID from `crypto.randomUUID()`) |
| `status` | `text` | NO | — | Outcome: `success`, `failed`, `soft_miss`, `param_error`, `retryable_failed`. **`skipped` absent** |
| `started_at` | `timestamptz` | NO | — | Job run start time |
| `finished_at` | `timestamptz` | YES | — | Job run completion time |
| `records_fetched` | `integer` | YES | — | Total records fetched from source |
| `records_staged` | `integer` | YES | — | Records written to staging tables |
| `records_canonicalized` | `integer` | YES | — | Records projected to canonical entities |
| `records_failed` | `integer` | YES | — | Records that failed during processing |
| `error_summary` | `text` | YES | — | Human-readable error description |
| `created_at` | `timestamptz` | NO | `now()` | Row creation time |
| `raw_csv_file_id` | `uuid` | YES | — | FK to `mp.raw_csv_file(id)`. Added by `2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link` |

### Counter fields used in CUE assertions

- `records_staged` — YES (spec confirms)
- `records_canonicalized` — YES (spec confirms)
- `records_fetched` — YES (raw input count)
- `records_failed` — YES (must be 0 for positive scenarios)
- `records_written` — DOES NOT EXIST (confirmed: zero grep matches, not in DDL, not in TS code). Spec correctly omits it.

### Persistence service `finalizeJobRun` contract

File: `mercado-publico-persistence.service.ts:323-350`

```sql
UPDATE mp.stg_job_run
SET
  status = $2,
  finished_at = $3,
  records_fetched = $4,
  records_staged = $5,
  records_canonicalized = $6,
  records_failed = $7,
  error_summary = $8
WHERE id = $1
```

All five counters are set atomically. `errorSummary` can be null (service-level
`finalizeJobRun` calls omit it in the success path). The `status` value passes
through the TypeScript type but the DB CHECK constraint is the enforcement gate.

### Identity chain for per-run deltas

```
mp.stg_job_run.id
  └── mp.raw_api_payload.ingestion_job_id (SET NULL on parent delete)
  └── mp.raw_csv_file.ingestion_job_id (SET NULL on parent delete)
  └── mp.raw_csv_row.ingestion_job_id (SET NULL on parent delete)
      └── mp.stg_csv_licitacion.raw_csv_row_id
      └── mp.stg_csv_orden_compra.raw_csv_row_id
          └── Canonical INSERT ... SELECT ... FROM stg_* WHERE raw_csv_row.ingestion_job_id = $runId
```

The canonical refresh for CSV uses `SELECT ... FROM mp.raw_csv_row rcr JOIN mp.stg_csv_* sc ON sc.raw_csv_row_id = rcr.id WHERE rcr.ingestion_job_id = $1` to scope to a single run. The canonical refresh for API uses `SELECT DISTINCT ON (codigo) FROM mp.stg_api_v2_compra_agil WHERE raw_api_payload_id IN (SELECT id FROM mp.raw_api_payload WHERE ingestion_job_id = $1)`.

CUE per-run deltas are computed from the job run ID: count rows in raw/staging where `ingestion_job_id = $runId`, then compare against `records_staged` and `records_canonicalized` on the job run row.

---

## Additive Status Migration Design

Status: `skipped` not in CHECK constraint.

Migration path (task 2.4):
1. New fast instance command: `npx nx run twenty-server:database:migrate:generate --name mp-stg-job-run-add-skipped-status --type fast`
2. `up`: DROP old constraint, ADD new constraint with `'skipped'` appended
3. `down`: DROP new constraint, ADD old constraint restoring original five values
4. Never edit `2-16-instance-command-fast-1782340007800-mp-stg-job-run.ts`

Migration SQL sketch (implemented in the generated command):

```sql
-- up
ALTER TABLE mp.stg_job_run
  DROP CONSTRAINT IF EXISTS ck_mp_stg_job_run_status;

ALTER TABLE mp.stg_job_run
  ADD CONSTRAINT ck_mp_stg_job_run_status
    CHECK (status IN (
      'success',
      'failed',
      'soft_miss',
      'param_error',
      'retryable_failed',
      'skipped'
    ));

-- down
ALTER TABLE mp.stg_job_run
  DROP CONSTRAINT IF EXISTS ck_mp_stg_job_run_status;

ALTER TABLE mp.stg_job_run
  ADD CONSTRAINT ck_mp_stg_job_run_status
    CHECK (status IN (
      'success',
      'failed',
      'soft_miss',
      'param_error',
      'retryable_failed'
    ));
```
