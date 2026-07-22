## Context

The Mercado Público module already owns ingestion, reconciliation, job
execution, BullMQ queues, and the `mp` persistence layer. The current
`reconciliation-refresh` path can be invoked by the command runner, but it
does not persist an `stg_job_run`, is not registered with the existing cron
registry, and updates the gold read model only for licitaciones and órdenes de
compra. The browse consumers therefore cannot see Compra Ágil even when its
canonical rows exist.

The implementation must remain deployment-local, preserve the current internal
queue executor and retry behavior, avoid schema changes, and keep ingestion
jobs/manual API and CSV triggers out of scope.

## Goals / Non-Goals

**Goals:**

- Make every reconciliation refresh success or failure visible through the
  existing `mp.stg_job_run` observability contract.
- Register an idempotent daily BullMQ cron that enqueues the existing
  `MercadoPublicoJob` with an explicit schedule origin.
- Materialize all canonical process types into
  `mp.gold_detected_process` using one set-based upsert with exact, candidate,
  unmatched precedence.
- Preserve original failures, null semantics, historical gold rows, and
  existing auth/read contracts.

**Non-Goals:**

- Scheduling or changing API V1, API V2, CSV, or ingestion jobs.
- Adding a public GraphQL mutation, scheduler UI, new table, migration, cache,
  dependency, or frontend fallback to canonical tables.
- Promoting heuristic candidates to exact matches or inventing unavailable
  titles, buyers, priorities, or counters.

## Decisions

### Reuse the existing job-run persistence service

Wrap only the `reconciliation-refresh` branch in
`createJobRun`/`finalizeJobRun`. This keeps the existing executor as the single
source of behavior and makes command and scheduled runs observable without a
new persistence abstraction. The error is finalized as failed and then
re-thrown so worker retry/error handling remains unchanged.

### Reuse the existing BullMQ cron registry and domain queue

Add a Mercado Público cron command/job to the same `CronRegisterAllCommand`
pattern used by other recurring jobs. The cron handler only enqueues
`MercadoPublicoJob`; it does not execute reconciliation inline. A stable
`jobId` and `upsertJobScheduler`/`addCron` registration make restarts and
multiple workers safe. A fixed 24-hour interval is used without an implicit
timezone.

### Materialize gold set-wise from canonical tables and reconciliation evidence

At the end of the heuristic refresh, build one canonical relation containing
`licitacion`, `orden_compra`, and `compra_agil`, derive one status per entity from
existing reconciliation evidence, and upsert into `gold_detected_process`.
The precedence is exact, then candidate, then unmatched, then null. The write
is upsert-only, preserves unavailable fields as null, and uses the existing
natural-key conflict target. This replaces the per-row gold update loop while
leaving reconciliation event writes intact.

### Keep scheduled execution explicit in the internal payload

`requestedBy` becomes the narrow union `command | schedule`. CLI-triggered
payloads remain `command`; the cron handler sets `schedule`. No caller-facing
API contract changes.

## Risks / Trade-offs

- [Risk] A daily refresh can be expensive on a large corpus. → [Mitigation]
  Keep the cadence daily, reuse existing bounded worker retry/backoff, and do
  not trigger a full refresh during application startup; run one explicit
  post-deploy backfill.
- [Risk] A SQL projection can drift from the gold schema. → [Mitigation]
  Reuse the existing entity columns and conflict key, cover all three source
  types and null fields with focused tests, and run server type/lint checks.
- [Risk] A partial refresh could leave historical gold rows. → [Mitigation]
  Use upsert-only semantics and never delete rows; the existing read model
  remains available during failed runs.
- [Risk] Scheduled and manual runs can overlap. → [Mitigation] Use the stable
  scheduler identity, preserve BullMQ job semantics, and rely on existing
  reconciliation/gold natural-key upserts for safe reruns.

## Migration Plan

1. Deploy the code and register the scheduler through the normal cron bootstrap.
2. Run `mercado-publico:run --job-name reconciliation-refresh` once as the
   operational backfill.
3. Verify `mp.stg_job_run`, gold counts by process type, and the existing
   internal read consumers.
4. Roll back by removing the scheduler registration and deploying the prior
   code; no database migration or destructive data operation is required.

## Open Questions

- The exact visual browser smoke evidence remains an operational acceptance
  step and depends on an authenticated in-app browser session; it is not a
  code contract change.
