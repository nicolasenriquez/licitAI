---
type: change-spec
title: "Spec: mercado-publico-ingestion-cue"
description: "Specification for Mercado Publico ingestion CUE hardening."
okf_version: "0.1"
---
# Spec: mercado-publico-ingestion-cue
## ADDED Requirements

### Requirement: Normalize production-shaped Compra Ágil state

The system MUST accept scalar `estado` values unchanged. When V2 `estado` is an object, the system MUST use `estado.codigo` as the canonical scalar value when usable, then fall back to an existing scalar or `estado.glosa`, and MUST NOT persist the object into a scalar canonical field.

#### Scenario: Object state uses codigo
- **WHEN** a V2 list record contains `estado` as an object with a non-empty `codigo`
- **THEN** the staged and canonical record contains that code in scalar `estado`

#### Scenario: Scalar state remains compatible
- **WHEN** a V2 record contains a scalar `estado`
- **THEN** the canonical value is preserved unchanged

#### Scenario: Object state falls back safely
- **WHEN** an object has no usable `codigo` but has a usable `glosa` or existing scalar fallback
- **THEN** the canonical scalar uses that fallback and never stores the object

### Requirement: Persist and extract detail envelopes

The system MUST persist the complete upstream V2 detail response in the raw API layer before extracting the production envelope into staging and canonical persistence.

#### Scenario: Valid detail is imported
- **WHEN** a known valid V2 detail response uses the production envelope
- **THEN** one raw payload, one staged record, and one canonical record are auditable for the run

#### Scenario: Raw response survives extraction failure
- **WHEN** detail extraction cannot produce a domain record after the upstream response is received
- **THEN** the complete response remains queryable in the raw layer

### Requirement: Report missing detail records as failures

If a detail response contains no usable record, the system MUST mark the run `failed`, MUST set `records_failed` greater than zero, and MUST write a non-empty `error_summary`.

#### Scenario: Missing detail is auditable
- **WHEN** a requested detail code returns an envelope without a usable detail record
- **THEN** the job is `failed` with non-zero failed records, a non-empty error summary, and the raw response retained

#### Scenario: Missing detail cannot be a silent success
- **WHEN** extraction returns no record
- **THEN** the run is not reported as a successful zero-record import

### Requirement: Validate Compra Ágil pagination before upstream calls

The system MUST accept Compra Ágil page sizes from 10 through 50 inclusive and MUST reject values outside that range before making an upstream request.

#### Scenario: Minimum valid page size
- **WHEN** a list job is requested with page size `10`
- **THEN** validation succeeds and the upstream request can run

#### Scenario: Out-of-range page size
- **WHEN** a list job is requested with page size `1`
- **THEN** validation fails deterministically, no upstream request is made, and no false-success job is recorded

### Requirement: Mount CSV input through the existing storage root

The Docker CUE override MUST bind the host CSV directory read-only at the configured storage root, and the importer MUST discover the four source files through the existing CSV storage-root loader. The repository MUST NOT contain copies of the CUE CSV files.

#### Scenario: Mounted source is discovered
- **WHEN** the read-only host directory contains a supported June or July CSV
- **THEN** the existing loader discovers it without a path-specific importer

#### Scenario: Mount is unavailable
- **WHEN** the configured directory is absent or not readable by the container
- **THEN** preflight fails with an operator-visible non-empty reason and no successful import is recorded

### Requirement: Stream and batch large CSV input

The CSV importer MUST process input as a bounded stream and batches and MUST NOT upload a complete file or materialize a whole-file payload in memory.

#### Scenario: Multi-batch file
- **WHEN** a supported CSV contains more rows than one configured batch
- **THEN** rows are persisted across multiple bounded batches with complete row-count reconciliation

#### Scenario: Batch failure is auditable
- **WHEN** a batch fails during processing
- **THEN** the run reports the failure and preserves raw row/error evidence without claiming a successful complete import

### Requirement: Parse the CUE CSV profile

The parser MUST handle semicolon delimiters, quoted fields, Latin-1-compatible encoding, `NA` and blank values, comma decimal amounts, and date sentinels without mutating the raw source representation.

#### Scenario: Observed CSV conventions
- **WHEN** a mounted file uses semicolons, quoted fields, Latin-1-compatible text, comma decimals, `NA`/blank values, and a date sentinel such as `1900-01-01`
- **THEN** parsed staging values match the domain null, amount, date, and text contracts while raw rows preserve the original values

#### Scenario: Quoted delimiter is data
- **WHEN** a quoted field contains a semicolon or quote escape
- **THEN** the parser keeps the field as one value with the decoded content

### Requirement: Make disabled and zero-record outcomes explicit

Disabled CSV jobs MUST create `skipped` runs with a non-empty reason. If the current job-run status constraint does not support `skipped`, the implementation MUST add the smallest additive status support through the repository migration convention. An enabled positive CSV run that discovers zero importable records MUST be finalized as `failed` with a non-empty reason and MUST NOT be reported as a successful import.

#### Scenario: Disabled profile
- **WHEN** a CSV job is disabled by configuration
- **THEN** the job creates a `skipped` run with a non-empty reason and no successful-import claim

#### Scenario: Positive no-op
- **WHEN** an enabled positive CSV profile discovers zero importable records
- **THEN** the run is `failed` with a non-empty auditable reason

### Requirement: Reconcile per-run persistence counters

For each positive run, the system MUST expose auditable per-run deltas keyed by the `stg_job_run` identifier for raw files/rows, staging, and canonical records. CUE assertions MUST use `records_staged` and `records_canonicalized`, MUST reject the nonexistent `records_written` counter, and MUST require zero failed records for positive scenarios. Identity checks MUST use the existing backbone keys for raw API payloads, raw CSV files/rows, and canonical natural keys.

#### Scenario: Positive CSV counters reconcile
- **WHEN** one of the four mounted CSV profiles completes successfully
- **THEN** its run delta has non-zero raw input, matching staged and canonical counters, and zero failed records

#### Scenario: Global totals cannot satisfy CUE
- **WHEN** prior runs have populated the same tables
- **THEN** CUE evaluates the current run's baseline/delta rather than global totals

### Requirement: Preserve repeat-run idempotency

Repeating the same API or CSV input MUST NOT create duplicate raw files, raw rows, staging records, or canonical records under the existing identity and deduplication contracts. The proof MUST use the run-specific baseline/delta and the existing source/API/file/row and canonical natural-key identities rather than global totals alone.

#### Scenario: Repeat all CSV profiles
- **WHEN** June and July licitaciones and órdenes de compra imports are run twice with the same files
- **THEN** the second run adds no duplicate raw files, raw rows, staging rows, or canonical records

#### Scenario: Repeat API payload
- **WHEN** the same API request/detail payload is ingested again
- **THEN** raw payload identity and downstream natural-key persistence remain idempotent

### Requirement: Provide a complete CUE gate

The CUE runbook MUST verify Docker health, read-only mount configuration, execution order, per-run baselines/deltas, positive statuses, failure criteria, and repeat-run idempotency. The final gate MUST pass only when all positive jobs are successful, counters reconcile, and no silent no-op exists.

#### Scenario: Fully green CUE
- **WHEN** Docker is healthy, all required sources are available, and every positive scenario passes
- **THEN** the CUE gate passes with recorded run identifiers and assertions

#### Scenario: CUE failure criteria
- **WHEN** Docker is unhealthy, a positive job fails, counters do not reconcile, or a silent no-op is observed
- **THEN** the CUE gate fails and reports the violated criterion

