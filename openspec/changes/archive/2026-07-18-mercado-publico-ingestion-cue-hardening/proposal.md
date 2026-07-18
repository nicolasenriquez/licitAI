---
type: change-proposal
title: "Change Proposal: mercado-publico-ingestion-cue-hardening"
description: "Proposal for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Change Proposal: mercado-publico-ingestion-cue-hardening
## Why

The Mercado Público ingestion backbone has the right persistence layers but its production-shaped API and CSV paths still have contract gaps: V2 payload normalization and detail envelopes do not fully match live responses, missing details can become silent successes, and CSV execution does not yet prove bounded, correctly parsed, idempotent imports. This follow-up hardens those seams so API V1, API V2, and operator-provided CSV profiles can be run repeatedly without a destructive reset.

## Investigation / Current State

- The owning runtime is `packages/twenty-server/src/engine/core-modules/mercado-publico/`, with `MercadoPublicoJobOrchestratorService` dispatching the manual job contract and `MercadoPublicoPersistenceService` writing `mp.stg_job_run`, raw, staging, and canonical records.
- Existing unit seams cover V2 extraction, Compra Ágil parameter validation, the V2 detail service, CSV parsing, and CSV raw loading. Existing integration seams are under `packages/twenty-server/test/integration/mercado-publico/suites/`.
- The current V2 record type accepts scalar `estado`; existing V2 detail fixtures are direct objects, while production-shaped object state and the confirmed live detail envelope still require a redacted fixture or captured response before implementation is finalized.
- The current `mp.stg_job_run.status` constraint includes `success`, `failed`, `soft_miss`, `param_error`, and `retryable_failed`; it does not yet include `skipped`. The change must therefore make skipped-run support an explicit additive implementation decision.
- The existing detail test records a missing detail as `success` with `recordsFailed: 1`; that is the first regression proof for the silent-success defect.

## Change Profile

- Profile: `mixed-change`
- Why this profile fits: the change modifies runtime API/CSV behavior and persistence contracts while also adding operational verification documentation.

## What Changes

- Normalize API V2 `estado` from object-shaped production responses while retaining scalar compatibility.
- Persist V2 detail raw responses before extraction and make missing detail records failed and auditable.
- Validate Compra Ágil page sizes as 10 through 50 before upstream calls.
- Keep CSV file location and transport operator-owned through the existing CSV storage-root loader; add no repository Docker mount.
- Stream and batch large CSVs; validate semicolon delimiters, quoted fields, Latin-1-compatible encoding, `NA`/blank values, comma decimals, and date sentinels.
- Make disabled CSV jobs explicit `skipped` runs and reject positive zero-record no-ops as successful imports.
- Add per-run counter reconciliation, repeat-run idempotency checks, and a CUE runbook using `records_staged` and `records_canonicalized`.

## Capabilities

### New Capabilities

- `mercado-publico-ingestion-cue`: Production-shaped API, CSV, persistence, job-status, idempotency, and CUE acceptance contracts for Mercado Público ingestion.

### Modified Capabilities

None. The existing backbone change remains unchanged; this is a follow-up capability and verification contract.

## Out Of Scope

- Replacing the existing Mercado Público module, queue, persistence topology, or storage-root loader.
  - Exception: an additive refinement that removes the undocumented redundant `mp.raw_csv_file.ingestion_job_id` FK and replaces it with the documented `mp.stg_job_run.raw_csv_file_id` link is in-scope; see design.md.
- Adding a public API, scheduler, frontend workflow, CRM projection, new importer path, or new dependency.
- Resetting, destructively reseeding, deleting, or rewriting existing raw audit data.
- Committing, copying, fabricating, or embedding production CSV files, tickets, credentials, or identifiers.

## Impact

The change affects the existing `twenty-server` Mercado Público adapters, raw/staging/canonical persistence and job-run status paths, CSV parsing/loading flow, tests, and operational documentation. It adds no dependency, no Docker topology change, no new path-based importer, no committed CSV files, and no destructive database operation.

## Ownership and Test Seam

- Highest existing Seam: the manual Mercado Público job contract (`jobName` plus payload) through `MercadoPublicoJobOrchestratorService` into `mp.stg_job_run` and the raw/staging/canonical persistence layers.
- Owning Module: `packages/twenty-server/src/engine/core-modules/mercado-publico/mercado-publico.module.ts` and its API, CSV, orchestration, persistence, and canonical-refresh services.
- Interface: supported Mercado Público job names and payloads, job-run status/counters/error summary, and the persisted `mp` records observable through read-only SQL.
- Highest test Seam: database-backed suites under `packages/twenty-server/test/integration/mercado-publico/suites/`, with focused unit proofs at the adapter and service seams.
- Adapter: the V1/V2 API clients and the storage-root CSV loader; no new adapter boundary is proposed.
- Depth / Leverage / Locality: the existing module concentrates orchestration and persistence behavior, the adapter seams isolate source-shape changes, and the existing test directories provide direct external-behavior coverage without widening the package boundary.

## Prior Art and First Proof

- Prior art: `openspec/changes/mercado-publico-ingestion-backbone/{investigation.md,test-design.md,fixture-coverage.md,operator-runbook.md}`, the existing V2 detail service test, the Compra Ágil parameter-validation test, and the Mercado Público integration suites.
- First failing behavior or contract proof: update the existing missing-detail proof so a response with no usable record fails with a non-empty explanation while retaining the raw response; add the object-shaped `estado` and page-size lower-bound proofs before production code changes.
- Runtime proof boundary: the first end-to-end CUE check crosses the manual job contract and asserts a run-specific status/counter delta, not merely a global table total.

## Verification Policy

- Add fail-first coverage at the adapter/service boundaries before implementation tasks are considered complete.
- Verify missing detail, invalid page-size rejection, skipped CSV configuration, zero-record CSV behavior, counter reconciliation, and repeat-run identity directly at their owning seams.
- Use the existing integration suites for database-backed proofs and focused co-located tests for normalization, parsing, and orchestration.
- Do not use global totals, synthetic positive counts, or a broad suite as a substitute for the run-specific CUE contract.
- Live credentials, the host CSV directory, and a redacted known production detail response are operator prerequisites; if unavailable, record that limitation rather than fabricating evidence.

## Execution Order Decision

- Required: yes.
- Why: the change has separate API, validation/status, CSV, and CUE verification slices with real dependencies and a final no-reset operational gate.

## Notes

- Context: this is a follow-up to the completed Mercado Público ingestion backbone and keeps OpenSpec as the sole source of truth.
- Assumptions: existing identity constraints and persistence fields remain authoritative unless Phase 0 proves a narrow additive migration is required.
- Boundaries: implementation remains manual/internal-only; no public trigger, scheduler, frontend surface, tracker ticket file, or production data is introduced.

