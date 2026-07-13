---
type: change-tasks
title: "Tasks: mercado-publico-ingestion-cue-hardening"
description: "Tasks for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Tasks: mercado-publico-ingestion-cue-hardening

## 0. Investigation and Scope Lock

- [ ] 0.1 Review the existing Mercado Público module, orchestrator, API clients, V2 detail service, persistence service, CSV loader, Docker compose files, focused tests, and integration suites to confirm ownership and the highest test seam.
  Traceability: locks the existing `twenty-server` module, manual job contract, persistence boundary, and external-behavior test surface before implementation planning.

- [ ] 0.2 Confirm the production-shaped V2 detail envelope, object-shaped `estado`, one known valid detail code, and one missing detail case using a redacted fixture or captured response; do not store tickets, credentials, or production identifiers.
  Traceability: closes the source-contract ambiguity that controls V2 extraction, normalization, and missing-detail assertions.

- [ ] 0.3 Confirm the existing raw/API/file/row/canonical identity keys, `stg_job_run` counter fields, current status constraint, CSV batch configuration, and Docker storage-root contract without resetting the database.
  Traceability: freezes the persistence and operational contracts needed for safe per-run deltas, additive status support, and idempotency proofs.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add fail-first focused coverage for scalar and object-shaped V2 `estado`, `codigo`/`glosa` fallback, and the confirmed detail envelope at the existing API adapter seam.
  Traceability: proves the source-shape defect before changing the V2 type or extractor.

- [ ] 1.2 Change the existing missing-detail service proof so a response with no usable record fails with non-zero `records_failed`, a non-empty `error_summary`, and retained raw evidence instead of succeeding with zero records.
  Traceability: proves the first known silent-success regression at the owning service/persistence seam.

- [ ] 1.3 Add fail-first coverage for valid page size `10`, valid page size `50`, invalid values `9` and `1`, and the guarantee that invalid input makes no upstream request.
  Traceability: proves the inclusive local validation boundary and upstream-call guard before implementation changes.

- [ ] 1.4 Add fail-first database-backed coverage for disabled CSV `skipped` runs, enabled zero-record failure, run-specific counter reconciliation, and repeat-run identity preservation.
  Traceability: proves the CSV outcome, auditability, and idempotency contracts at the highest observable seam.

## 2. Implementation

### API and persistence contract

- [ ] 2.1 Normalize V2 `estado` and the confirmed detail envelope at the existing API adapter boundary while preserving scalar compatibility and preventing object values from reaching scalar persistence.
  Traceability: implements the source-shape contract without widening downstream canonical fields.

- [ ] 2.2 Persist the complete V2 detail response before extraction; finalize missing detail as `failed` with non-zero failures and a non-empty explanation while retaining raw evidence.
  Traceability: preserves diagnostic evidence and removes the current successful soft-miss behavior.

### Validation and status

- [ ] 2.3 Enforce Compra Ágil page sizes from `10` through `50` before the HTTP client runs and finalize validation failures without a false-success import.
  Traceability: closes the lower-bound contract at the existing validator/client seam.

- [ ] 2.4 Add the smallest additive `skipped` status support if the confirmed schema still lacks it, including status mapping, persistence, and the repository migration convention with reversible `up`/`down` logic.
  Traceability: makes disabled CSV outcomes representable without editing committed migrations or silently widening status semantics.

### CSV and auditability

- [ ] 2.5 Add the Docker CUE override with a read-only host CSV bind mount at the configured storage root and retain the existing storage-root discovery path.
  Traceability: preserves provenance and prevents a second path-specific importer from being introduced.

- [ ] 2.6 Process the four June/July CSV profiles as bounded streams and batches using the existing loader, with coverage for semicolon delimiters, quoted fields, Latin-1-compatible text, `NA`/blank values, comma decimals, and date sentinels.
  Traceability: makes large-file and observed-source parsing behavior bounded, reproducible, and directly testable.

- [ ] 2.7 Make disabled CSV jobs finalize as `skipped` with a non-empty reason and enabled positive zero-record jobs finalize as `failed` with a non-empty reason; preserve raw row/error evidence for parse and batch failures.
  Traceability: prevents silent no-ops and distinguishes operator-disabled work from failed positive work.

- [ ] 2.8 Reconcile run-specific raw files/rows, `records_staged`, and `records_canonicalized` deltas using existing identity constraints; remove `records_written` from the CUE contract and prove repeat-run idempotency.
  Traceability: keeps CUE assertions tied to the current run and the existing deduplication keys instead of polluted global totals.

- [ ] 2.9 Create or update the change-local CUE runbook with Docker/credential/mount preflight, execution order, read-only baseline/delta queries, expected statuses, failure criteria, repeat-run checks, and the no-reset/no-source-copy safety boundary.
  Traceability: turns the runtime contract into an operator-verifiable handoff without adding a repository-wide command surface.

## 3. Verification

- [ ] 3.1 Run focused unit tests for V2 normalization/extraction, detail failure semantics, page validation, CSV parsing/streaming, status mapping, and orchestration.
  Traceability: proves each changed local seam directly after implementation.

- [ ] 3.2 Run Mercado Público database-backed integration suites for raw persistence, CSV ingestion, canonical refresh, job-run counters/statuses, and repeat-run idempotency.
  Traceability: verifies external persistence behavior and cross-layer reconciliation rather than relying on unit mocks.

- [ ] 3.3 Run the complete CUE flow in the documented order without a destructive database reset; record run identifiers, observed deltas, statuses, and any unavailable operator prerequisites.
  Traceability: proves the real operational gate or preserves an explicit evidence-based limitation.

- [ ] 3.4 Run the relevant repository quality gates, scan for committed/copied CSVs and secrets, and record environment-only limitations separately from code failures.
  Traceability: closes the package, provenance, and safety checks without masking unrelated baseline failures.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update the change-local handoff with exact verified commands, run identifiers, observed deltas, final status criteria, and unresolved operator prerequisites.
  Traceability: preserves reproducible evidence for review and future execution.

- [ ] 4.2 Update user or operational documentation only where the implemented behavior changed; do not add production data, credentials, or a parallel ticket artifact.
  Traceability: keeps release documentation aligned with verified behavior and the OpenSpec-only source-of-truth boundary.

- [ ] 4.3 Run `openspec validate mercado-publico-ingestion-cue-hardening` and confirm proposal, design, spec, tasks, and runbook remain aligned before sync or archive consideration.
  Traceability: provides final artifact-level proof before any later `/opsx-sync` or `/opsx-archive` action.

## Execution Order

### Slice 0 — Scope lock

- Tasks: `0.1 -> 0.2 -> 0.3`
- Checkpoint: ownership, source envelope, status support, identities, counters, and operator prerequisites are recorded.
- Blocks: API, validation/status, CSV, and CUE slices.

### Slice 1 — API normalization and detail failure

- Tasks: `1.1 -> 1.2 -> 2.1 -> 2.2`
- Checkpoint: object/scalar V2 inputs normalize correctly, raw detail is retained, and missing detail cannot finalize successfully.
- Blocked by: Slice 0.
- Blocks: Slice 4.

### Slice 2 — Pagination and status outcomes

- Tasks: `1.3 -> 2.3 -> 2.4`
- Checkpoint: page sizes `10..50` are locally enforced and disabled CSV status is representable and auditable.
- Blocked by: Slice 0.
- Blocks: Slice 4.

### Slice 3 — CSV ingestion and idempotency

- Tasks: `1.4 -> 2.5 -> 2.6 -> 2.7 -> 2.8`
- Checkpoint: mounted profiles stream in bounded batches, preserve raw evidence, classify outcomes, reconcile counters, and remain idempotent on rerun.
- Blocked by: Slice 0.
- Blocks: Slice 4.

### Slice 4 — CUE verification and closeout

- Tasks: `2.9 -> 3.1 -> 3.2 -> 3.3 -> 3.4 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: the documented no-reset CUE gate and artifact validation have reproducible evidence or an explicit operator limitation.
- Blocked by: Slices 1, 2, and 3.
- Blocks: None.
