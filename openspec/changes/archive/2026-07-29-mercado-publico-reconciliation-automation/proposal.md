## Why

Mercado Público canonical and Compra Ágil data already exist, but the gold/read
model consumed by the browse tabs is empty because reconciliation is only
manually invoked, lacks job-run persistence, and does not materialize
`compra_agil`. This change makes reconciliation observable, safely scheduled,
and complete without automating ingestion or changing the read API.

## What Changes

- Persist success and failure outcomes for `reconciliation-refresh` using the
  existing `mp.stg_job_run` contract while preserving original errors.
- Register a stable daily BullMQ cron that enqueues the existing Mercado Público
  reconciliation executor with `requestedBy: schedule`.
- Materialize `licitacion`, `orden_compra`, and `compra_agil` into
  `mp.gold_detected_process` with set-based, upsert-only reconciliation status
  precedence.
- Keep API, CSV, and ingestion triggers CLI-only; add no public mutation,
  scheduler UI, migration, or new dependency.

## Capabilities

### New Capabilities

- `mercado-publico-reconciliation-automation`: Observable scheduled execution
  and complete gold/read-model materialization for reconciliation refreshes.

### Modified Capabilities

- `mercado-publico-ingestion-backbone`: Reconciliation refresh gains a daily
  internal scheduler and gold materialization behavior beyond phase-1 manual
  execution.

## Impact

- Affected backend files under `packages/twenty-server/src/engine/core-modules/`
  and the Mercado Público module, plus focused unit tests.
- BullMQ cron registration and the existing Mercado Público domain queue.
- Writes only to existing `mp.stg_job_run` and `mp.gold_detected_process` tables;
  no schema migration is expected.
- Existing internal read contracts and authentication/permission guards remain
  unchanged.
