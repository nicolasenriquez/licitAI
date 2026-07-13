---
type: change-design
title: "Design: mercado-publico-ingestion-cue-hardening"
description: "Design for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Design: mercado-publico-ingestion-cue-hardening
## Context

The existing backbone preserves Mercado Público raw API payloads and CSV files/rows, projects data through staging, refreshes canonical entities, and records job-run counters. The follow-up is driven by production-shaped CUE evidence: API V2 `estado` is not always scalar, detail data is wrapped in the live envelope, missing details need explicit failure semantics, Compra Ágil page-size validation is incomplete, and large CSVs must enter Docker through a read-only mount and be processed incrementally. The work must preserve the current `mp` persistence model and run without a destructive database reset or repository copies of source CSVs.

## Goals / Non-Goals

**Goals:**

- Make V1 list/detail, V2 list/detail, and June/July CSV profiles repeatable and auditable.
- Normalize V2 data at the adapter boundary and persist raw detail responses before extraction.
- Enforce page-size validation before upstream calls.
- Process mounted CSV input as bounded streams/batches with the existing storage-root loader.
- Make skipped, failed, and zero-record outcomes explicit and reconcile per-run deltas across raw, staging, and canonical layers.
- Prove repeat-run idempotency and provide a Docker CUE runbook.

**Non-Goals:**

- Replacing the existing backbone or changing its schema topology.
- Adding a path-based importer, new dependency, scheduler, public trigger, or frontend workflow.
- Resetting or destructively reseeding the database.
- Committing, copying, or synthesizing the CUE CSV files in the repository.

## Boundary and Ownership

### Existing orchestration boundary

`MercadoPublicoJobOrchestratorService` owns the manual job-name/payload dispatch. It delegates source-specific behavior to the existing V1/V2 API services, CSV services, persistence service, and canonical refresh service. The change keeps that interface and does not add a public trigger or scheduler.

### Existing source adapters

The V1/V2 API clients own upstream response-shape adaptation. The CSV storage-root loader owns file discovery and streaming input. These are the only source adapters that should change; downstream persistence consumes normalized values.

### Existing persistence seam

`MercadoPublicoPersistenceService` owns `mp.stg_job_run`, raw payload/file/row persistence, staging writes, identity constraints, and per-run counters. `MercadoPublicoCanonicalRefreshService` owns canonical projection. The CUE gate observes these seams through read-only SQL keyed by the run identifier.

### Test seam and vocabulary

- Module: `packages/twenty-server/src/engine/core-modules/mercado-publico/`.
- Interface: supported job names/payloads and `mp.stg_job_run` status, counters, and error summary.
- Seam: manual job execution through orchestration into persisted raw, staging, and canonical records.
- Adapter: existing API clients and CSV loader.
- Depth / Leverage / Locality: orchestration and persistence already concentrate workflow complexity; source-shape logic remains local to adapters; existing co-located unit tests and Mercado Público integration suites are the highest-leverage proof surfaces.

## Decisions

### Normalize at the V2 adapter boundary

The adapter maps object-shaped `estado.codigo` to the canonical scalar `estado`, with deterministic fallback to an existing scalar or `glosa`; scalar input remains valid. This keeps the canonical contract stable and prevents production response details from leaking into persistence. A normalization helper in a deeper existing adapter/module is preferred over changing every downstream consumer. Alternatives rejected: changing the canonical column to JSON, which expands the contract unnecessarily, and frontend/downstream normalization, which would leave persisted data inconsistent.

### Persist raw detail before extraction

The detail flow records the complete upstream response first, then unwraps the production envelope and projects staging/canonical rows. This preserves diagnostic evidence even when extraction finds no record. Alternatives rejected: persisting only the extracted record, which loses failure evidence, and adding a separate detail storage system, which duplicates the raw layer.

### Validate page size locally

Compra Ágil page size is checked for the inclusive range 10..50 before the HTTP client runs. Invalid input returns a deterministic validation failure and does not create a successful import. Alternatives rejected: relying on upstream rejection, which is nondeterministic and consumes quota, and silently clamping values, which hides caller errors.

### Use the existing CSV root with a read-only Docker mount

The CUE override mounts the host directory read-only at the configured storage root. Existing file discovery and identity logic remains the only CSV entry point. Alternatives rejected: adding a new path argument/importer and copying files into the image, both of which create duplicate semantics and weaken provenance.

### Stream CSVs in bounded batches

The loader reads and profiles the file incrementally, persists raw rows and projections in bounded batches, and never creates a whole-file request or payload. Parser behavior is pinned by tests for semicolon delimiters, quoted fields, Latin-1-compatible input, `NA`/blank values, comma decimals, and date sentinels. Alternatives rejected: whole-file memory loading, which is unsafe for large files, and a new CSV dependency, which is not justified by the required profile.

### Compare per-run deltas and classify outcomes explicitly

CUE captures a run identifier and baseline counts, then asserts deltas for raw files/rows, `records_staged`, and `records_canonicalized`. Disabled jobs are `skipped` with a reason; missing details and positive zero-record runs are non-success outcomes. The runbook does not use nonexistent `records_written`. Alternatives rejected: global table totals, which are polluted by prior runs, and treating zero rows as success, which permits silent no-ops.

### Make `skipped` an explicit status contract

The current `mp.stg_job_run` status constraint does not include `skipped`. The implementation must add the smallest additive status support, including mapping and migration behavior, if Phase 0 confirms the current schema remains unchanged. Disabled CSV jobs must then finalize as `skipped` with a non-empty reason; enabled positive jobs that discover zero importable records must finalize as `failed` with a non-empty reason. This is a contract decision, not an optional migration branch.

## Risks / Trade-offs

- **[Live API shape drift]** → Preserve raw payloads, keep scalar fallback behavior, and test both observed envelopes and compatibility shapes.
- **[Large-file memory or transaction pressure]** → Use bounded batches, explicit batch-size configuration, and tests that exercise multiple batches.
- **[Host mount or encoding misconfiguration]** → Add Docker preflight checks, require a read-only mount, and fail with a non-empty operator-visible reason.
- **[Rerun counter ambiguity]** → Assert per-run deltas keyed by the run identifier and verify identity constraints at every persistence layer.
- **[Environment contains no source CSV]** → Treat missing mounted files as a failed/skipped setup condition; never add fixtures to the repository or fabricate positive counts.

## Migration Plan

1. Deploy code and documentation changes without resetting the database.
2. Confirm existing schema and job-status compatibility; add the smallest additive `skipped` status support using the repository migration convention when it is not already present. Never edit a committed `up`/`down` migration.
3. Configure the Docker CUE override with the host CSV directory mounted read-only.
4. Run API checks, then the four CSV profiles, then repeat-run and failure-path checks in the documented order.
5. Roll back application changes if needed; retain raw audit evidence and do not delete persisted data as part of rollback.

## Verification Strategy

- Unit proof: object/scalar V2 state normalization, confirmed detail-envelope extraction, page sizes `10` and `50`, rejection of `9`/`1`, and no upstream call after validation failure.
- Service proof: raw detail persistence precedes extraction; missing detail finalizes as `failed` with non-zero failures and a non-empty explanation; the existing soft-success regression is removed.
- CSV proof: parser fixtures cover semicolon/quotes/Latin-1-compatible text/`NA`/blank/comma decimals/date sentinels; a multi-batch file proves bounded processing and raw-row evidence.
- Integration proof: run-specific deltas reconcile raw input, `records_staged`, and `records_canonicalized`; disabled, zero-record, failure, and repeat-run paths are explicitly asserted.
- CUE proof: Docker health, read-only mount, ordered jobs, status/counter criteria, no-reset execution, and no committed/copied source CSVs are recorded in the change-local runbook.

## Operator Prerequisites

- Confirm the exact production V2 detail envelope and one known valid detail code in the target environment before live CUE execution; store only a redacted fixture or captured shape.
- Confirm the host CSV directory and credentials are available to the Docker runner; these are operator inputs, not repository artifacts.
- Do not mark the live CUE task complete when these prerequisites are unavailable; record the limitation in the handoff.

