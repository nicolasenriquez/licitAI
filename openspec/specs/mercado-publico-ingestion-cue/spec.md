---
type: capability-spec
title: "Spec: mercado-publico-ingestion-cue"
description: "Production-shaped ingestion normalization, auditability, bounded processing, and verification for Mercado Publico sources."
okf_version: "0.1"
---
# Spec: mercado-publico-ingestion-cue

## Purpose

Harden ingestion against production-shaped API and CSV payloads while preserving raw evidence, deterministic failures, bounded resource use, and run-scoped verification. This capability extends the Mercado Publico ingestion backbone without changing its public phase-1 surface.

## Requirements

### Requirement: Normalize production-shaped Compra Ágil state
The system MUST accept scalar `estado` unchanged. For V2 object `estado`, it MUST use usable `estado.codigo`, then an existing scalar or `estado.glosa`, and MUST never persist the object into a scalar canonical field.

#### Scenario: Object state uses codigo
- **WHEN** a V2 list record contains object `estado` with non-empty `codigo`
- **THEN** staged and canonical records contain that code in scalar `estado`

#### Scenario: Scalar state remains compatible
- **WHEN** a V2 record contains scalar `estado`
- **THEN** canonical value is preserved unchanged

#### Scenario: Object state falls back safely
- **WHEN** object lacks usable `codigo` but has usable `glosa` or existing scalar fallback
- **THEN** canonical scalar uses fallback and never stores object

### Requirement: Preserve V2 imported attributes separately from query filters
The system MUST normalize production V2 `payload.items` lists and `payload` detail envelopes while retaining legacy flat shapes. `institucion.region` maps to imported region. `fechas.fecha_publicacion`, `fecha_cierre`, and `fecha_ultimo_cambio` retain auditable raw text in staging and normalize to timestamps. Query filters such as `publicado_desde` and `cambio_desde` MUST NOT be repurposed as process attributes. Offset-free timestamps use `America/Santiago`; invalid input keeps raw text with null timestamp.

#### Scenario: Invalid imported date remains auditable
- **WHEN** a V2 `fechas` value is invalid
- **THEN** staging stores raw text and null normalized timestamp without aborting import

### Requirement: Persist and extract detail envelopes
The system MUST persist the complete upstream V2 detail response in the raw API layer before extracting the production envelope into staging and canonical persistence.

#### Scenario: Valid detail is imported
- **WHEN** valid V2 detail uses production envelope
- **THEN** one raw payload, one staged record, and one canonical record are auditable for the run

#### Scenario: Raw response survives extraction failure
- **WHEN** detail extraction cannot produce a domain record after response receipt
- **THEN** complete response remains queryable in raw layer

### Requirement: Report missing detail records as failures
If API V1 licitacion, API V1 OC, or API V2 Compra Agil detail contains no usable record, the system MUST mark run `failed`, set `records_failed` greater than zero, and write non-empty `error_summary`.

#### Scenario: Missing detail is auditable
- **WHEN** requested detail code returns envelope without usable detail record
- **THEN** job is failed with non-zero failed records, non-empty error summary, and raw response retained

#### Scenario: Missing detail cannot be silent success
- **WHEN** extraction returns no record
- **THEN** run is not reported as successful zero-record import

### Requirement: Validate Compra Ágil pagination before upstream calls
The system MUST accept Compra Ágil page sizes 10 through 50 inclusive and reject other values before an upstream request.

#### Scenario: Minimum valid page size
- **WHEN** list job requests page size `10`
- **THEN** validation succeeds and request may run

#### Scenario: Out-of-range page size
- **WHEN** list job requests page size `1`
- **THEN** validation fails deterministically, no upstream request occurs, and no false-success run is recorded

### Requirement: Stream and batch large CSV input
CSV importer MUST process bounded streams and batches; it MUST NOT upload or materialize a complete file payload in memory.

#### Scenario: Multi-batch file
- **WHEN** supported CSV has more rows than one configured batch
- **THEN** rows persist across bounded batches with complete row-count reconciliation

#### Scenario: Batch failure is auditable
- **WHEN** a batch fails
- **THEN** run reports failure and preserves raw row/error evidence without claiming complete success

### Requirement: Parse the observed CSV profile
Parser MUST handle semicolon delimiters, quoted fields, Latin-1-compatible encoding, `NA` and blank values, comma decimal amounts, and date sentinels without mutating raw source representation.

#### Scenario: Observed CSV conventions
- **WHEN** mounted file uses observed delimiters, encoding, nulls, decimals, and sentinel date
- **THEN** staging values match domain contracts and raw rows preserve originals

#### Scenario: Quoted delimiter is data
- **WHEN** quoted field contains semicolon or escaped quote
- **THEN** parser keeps one decoded value

### Requirement: Make disabled and zero-record outcomes explicit
Disabled CSV jobs MUST create `skipped` runs with non-empty reason. If status constraint lacks `skipped`, implementation MUST add smallest additive support using repository migration convention. Enabled positive CSV run with zero importable records MUST be `failed` with non-empty reason, never successful.

#### Scenario: Disabled profile
- **WHEN** CSV job is disabled by config
- **THEN** run is `skipped` with reason and no successful-import claim

#### Scenario: Positive no-op
- **WHEN** enabled positive profile discovers zero importable records
- **THEN** run is `failed` with auditable reason

### Requirement: Reconcile per-run persistence counters
Each positive run MUST expose auditable deltas keyed by `stg_job_run` for raw files/rows, staging, and canonical records. Verification uses `records_staged` and `records_canonicalized`, rejects nonexistent `records_written`, requires zero failed records, and uses existing backbone identity keys.

#### Scenario: Positive CSV counters reconcile
- **WHEN** one operator-provided CSV profile succeeds
- **THEN** run delta has non-zero raw input, matching staged/canonical counters, and zero failed records

#### Scenario: Global totals cannot satisfy verification
- **WHEN** prior runs populated same tables
- **THEN** verification evaluates current run baseline/delta, not global totals

### Requirement: Preserve repeat-run idempotency
Repeating identical API or CSV input MUST NOT duplicate raw files, raw rows, staging records, or canonical records under existing identity and deduplication contracts. Proof uses run-specific baseline/delta and source/API/file/row and canonical natural keys.

#### Scenario: Repeat all CSV profiles
- **WHEN** June and July licitaciones and OC files run twice unchanged
- **THEN** second run adds no duplicate persistence rows

#### Scenario: Repeat API payload
- **WHEN** same API request/detail payload is ingested again
- **THEN** raw identity and downstream natural-key persistence remain idempotent

### Requirement: Provide a complete ingestion verification gate
Runbook MUST verify Docker health, operator-provided storage readiness, execution order, per-run baselines/deltas, positive statuses, failure criteria, and repeat-run idempotency. Gate passes only when positive jobs succeed, counters reconcile, and no silent no-op exists.

#### Scenario: Fully green verification
- **WHEN** Docker and required sources are healthy and all positive scenarios pass
- **THEN** gate passes with run IDs and assertions

#### Scenario: Verification failure criteria
- **WHEN** Docker unhealthy, positive job fails, counters mismatch, or silent no-op appears
- **THEN** gate fails and reports violated criterion
