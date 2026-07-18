---
type: change-investigation
title: "Investigation: mercado-publico-ingestion-cue-hardening"
description: "Phase 0 scope-lock investigation for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Investigation: mercado-publico-ingestion-cue-hardening

## Purpose

Phase 0 investigation artifact for the Mercado Publico ingestion CUE hardening
change. Confirms module ownership, test seam, production-shaped V2 contract gaps,
persistence and CSV storage-root contracts, and the additive `skipped` status
requirement before implementation slices begin. Non-implementing by design
(`tasks.md` Slice 0, `proposal.md` Execution Order Decision).

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`, `openspec/AGENTS.md`,
`openspec/CONTEXT.md`, change `proposal.md`, `design.md`, `tasks.md`,
`specs/.../spec.md`, `openspec/changes/mercado-publico-ingestion-backbone/{investigation,schema-catalog,fixture-coverage,test-design}.md`,
`packages/twenty-server/AGENTS.md`, `packages/twenty-server/docs/UPGRADE_COMMANDS.md`.
Source inventory via direct read of the full `mercado-publico/` module tree and
integration suites.

---

## 0.1 Module Ownership and Test Seam

### Source inventory

Root module file: `packages/twenty-server/src/engine/core-modules/mercado-publico/mercado-publico.module.ts`.

| File | Role | Depth |
|------|------|-------|
| `mercado-publico.module.ts` | NestJS module wiring (providers, imports, exports) | Thin shell |
| `jobs/mercado-publico.job.ts` | BullMQ job processor; delegates to orchestrator | Thin pass-through |
| `commands/mercado-publico-run.command.ts` | CLI command; enqueues jobs via MessageQueueService | Thin shell |
| `mercado-publico.constants.ts` | Job names, error summaries, run statuses, supported names | Shared constants |
| `services/mercado-publico-job-orchestrator.service.ts` | **Manual job dispatch**: jobName → service.run(payload) | Concentrated switch |
| `services/mercado-publico-persistence.service.ts` | **Persistence**: `createJobRun`, `finalizeJobRun`, raw API/CSV payload/row inserts, staging upserts, identity constraints, `persistV2CompraAgilSnapshot` | Deep (1262 lines) |
| `services/mercado-publico-canonical-refresh.service.ts` | Staging → canonical projection for all 3 API + 4 CSV canonical entities | Deep |
| `services/mercado-publico-reconciliation.service.ts` | Exact + heuristic reconciliation across API/CSV/canonical, gold entity writes | Deep |
| `services/mercado-publico-config.service.ts` | `TwentyConfigService` wrapper exposing `csvDownloadEnabled`, `csvStorageRoot`, API creds | Thin |
| `services/mercado-publico-csv-profile.service.ts` | Orchestrates profiling → raw file meta persistence | Medium |
| `services/mercado-publico-csv-profiling.service.ts` | File discovery, encoding/delimiter/quotechar detection, column observation | Deep |
| `services/mercado-publico-csv-raw-load.service.ts` | `fs.createReadStream` → `csv-parse` stream → batched `insertRawCsvRows` (BATCH_SIZE=1000) | Medium |
| `services/mercado-publico-csv-staging-projection.service.ts` | Raw CSV row → staging projection via column maps, batched (BATCH_SIZE=1000) | Medium |
| `services/mercado-publico-csv-download-shared.service.ts` | HTTP download → temp file → profiling → raw file persistence. Shared by licitaciones + OC downloads | Deep |
| `services/mercado-publico-csv-licitaciones-download.service.ts` | Licitaciones CSV download orchestrator | Medium |
| `services/mercado-publico-csv-oc-download.service.ts` | OC CSV download orchestrator | Medium |
| `services/mercado-publico-csv-file-health-read.service.ts` | SQL read queries for CSV file health status | Thin (read-only) |
| `services/mercado-publico-pipeline-health-read.service.ts` | SQL read queries for pipeline run stats | Thin (read-only) |
| `services/mercado-publico-detected-process-read.service.ts` | SQL read queries for gold detected processes | Thin (read-only) |
| `services/mercado-publico-process-detail-read.service.ts` | SQL read queries for process detail drill-down | Thin (read-only) |
| `services/mercado-publico-quota-tracker.service.ts` | Rate-limit token bucket with Redis-backed quota tracking | Deep |
| `services/mercado-publico-api-quota-usage-read.service.ts` | SQL read queries for quota usage | Thin (read-only) |
| **V1 API services** | | |
| `services/mercado-publico-api-v1-licitaciones-by-date.service.ts` | V1 licitaciones list by date | Medium |
| `services/mercado-publico-api-v1-licitaciones-by-state.service.ts` | V1 licitaciones list by state | Medium |
| `services/mercado-publico-api-v1-licitacion-detail-by-codigo.service.ts` | V1 licitacion detail | Medium |
| `services/mercado-publico-api-v1-oc-by-date.service.ts` | V1 OC list by date | Medium |
| `services/mercado-publico-api-v1-oc-by-state.service.ts` | V1 OC list by state | Medium |
| `services/mercado-publico-api-v1-oc-detail-by-codigo.service.ts` | V1 OC detail | Medium |
| **V2 API services** | | |
| `services/mercado-publico-api-v2-compra-agil-incremental.service.ts` | V2 Compra Agil incremental (cambio_desde/hasta) | Medium |
| `services/mercado-publico-api-v2-compra-agil-publication-window.service.ts` | V2 Compra Agil publication window | Medium |
| `services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service.ts` | V2 Compra Agil detail (has silent-success bug) | Medium |
| **API drivers** | | |
| `drivers/api/mercado-publico-api-v1-licitaciones-client.service.ts` | V1 licitaciones HTTP client | Deep |
| `drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service.ts` | V1 OC HTTP client | Deep |
| `drivers/api/mercado-publico-api-v2-compra-agil-client.service.ts` | V2 Compra Agil HTTP client | Deep |
| **API client utilities** | | |
| `drivers/api/utils/validate-compra-agil-params.util.ts` | Validates `tamano_pagina`, `numero_pagina`, `id`/`q` mutual exclusion | Focused |
| `drivers/api/utils/extract-v2-compra-agil-list-records.util.ts` | Recursive record extraction from `Items`, `Data`, `Resultados` wrappers | Focused |
| `drivers/api/utils/classify-http-failure.util.ts` | HTTP status → error summary mapping | Focused |
| `drivers/api/utils/classify-mercado-publico-http-status.util.ts` | MP-specific HTTP status classification | Focused |
| `drivers/api/utils/coerce-to-nullable-string.util.ts` | Type coercion helper | Utility |
| `drivers/api/utils/create-json-sha256.util.ts` | JSON SHA-256 fingerprint | Utility |
| `drivers/api/utils/parse-mercado-publico-body-error.util.ts` | Error body parser | Utility |
| `drivers/api/utils/parse-mercado-publico-date.util.ts` | Date parser | Utility |
| **CSV utilities** | | |
| `services/utils/csv/parse-csv-line.util.ts` | Line parsing with delimiter/quote/encoding | Focused |
| `services/utils/csv/parse-csv-header.util.ts` | Header detection + column mapping | Focused |
| `services/utils/csv/detect-delimiter.util.ts` | Delimiter auto-detection | Focused |
| `services/utils/csv/detect-encoding.util.ts` | Encoding auto-detection | Focused |
| `services/utils/csv/detect-quotechar.util.ts` | Quote char auto-detection | Focused |
| `services/utils/csv/normalize-scalar.util.ts` | `NA`/blank → null, comma decimal → number | Focused |
| `services/utils/csv/project-staging-row.util.ts` | Column map projection | Focused |
| `services/utils/csv/compute-row-checksum.util.ts` | Row checksum | Utility |
| `services/utils/csv/compute-schema-fingerprint.util.ts` | Schema fingerprint | Utility |
| `services/utils/csv/create-hash-pass-through.util.ts` | Hash pass-through stream | Utility |
| `services/utils/csv/decompress-csv-stream.util.ts` | GZIP decompression | Utility |
| `services/utils/csv/sniff-csv-compression-type.util.ts` | Compression type detection | Utility |
| `services/utils/csv/stream-count-newlines.util.ts` | Newline counting stream | Utility |
| `services/utils/csv/resolve-csv-storage-target-path.util.ts` | Path resolution helper | Utility |
| `services/utils/csv/build-csv-source-file-name.util.ts` | File name builder | Utility |
| **Column maps** | | |
| `services/utils/csv/licitaciones-staging-column-map.constant.ts` | Licitacion column mapping (110 columns → ~25 staging fields) | Configuration |
| `services/utils/csv/oc-staging-column-map.constant.ts` | OC column mapping | Configuration |

### Ownership mapping

```
Manual job contract (jobName + payload)
  └── BullMQ job processor (mercado-publico.job.ts)
        └── MercadoPublicoJobOrchestratorService.run(jobName, payload)
              ├── api-v1-* services (6)
              │     ├── MercadoPublicoApiV1*ClientService → HTTP → classifyFailure
              │     ├── MercadoPublicoPersistenceService.persistV1*Snapshot
              │     ├── MercadoPublicoCanonicalRefreshService.refreshV1*
              │     └── MercadoPublicoPersistenceService.finalizeJobRun
              ├── api-v2-* services (3)
              │     ├── MercadoPublicoApiV2CompraAgilClientService → HTTP → classifyFailure
              │     ├── MercadoPublicoPersistenceService.persistV2CompraAgilSnapshot
              │     ├── MercadoPublicoCanonicalRefreshService.refreshV2CompraAgilFromApiSnapshot
              │     └── MercadoPublicoPersistenceService.finalizeJobRun
              ├── csv-* services (6)
              │     ├── MercadoPublicoCsvDownloadSharedService → HTTP → profiling
              │     ├── MercadoPublicoCsvRawLoadService → fs.createReadStream → csv-parse → batched insert
              │     ├── MercadoPublicoCsvStagingProjectionService → column maps → batched insert
              │     ├── MercadoPublicoCanonicalRefreshService.refreshCanonicalFromCsvSnapshot
              │     └── MercadoPublicoPersistenceService.finalizeJobRun
              └── reconciliation-refresh
                    └── MercadoPublicoReconciliationService.refreshAll* (no job run wrapping)
```

### Depth / Leverage / Locality assessment

- **Persistence service**: deepest (1262 lines). Owns `createJobRun`, `finalizeJobRun`,
  raw row inserts, staging inserts, canonical identity-handling queries, and the
  `raw_csv_file_id` column migration guard (`stgJobRunSupportsRawCsvFileId`).
  `finalizeJobRun` is the single writer of `mp.stg_job_run.status` for all API
  and CSV service paths. High leverage: one change there cascades to every service.
  High locality: single file, single `finalizeJobRun` method.

- **V2 detail service** (`mercado-publico-api-v2-compra-agil-detail-by-codigo.service.ts`):
  medium depth. The missing-detail silent-success bug is at line 99-108 where
  `recordsFetched === 0` finalizes with `status: 'success'`, `recordsFailed: 1`,
  no error summary. Also, the raw response is only persisted inside the
  `recordsFetched > 0` block (line 83-97), meaning a missing-detail run loses
  raw evidence.

- **CSV download services** (`mercado-publico-csv-licitaciones-download.service.ts`,
  `mercado-publico-csv-oc-download.service.ts`): medium depth. When
  `csvDownloadEnabled === false`, both finalize with `status: 'success'` (silent
  skip). Both call `createJobRun` before checking the flag, so a job run record
  exists but reports success with zero work — indistinguishable from a real
  zero-record import.

- **CSV raw-load service**: medium depth. Already streams (`createReadStream`),
  already batches (BATCH_SIZE=1000). Finalize always uses `status: 'success'`
  even when `successCount === 0` (the zero-record case). No `skipped` path.

- **CSV staging projection**: medium depth. Already batches (BATCH_SIZE=1000).
  Finalize always uses `status: 'success'` even when `staged === 0`.

- **V2 incremental + publication-window services**: medium depth. `parsePayload`
  does NOT validate `tamano_pagina` range — only type-checks `typeof`. The
  `validateCompraAgilListParams` utility (in the client driver) DOES validate
  but only after `parsePayload` passes the value through. The client-side
  validator uses `<= 0` for lower bound and `> 50` for upper — so values 1-9
  pass through to the HTTP call.

- **V2 API client** (`mercado-publico-api-v2-compra-agil-client.service.ts`):
  deep. Calls `validateCompraAgilListParams` in `getList`. The current validator
  accepts `tamano_pagina: 1` because the check is `<= 0` not `< 10`.

- **Canonical refresh service**: deep. Owns all staging → canonical SQL with
  `INSERT ... ON CONFLICT` identity keys. Already correct — no silent-success or
  missing-raw paths there.

### Highest test seam

The manual job contract (`jobName` + `payload`) through
`MercadoPublicoJobOrchestratorService` into `mp.stg_job_run` and the
raw/staging/canonical persistence layers is the highest observable external
contract.

Unit proofs exist co-located with each service (`services/__tests__/`). These
test the service at the `finalizeJobRun` boundary via mock persistence.

Integration proofs exist at `packages/twenty-server/test/integration/mercado-publico/suites/`:
- `mp-schema-contract.spec.ts` — verifies all 25 `mp.*` tables exist (no column-level assertions)
- `raw-layer-persistence.spec.ts` — raw API/CSV row insertion + identity constraints
- `quota-usage-db.spec.ts` — quota usage counters
- `csv-file-health-db.spec.ts` — CSV file health read queries
- `csv-ingestion-canonical-refresh.spec.ts` — end-to-end CSV → canonical
- `api-v1-licitaciones-canonical-refresh.spec.ts` — end-to-end V1 API → canonical
- `reconciliation-refresh.spec.ts` — reconciliation table writes

The highest test seam for the CUE hardening change: the database-backed
integration suites observing `mp.stg_job_run` status/counters after a manual
job execution through the orchestrator. These prove the external contract without
relying on service-level mocks.

---

## 0.2 V2 Contract Gaps

### Current V2 list record type

File: `drivers/api/types/mercado-publico-api-v2-compra-agil-record.type.ts`

```typescript
export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  estado?: string;  // SCALAR only — does not accept object shape
  region?: number;
  // ...
};
```

### Production-shaped V2 estado

Production responses include object-shaped `estado`:
```json
{
  "codigo": "...",
  "estado": {
    "codigo": "cerrada",
    "glosa": "Cerrada"
  }
}
```

The current type (`estado?: string`) and the extraction util
(`extract-v2-compra-agil-list-records.util.ts`) pass the raw object through
unchanged. No normalization helper exists. The object reaches staging/canonical
persistence, breaking the scalar column contract.

**Required**: normalization helper at the V2 adapter boundary mapping
`estado.codigo` → scalar, with fallback to `estado.glosa` or an existing scalar.
The type must become `estado?: string | { codigo?: string; glosa?: string }`.

### V2 detail envelope

Current fixtures (`drivers/api/__tests__/fixtures/v2-compra-agil-detail-*.json`):
flat top-level objects — `codigo`, `estado`, `region`, and optionally
`orden_compra`. No nested envelope.

Production detail responses wrap data in a JSON wrapper (e.g.
`{ "data": { ... } }` or `{ "result": { ... } }`). The current
`MercadoPublicoApiV2CompraAgilClientService.getByCodigo` returns the raw
response, and the detail-by-codigo service assumes it matches the flat record
type directly.

If the production envelope wraps the detail record, the service must unwrap it
before extraction. The design decision is to persist the complete raw response
in `mp.raw_api_payload` and then extract the domain record from the unwrapped
shape.

**Missing fixtures for Slice 1 (1.1):**
- Object-shaped `estado` with `codigo` (happy path)
- Object-shaped `estado` with no `codigo`, only `glosa` (fallback path)
- V2 list response with object-shaped `estado` in `Items` array
- V2 detail response wrapped in production envelope (redacted)
- V2 detail response with an envelope but no usable detail record (missing-detail)

### Missing detail silent-success

File: `mercado-publico-api-v2-compra-agil-detail-by-codigo.service.ts:83-108`

```typescript
if (recordsFetched > 0) {
  // persistV2CompraAgilSnapshot + canonical refresh
}
// If recordsFetched === 0, NO raw payload is persisted
await this.mercadoPublicoPersistenceService.finalizeJobRun({
  jobRunRecordId: jobRunRecord.id,
  status: 'success',         // BUG: should be 'failed'
  finishedAt: new Date(),
  recordsFetched,
  recordsStaged: recordsFetched,  // = 0
  recordsCanonicalized,
  recordsFailed: recordsCanonicalized === 0 && recordsFetched === 0 ? 1 : 0,  // = 1
  // No errorSummary
});
```

Two defects:
1. `status: 'success'` even though no record was found. Violates spec:
   "If a detail response contains no usable record, the system MUST mark the
   run `failed`, MUST set `records_failed` greater than zero, and MUST write a
   non-empty `error_summary`."
2. Raw response never persisted in the zero-record path (only persisted when
   `recordsFetched > 0`). Violates spec: "The complete response remains queryable
   in the raw layer."

The existing test at
`services/__tests__/mercado-publico-api-v2-compra-agil-detail-by-codigo.service.spec.ts:126`
proves this: the "soft miss" test asserts `status: 'success'` with
`recordsFailed: 1`. Task 1.2 must flip this expectation to `status: 'failed'`
with a non-empty `errorSummary` and raw evidence assertion.

---

## 0.3 Persistence and Operational Contracts

### stg_job_run status constraint

File: `src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run.ts:26-35`

```sql
CONSTRAINT "ck_mp_stg_job_run_status"
  CHECK (
    status IN (
      'success',
      'failed',
      'soft_miss',
      'param_error',
      'retryable_failed'
    )
  )
```

**`skipped` absent** from the CHECK constraint. The TypeScript type
`MERCADO_PUBLICO_JOB_RUN_STATUSES` at `mercado-publico.constants.ts:125-131`
similarly lacks `skipped`.

Per design decision: "The implementation must add the smallest additive status
support, including mapping and migration behavior, if Phase 0 confirms the
current schema remains unchanged."

Migration path: create a NEW instance command (fast type) with:
- `up`: `ALTER TABLE mp.stg_job_run DROP CONSTRAINT ck_mp_stg_job_run_status;
  ALTER TABLE mp.stg_job_run ADD CONSTRAINT ck_mp_stg_job_run_status CHECK (status IN (... + 'skipped'));`
- `down`: identical `DROP/ADD` restoring original five-value set.
- Generator: `npx nx run twenty-server:database:migrate:generate --name mp-stg-job-run-add-skipped-status --type fast`

**Never edit the committed migration.** Per `UPGRADE_COMMANDS.md`: "Never delete
or rewrite committed up/down logic — append, don't mutate."

### Counter columns

`mp.stg_job_run` counter columns (from migration file:17-21):

| Column | Type | Nullable |
|--------|------|----------|
| `records_fetched` | `integer` | YES |
| `records_staged` | `integer` | YES |
| `records_canonicalized` | `integer` | YES |
| `records_failed` | `integer` | YES |

**`records_written` does NOT exist** — confirmed by grep of all twenty-server
TypeScript files (zero matches). The spec correctly uses `records_staged` and
`records_canonicalized` for CUE assertions.

### Identity keys

| Layer | Table | Key | Type |
|-------|-------|-----|------|
| Job run | `mp.stg_job_run` | `uk_mp_stg_job_run_name_run_id` | UNIQUE (`job_name`, `job_run_id`) |
| Raw API | `mp.raw_api_payload` | `uk_mp_raw_api_payload_checksum` | UNIQUE (`checksum`) |
| Raw CSV file | `mp.raw_csv_file` | `uk_mp_raw_csv_file_compound` | UNIQUE (`source_dataset`, `source_period`, `source_modality`, `file_checksum`) |
| Raw CSV row | `mp.raw_csv_row` | `uk_mp_raw_csv_row_checksum` | UNIQUE (`row_checksum`) |
| Staging API V1 licitacion | `mp.stg_api_v1_licitacion` | (PK only via raw API payload + codigo_externo dedup in canonical refresh) | — |
| Staging API V1 OC | `mp.stg_api_v1_orden_compra` | (PK only) | — |
| Staging API V2 | `mp.stg_api_v2_compra_agil` | (PK only; dedup via `DISTINCT ON (codigo)` in canonical refresh) | — |
| Staging CSV licitacion | `mp.stg_csv_licitacion` | `uk_mp_stg_csv_licitacion_row_columns` | UNIQUE (`raw_csv_row_id`, all column values) |
| Staging CSV OC | `mp.stg_csv_orden_compra` | `uk_mp_stg_csv_orden_compra_row_columns` | UNIQUE (`raw_csv_row_id`, all column values) |
| Canonical licitacion | `mp.licitacion` | `uk_mp_licitacion_codigo_externo` | UNIQUE (`codigo_externo`) |
| Canonical OC | `mp.orden_compra` | `uk_mp_orden_compra_codigo` | UNIQUE (`codigo`) |
| Canonical Compra Agil | `mp.compra_agil` | (codigo is de facto unique via `ON CONFLICT (codigo)`) | — |

### FK relationships

| Child | Parent | FK name | ON DELETE |
|-------|--------|---------|-----------|
| `mp.raw_api_payload` | `mp.stg_job_run(id)` | `fk_mp_raw_api_payload_ingestion_job_id` | `SET NULL` |
| `mp.raw_csv_file` | `mp.stg_job_run(id)` | `fk_mp_raw_csv_file_ingestion_job_id` | `SET NULL` |
| `mp.raw_csv_row` | `mp.stg_job_run(id)` | `fk_mp_raw_csv_row_ingestion_job_id` | `SET NULL` |
| `mp.stg_job_run` | `mp.raw_csv_file(id)` | `fk_mp_stg_job_run_raw_csv_file_id` | `SET NULL` |

### CSV storage-root contract

File: `mercado-publico-config.service.ts:52-54`

```typescript
csvStorageRoot: this.twentyConfigService.get('MERCADO_PUBLICO_CSV_STORAGE_ROOT')
```

Used by three services:
1. `mercado-publico-csv-download-shared.service.ts:48-49` — downloads to
   `{csvStorageRoot}/{sourceDataset}/{sourcePeriod}/{sourceModality}/`
2. `mercado-publico-csv-profiling.service.ts:47-48` — profiles files from
   `{csvStorageRoot}/{sourceDataset}/{sourcePeriod}/{sourceModality}/`
3. `mercado-publico-csv-raw-load.service.ts:155-165` — loads raw rows from
   `{csvStorageRoot}/{sourceDataset}/{sourcePeriod}/{sourceModality}/{sourceFileName}`

All three resolve paths at runtime from the single env var. The `csvStorageRoot`
is optional (`string | undefined`) — services throw when not configured.

### Docker compose

File: `packages/twenty-docker/docker-compose.yml`

Mercado Publico env vars declared for both `server` and `worker` services:
- `MERCADO_PUBLICO_API_TICKET`, `MERCADO_PUBLICO_API_V1_BASE_URL`,
  `MERCADO_PUBLICO_HTTP_TIMEOUT_MS`, `MERCADO_PUBLICO_HTTP_MAX_RETRIES`,
  `MERCADO_PUBLICO_HTTP_RETRY_BACKOFF_MS`, `MERCADO_PUBLICO_QUOTA_TIMEZONE`,
  `MERCADO_PUBLICO_API_DAILY_LIMIT`, `MERCADO_PUBLICO_API_V2_BASE_URL`

**Missing:**
- `MERCADO_PUBLICO_CSV_STORAGE_ROOT` env var (required for CSV ops)
- `COMPRA_AGIL_API_TICKET` env var (required for V2 API)
- `COMPRA_AGIL_API_BASE_URL` env var (required for V2 API)
- `MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED` env var
- CSV volume mount or Compose override: intentionally out of repository scope.

Task 2.5 keeps CSV location and transport operator-owned. The deployment must
provide `MERCADO_PUBLICO_CSV_STORAGE_ROOT` through its own environment and
make the files readable there; this change does not prescribe a host path,
bind mount, or additional Compose file.

### csvDownloadEnabled gate

When `csvDownloadEnabled === false`, both `csv-licitaciones-download` and
`csv-oc-download` currently:
1. Create a job run record (status defaults to `'failed'` during insert)
2. Finalize with `status: 'success'`, `recordsFetched: 0`, `recordsFailed: 0`
3. Log and return without doing any download work

This is the disabled-job silent success. Task 2.7 must flip this to:
1. Create a job run record
2. Finalize with `status: 'skipped'`, non-empty `errorSummary`, and
   `recordsFailed: 0`
3. Log and return

### Zero-record positive CSV

When `csv-raw-load` or `csv-staging-projection` processes a file with zero
importable rows, both finalize with `status: 'success'`. The spec requires
`status: 'failed'` with non-empty reason for positive zero-record runs.

### tamano_pagina lower-bound gap

Current `validateCompraAgilListParams` (`validate-compra-agil-params.util.ts:36-42`):

```typescript
if (params.tamano_pagina !== undefined) {
  if (params.tamano_pagina <= 0) {          // Allows 1-9
    errors.push({ field: 'tamano_pagina', code: 'out_of_range' });
  } else if (params.tamano_pagina > 50) {   // Correctly rejects 51+
    errors.push({ field: 'tamano_pagina', code: 'exceeds_max' });
  }
}
```

The spec requires 10..50 inclusive. Current lower bound check is `<= 0`, which
allows values 1-9 through. Fix: change to `params.tamano_pagina < 10`.

Additionally, the `parsePayload` methods in the V2 incremental and
publication-window services currently bypass the validator entirely — they just
type-check `typeof` the value. The validator runs inside the client's `getList`
method, AFTER parsePayload. The spec says "before the HTTP client runs" — which
is already satisfied by the client's pre-flight call. But the service-level
`parsePayload` should also enforce the range to fail-fast before job run creation
and to produce a `param_error` status without quota consumption.

---

## Scope Lock Summary

| Item | Status |
|------|--------|
| Module ownership (orchestrator + 13 services + 3 clients + persistence) | Confirmed |
| Test seam (integration suites + co-located unit specs) | Confirmed |
| `skipped` status absent from CHECK constraint | **Confirmed — needs new migration** |
| `skipped` absent from TypeScript constant | **Confirmed — needs constant update** |
| Counter columns (`records_fetched/staged/canonicalized/failed`) | Confirmed |
| `records_written` does not exist | Confirmed (zero grep matches) |
| Identity keys for per-run deltas | Confirmed (detailed above) |
| `csvDownloadEnabled` silent skip | **Confirmed — two services finalize `success`** |
| Zero-record positive CSV silent success | **Confirmed — raw-load and staging-projection** |
| `tamano_pagina` lower bound allows 1-9 | **Confirmed — validator uses `<= 0`** |
| V2 `estado` type is scalar-only | **Confirmed — needs union type** |
| V2 detail response missing raw persistence on zero records | **Confirmed — raw only persisted in `recordsFetched > 0` block** |
| V2 detail missing record finalizes as `success` | **Confirmed — service test asserts `status: 'success'`** |
| CSV storage-root = single env var, no Docker mount | **Confirmed — no CSV volume in compose** |
| Docker compose missing CSV env vars | **Confirmed** |
| Bounded streaming + batching exists | Confirmed (BATCH_SIZE=1000, `createReadStream`) |
| `csv-parse` + `fs.createReadStream` used for streaming | Confirmed |
| Canonical refresh identity handling correct | Confirmed (ON CONFLICT keys) |

### Gaps requiring operator input (recorded in operator-prerequisites.md)

- Exact production V2 detail envelope shape (currently flat in fixtures)
- One known valid detail code for the target environment
- Host CSV directory path for the four June/July profiles
- Redacted fixture for production-shaped V2 detail response
- Redacted fixture for object-shaped `estado` in V2 list response
