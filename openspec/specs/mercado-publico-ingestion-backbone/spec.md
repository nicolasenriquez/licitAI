---
type: capability-spec
title: "Spec: mercado-publico-ingestion-backbone"
description: "Specification for Mercado Publico Ingestion Backbone."
okf_version: "0.1"
---
# Spec: mercado-publico-ingestion-backbone

## Requirements

### Requirement: Deployment-Local Shared Mercado Publico Backbone

The system SHALL provide a deployment-local shared Mercado Publico ingestion backbone inside `packages/twenty-server` for public procurement data that is not scoped per workspace.

#### Scenario: Shared corpus is stored outside workspace schemas

- **WHEN** Mercado Publico ingestion persists public procurement data
- **THEN** the data is stored under a static PostgreSQL schema `mp`
- **AND** the implementation does not create `workspace_<id>` schemas for this corpus
- **AND** tenant-owned CRM records are not stored in `mp`

#### Scenario: Shared corpus does not change deployment isolation

- **WHEN** the product is deployed in isolated customer environments
- **THEN** each environment owns its own `mp` schema
- **AND** this change does not introduce a cross-customer shared control plane

### Requirement: Source Contract Compliance

The system SHALL implement the source behavior documented in `docs/business/mercado-publico-source-contract.md`.

#### Scenario: Source rules are not invented in code

- **WHEN** the implementation adds an API parameter, CSV field assumption, state mapping, or reconciliation rule
- **THEN** that behavior is traceable to `docs/business/mercado-publico-source-contract.md`, a fixture, or an explicitly documented implementation decision
- **AND** undocumented CSV columns remain raw data until observed and mapped defensively

### Requirement: Multi-Layer Persistence Model

The system SHALL persist Mercado Publico ingestion data across raw, staging, canonical, reconciliation, and gold/read layers.

#### Scenario: Raw API payloads remain auditable

- **WHEN** an API request is executed
- **THEN** the system stores the request fingerprint, payload checksum, request params, status metadata, and full raw payload in the raw layer

#### Scenario: Raw CSV files and rows remain auditable

- **WHEN** a CSV file is downloaded
- **THEN** the system stores file metadata, checksum, size, compression type, detected encoding, detected delimiter, quotechar, raw header, observed columns, column count, schema fingerprint, row count, and source period
- **AND** each loaded row stores row number, raw row text, parsed raw JSON when available, row checksum, parse status, and parse error when applicable
- **AND** unknown columns are preserved

### Requirement: API V1 Licitaciones Ingestion

The system SHALL support API V1 Licitaciones by date, by state, and by `CodigoExterno`.

#### Scenario: Licitaciones by date uses official date format

- **WHEN** the licitaciones by-date job is executed
- **THEN** it formats the date parameter as `ddmmaaaa`
- **AND** it persists the list response as an auditable raw API payload
- **AND** it records the job run outcome

#### Scenario: Licitaciones by state stores list snapshots

- **WHEN** the licitaciones by-state job is executed
- **THEN** it preserves raw `CodigoEstado` and raw state label
- **AND** it treats list data as a snapshot, not full detail truth

#### Scenario: Licitacion detail rehydrates canonical data

- **WHEN** a licitacion is fetched by `CodigoExterno`
- **THEN** the detail payload updates canonical licitacion entities keyed by `CodigoExterno`
- **AND** existing non-null canonical values are not overwritten by `null`

### Requirement: API V1 Ordenes de Compra Ingestion

The system SHALL support API V1 Ordenes de Compra by date, by state, and by `Codigo`.

#### Scenario: Ordenes de compra by date uses official date format

- **WHEN** the OC by-date job is executed
- **THEN** it formats the date parameter as `ddmmaaaa`
- **AND** it persists the list response as an auditable raw API payload
- **AND** it records the job run outcome

#### Scenario: Ordenes de compra by state preserves raw state

- **WHEN** the OC by-state job is executed
- **THEN** it preserves raw `CodigoEstado`, raw OC state label, and raw provider state when available
- **AND** it treats `CodigoLicitacion` as an optional relationship

#### Scenario: Orden de compra detail rehydrates canonical data

- **WHEN** an OC is fetched by `Codigo`
- **THEN** the detail payload updates canonical OC entities keyed by `Codigo`
- **AND** the implementation does not require `CodigoLicitacion` to be present

### Requirement: API V2 Compra Agil Ingestion

The system SHALL support Compra Agil V2 paginated listing, incremental change windows, publication windows, and detail by `codigo`.

#### Scenario: Compra Agil paginated listing obeys documented bounds

- **WHEN** the Compra Agil list job executes
- **THEN** `tamano_pagina` is no greater than 50
- **AND** `numero_pagina` starts at 1
- **AND** `id` and `q` are not sent together

#### Scenario: Compra Agil incremental listing supports change windows

- **WHEN** the Compra Agil incremental job executes
- **THEN** it supports `ttl_cambio_ms`
- **AND** it supports `cambio_desde` and `cambio_hasta`

#### Scenario: Compra Agil publication listing supports publication windows

- **WHEN** the Compra Agil publication-window job executes
- **THEN** it supports `publicado_desde` and `publicado_hasta`

#### Scenario: Compra Agil detail uses explicit OC linkage

- **WHEN** Compra Agil detail includes `orden_compra.id_orden_compra` or `orden_compra.id_oc`
- **THEN** the system records an exact Compra Agil to OC candidate using that value
- **AND** it does not depend on `codigo_orden_compra`
- **AND** it does not depend only on state `oc_emitida`

### Requirement: CSV Download, Profiling, And Raw Load

The system SHALL execute CSV ingestion for Datos Abiertos licitaciones and ordenes de compra before canonical mapping.

#### Scenario: CSV file is profiled before parsing into staging

- **WHEN** a CSV file is downloaded
- **THEN** the system computes checksum and file size
- **AND** it decompresses `.7z` when needed
- **AND** it detects encoding
- **AND** it detects delimiter from supported candidates
- **AND** it detects quote character when available
- **AND** it captures `header_raw`, `observed_columns`, `column_count`, and `schema_fingerprint`

#### Scenario: Observed June 2026 CSV format remains parseable

- **WHEN** CSV fixtures represent the observed June 2026 files
- **THEN** the parser supports `latin-1` text without corrupting accented characters
- **AND** it supports `;` as delimiter
- **AND** it supports `"` as quotechar
- **AND** it records those profiling outcomes in raw file metadata

#### Scenario: CSV rows preserve source shape

- **WHEN** CSV rows are loaded
- **THEN** every row is stored with `raw_row_text`, `raw_row_json`, `row_checksum`, `parse_status`, and `parse_error`
- **AND** new or unknown columns do not cause data loss
- **AND** raw column names are preserved exactly as observed

#### Scenario: CSV re-download keeps prior raw lineage

- **WHEN** the same CSV `source_period` is downloaded again with a different checksum
- **THEN** the system stores a new raw file record instead of overwriting the old one
- **AND** it preserves older raw rows for auditability
- **AND** canonical and reconciliation refresh run from the newer raw file
- **AND** changed business-key outcomes remain auditable through reconciliation events

#### Scenario: CSV licitaciones does not assume one row per licitacion

- **WHEN** licitaciones CSV rows share the same `CodigoExterno`
- **THEN** the raw layer accepts repeated `CodigoExterno`
- **AND** canonical deduplication happens after row-grain analysis

#### Scenario: CSV ordenes de compra does not assume one row per OC

- **WHEN** OC CSV rows share the same `Codigo`
- **THEN** the raw layer accepts repeated `Codigo`
- **AND** `IDItem` is treated as the observed candidate item key when present
- **AND** canonical OC header and item deduplication happen after row-grain analysis

#### Scenario: CSV licitaciones preserves item and offer grain

- **WHEN** licitaciones CSV rows include repeated `CodigoExterno` across `Codigoitem`, supplier, or offer values
- **THEN** the raw layer accepts those repeated business keys
- **AND** `Codigoitem` is treated as the observed candidate item key when present
- **AND** offer projections preserve raw `Oferta seleccionada` before any boolean normalization

### Requirement: Canonical Normalization

The system SHALL normalize Mercado Publico data into canonical entities keyed by natural keys while preserving raw state information.

#### Scenario: Canonical entities use natural keys

- **WHEN** the system persists canonical entities
- **THEN** licitaciones are keyed by `CodigoExterno`
- **AND** ordenes de compra are keyed by `Codigo`
- **AND** Compra Agil entities are keyed by `codigo`
- **AND** buyers and suppliers keep source attribution

#### Scenario: Non-null canonical values are protected

- **WHEN** a later payload omits or nulls a field already populated canonically
- **THEN** the system does not overwrite the existing non-null canonical value with `null`

#### Scenario: Unknown licitacion types are preserved

- **WHEN** a licitacion type code is not in the known canonical mapping
- **THEN** the raw code is preserved
- **AND** the canonical mapping records it as `unknown_raw_type`

#### Scenario: CSV scalar normalization is defensive

- **WHEN** canonical mapping reads CSV values
- **THEN** raw strings remain available for date, decimal, boolean, and null-like fields
- **AND** `NA`, empty fields, and whitespace-only fields may normalize to null only outside raw storage
- **AND** comma decimals are converted only in validated numeric canonical fields
- **AND** `1900-01-01` is marked as a sentinel date instead of a normal business date

### Requirement: Source Priority And Reconciliation Policy

The system SHALL apply explicit source-priority and reconciliation rules during canonical refresh and linkage.

#### Scenario: Recent licitacion state prefers API

- **WHEN** API and CSV disagree on recent licitacion lifecycle state
- **AND** `now(America/Santiago) <= max(FechaCierre, FechaPublicacion) + 30 days`
- **THEN** API is preferred for recent operational state
- **AND** the mismatch remains auditable

#### Scenario: Historical completeness prefers CSV

- **WHEN** CSV contains historical completeness or offer evidence absent from API snapshots
- **THEN** CSV is preserved as the preferred historical source for that evidence
- **AND** the system does not silently discard that evidence

#### Scenario: Historical state prefers CSV outside the recent window

- **WHEN** API and CSV disagree on lifecycle state
- **AND** the record is outside `max(FechaCierre, FechaPublicacion) + 30 days`
- **THEN** CSV is preferred for historical completeness
- **AND** the API disagreement remains auditable

#### Scenario: API and CSV same licitacion key match

- **WHEN** API and CSV licitacion records share `CodigoExterno`
- **THEN** the system records `match_type = exact_codigo_externo`

#### Scenario: Exact licitacion to OC match

- **WHEN** `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`
- **THEN** the system records `match_type = exact_codigo_licitacion`

#### Scenario: Compra Agil does not join to licitacion by CodigoLicitacion

- **WHEN** Compra Agil records are reconciled
- **THEN** the system does not infer a licitacion relationship from `CodigoLicitacion`
- **AND** it uses OC linkage rules instead

#### Scenario: Exact Compra Agil to OC match

- **WHEN** `compra_agil.orden_compra.id_orden_compra` or `compra_agil.orden_compra.id_oc` matches a known OC identifier
- **THEN** the system records `match_type = exact_compra_agil_id_orden_compra`

#### Scenario: Heuristic or unresolved matches remain non-authoritative

- **WHEN** an exact link is unavailable
- **THEN** the system may record `candidate_supplier_amount`, `candidate_item_amount`, `unmatched`, or `manual_review_required`
- **AND** it persists reconciliation events for mismatches and unresolved relationships
- **AND** heuristic matches do not silently auto-promote to exact truth

### Requirement: Traceable Job Execution

The system SHALL record every ingestion job with traceability fields required for audit and debugging.

#### Scenario: API job metadata is persisted

- **WHEN** an API ingestion job runs
- **THEN** the system stores `job_id`, `source`, `endpoint`, `request_params`, `http_status`, `fetched_at`, `checksum`, `schema_fingerprint`, record counters, and `error_summary`

#### Scenario: CSV job metadata is persisted

- **WHEN** a CSV ingestion job runs
- **THEN** the system stores source file metadata, profiling outcomes, quotechar, column count, row counters, parse counters, checksum, schema fingerprint, and error summary

### Requirement: Idempotent Reruns

The system SHALL support safe reruns without duplicating raw, canonical, or reconciliation data.

#### Scenario: Raw API payload dedupe

- **WHEN** the same request fingerprint and payload checksum are seen again
- **THEN** the system deduplicates the raw payload record

#### Scenario: Raw CSV file and row dedupe

- **WHEN** the same CSV source file and checksum are seen again
- **THEN** the system deduplicates the raw file record
- **AND** repeated rows are deduplicated by file checksum, row number, and row checksum

#### Scenario: Canonical entity rerun

- **WHEN** the same natural-key entity is reprocessed
- **THEN** the system updates the canonical entity safely
- **AND** it does not create a duplicate canonical row

#### Scenario: Reconciliation event rerun

- **WHEN** the same mismatch is detected in a rerun
- **THEN** the system reuses or deduplicates the logical reconciliation event
- **AND** it does not create repeated event noise for the same issue

### Requirement: Controlled Failure Handling

The system SHALL classify Mercado Publico HTTP failures into deterministic operational outcomes.

#### Scenario: Parameter failure

- **WHEN** the external API returns `400`
- **THEN** the job records a parameter error
- **AND** it does not retry indefinitely

#### Scenario: Hard auth failure

- **WHEN** the external API returns `401` or `403`
- **THEN** the job fails hard

#### Scenario: Auditable soft miss

- **WHEN** the external API returns `404`
- **THEN** the job records a soft miss
- **AND** the miss remains auditable

#### Scenario: Retryable transient failure

- **WHEN** the external API returns `429`, `500`, `503`, or times out
- **THEN** the job is marked `retryable_failed`
- **AND** the system uses bounded backoff without infinite retries

### Requirement: Secret And Quota Governance

The system SHALL handle Mercado Publico tickets and quota without leaking secrets.

#### Scenario: Tickets are never hardcoded or logged

- **WHEN** API clients are configured
- **THEN** tickets come from environment or managed configuration
- **AND** tickets are not logged, stored in fixtures, or serialized into raw error payloads

#### Scenario: Daily quota usage is visible internally

- **WHEN** jobs consume Mercado Publico APIs
- **THEN** the system exposes internal quota usage visibility through a read contract
- **AND** quota reset uses `America/Santiago`
- **AND** the system records `last429At` when a rate limit response is observed

### Requirement: Typed Runtime Configuration

The system SHALL use typed Twenty config variables for Mercado Publico runtime configuration.

#### Scenario: Runtime configuration uses typed config variables

- **WHEN** the Mercado Publico module needs secrets, base URLs, HTTP settings, quota timezone, or CSV storage/source settings
- **THEN** those values are defined as typed `TwentyConfig` variables
- **AND** feature code consumes them through `TwentyConfigService`
- **AND** feature code does not read ad hoc `process.env` variables directly

### Requirement: Manual Execution And Run Observability

The system SHALL support manual phase-1 execution and expose run observability without requiring scheduled automation.

#### Scenario: Supported processes are manually triggerable in phase 1

- **WHEN** an operator manually triggers a supported Mercado Publico process
- **THEN** the system executes it through the existing backend job infrastructure
- **AND** it records a traceable job run outcome

#### Scenario: Phase-1 execution surface remains internal

- **WHEN** manual phase-1 execution is implemented
- **THEN** the change does not add a new public GraphQL, REST, or MCP execution surface
- **AND** the execution model remains internal to `twenty-server`

#### Scenario: Pipeline health reflects real run history without fixed scheduler cadence

- **WHEN** the system reports pipeline health
- **THEN** it reports latest run status, last success timestamp, last failure timestamp, and lag since last success
- **AND** it does not require fixed scheduled cadence in phase 1

### Requirement: Minimum Job Surface

The system SHALL include API V1 date/state/detail jobs, API V2 Compra Agil jobs, CSV jobs, and reconciliation refresh in this phase as manually invocable processes.

#### Scenario: Minimum operational job surface is present

- **WHEN** this backbone is implemented in this phase
- **THEN** it includes:
  - `api-v1-licitaciones-by-date`
  - `api-v1-licitaciones-by-state`
  - `api-v1-licitacion-detail-by-codigo`
  - `api-v1-oc-by-date`
  - `api-v1-oc-by-state`
  - `api-v1-oc-detail-by-codigo`
  - `api-v2-compra-agil-incremental`
  - `api-v2-compra-agil-by-publication-window`
  - `api-v2-compra-agil-detail-by-codigo`
  - `csv-licitaciones-download`
  - `csv-oc-download`
  - `csv-file-profile`
  - `csv-raw-load`
  - `csv-canonical-refresh`
  - `reconciliation-refresh`

### Requirement: Fixtures For Safe Implementation

The system SHALL include fixtures that make source behavior testable without live API tickets.

#### Scenario: API fixtures cover source families

- **WHEN** tests validate API ingestion
- **THEN** fixtures exist for API V1 licitacion list/detail, API V1 OC list/detail, API V2 Compra Agil list/detail with OC linkage, and API V2 Compra Agil detail without OC linkage
- **AND** fixtures contain no real tickets

#### Scenario: CSV fixtures cover file profiling

- **WHEN** tests validate CSV ingestion
- **THEN** fixtures exist for licitaciones CSV and ordenes de compra CSV samples or anonymized real headers with at least one row
- **AND** fixtures cover `latin-1`, `;` delimiter, and `"` quotechar
- **AND** fixtures cover comma decimals, `NA` or blank values, and `1900-01-01` sentinel dates
- **AND** fixtures cover repeated OC `Codigo` with item-level `IDItem`
- **AND** fixtures cover repeated licitacion `CodigoExterno` with `Codigoitem` and supplier/offer grain
- **AND** fixtures preserve exact observed raw column names, including unusual names

### Requirement: Internal Consumer Reads

The system SHALL provide internal read contracts for downstream consumers without exposing raw persistence details.

#### Scenario: Internal read contracts stay non-public in phase 1

- **WHEN** this backbone is implemented in this phase
- **THEN** detected-process and health reads are exposed through internal backend service contracts
- **AND** the change does not add a new public GraphQL, REST, or MCP surface for Mercado Publico reads

#### Scenario: Downstream consumer lists detected processes

- **WHEN** an internal consumer requests detected procurement processes
- **THEN** the system serves the list from the gold/read contract
- **AND** the minimum list shape includes `processType`, `processCode`, `title`, `canonicalState`, `rawStateCode`, `buyerCode`, `buyerName`, `publishedAt`, `closingAt`, `sourcePriority`, `reconciliationStatus`, and `lastSeenAt`

#### Scenario: Downstream consumer inspects process detail

- **WHEN** an internal consumer requests a process detail by type and code
- **THEN** the system returns canonical process detail plus reconciliation context
- **AND** the minimum detail shape includes canonical header, normalized items, adjudication summary when applicable, related OC summaries, source lineage summary, and reconciliation summary

#### Scenario: Downstream consumer inspects operational health

- **WHEN** an internal consumer requests pipeline health, CSV file health, or quota usage
- **THEN** the system returns latest job outcomes, freshness indicators, CSV file profiling outcomes, and quota fields needed for operational visibility

### Requirement: Scope Guardrails

The system SHALL keep CRM-facing consumer behavior out of scope for this change.

#### Scenario: CRM projection is deferred

- **WHEN** this change is implemented
- **THEN** it does not create `Opportunity` records
- **AND** it does not sync to `Companies` or `People`
- **AND** it does not ship the future `Licitaciones` UI
