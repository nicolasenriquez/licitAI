# Spec: mercado-publico-ingestion-backbone

## ADDED Requirements

### Requirement: Deployment-Local Shared Mercado Publico Backbone

The system SHALL provide a deployment-local shared Mercado Publico ingestion backbone inside `packages/twenty-server` for public procurement data that is not scoped per workspace.

#### Scenario: Shared corpus is stored outside workspace schemas

- **WHEN** Mercado Publico ingestion persists public procurement data
- **THEN** the data is stored under a static PostgreSQL schema `mp`
- **AND** the implementation does not create `workspace_<id>` schemas for this corpus

#### Scenario: Shared corpus does not change deployment isolation

- **WHEN** the product is deployed in isolated customer environments
- **THEN** each environment owns its own `mp` schema
- **AND** this change does not introduce a cross-customer shared control plane

### Requirement: Multi-Layer Persistence Model

The system SHALL persist Mercado Publico ingestion data across raw, staging, canonical, reconciliation, and gold/read layers.

#### Scenario: Raw API payloads remain auditable

- **WHEN** an API request is executed
- **THEN** the system stores the request fingerprint, payload checksum, request params, status metadata, and full raw payload in the raw layer

#### Scenario: CSV support is contract-ready only in this phase

- **WHEN** CSV support is prepared in this phase
- **THEN** the system stores file registry, row registry, observed columns, parse status, and checksums
- **AND** the system does not yet perform CSV download, decompression, parsing, or historical batch normalization
- **AND** the system does not claim historical completeness from CSV until a follow-up CSV execution change lands

### Requirement: Canonical Normalization

The system SHALL normalize Mercado Publico data into canonical entities keyed by natural keys while preserving raw state information.

#### Scenario: Canonical entities use natural keys

- **WHEN** the system persists canonical entities
- **THEN** licitaciones are keyed by `CodigoExterno`
- **AND** ordenes de compra are keyed by `Codigo`
- **AND** compra agil entities are keyed by `codigo`
- **AND** buyers keep source attribution with `CodigoOrganismo` or RUT

#### Scenario: Non-null canonical values are protected

- **WHEN** a later payload omits or nulls a field already populated canonically
- **THEN** the system does not overwrite the existing non-null canonical value with `null`

### Requirement: Source Priority And Reconciliation Policy

The system SHALL apply explicit source-priority and reconciliation rules during canonical refresh and linkage.

#### Scenario: Recent licitacion state prefers API

- **WHEN** API and CSV disagree on recent licitacion lifecycle state
- **THEN** API is preferred for recent operational state
- **AND** the mismatch remains auditable

#### Scenario: Historical completeness prefers CSV

- **WHEN** CSV contains historical completeness or offer evidence absent from API snapshots
- **THEN** CSV is preserved as the preferred historical source when CSV execution becomes available
- **AND** the system does not silently discard that evidence

#### Scenario: Exact licitacion to OC match

- **WHEN** `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`
- **THEN** the system records `match_type = exact_codigo_licitacion`

#### Scenario: Compra Agil does not join to licitacion by CodigoLicitacion

- **WHEN** Compra Agil records are reconciled
- **THEN** the system does not infer a licitacion relationship from `CodigoLicitacion`
- **AND** it uses OC linkage rules instead

#### Scenario: Exact compra agil to OC match

- **WHEN** `compra_agil.id_orden_compra = orden_compra.id_oc_externo`
- **THEN** the system records `match_type = exact_compra_agil_id_orden_compra`

#### Scenario: Heuristic or unresolved matches remain non-authoritative

- **WHEN** an exact link is unavailable
- **THEN** the system may record `candidate_item_amount_supplier`, `unmatched`, or `manual_review_required`
- **AND** it persists reconciliation events for mismatches and unresolved relationships
- **AND** heuristic matches do not silently auto-promote to exact truth

### Requirement: Traceable Job Execution

The system SHALL record every ingestion job with traceability fields required for audit and debugging.

#### Scenario: Job metadata is persisted

- **WHEN** an ingestion job runs
- **THEN** the system stores `job_id`, `source`, `endpoint`, `request_params`, `http_status`, `fetched_at`, `checksum`, `schema_fingerprint`, record counters, and `error_summary`

### Requirement: Idempotent Reruns

The system SHALL support safe reruns without duplicating raw, canonical, or reconciliation data.

#### Scenario: Raw payload dedupe

- **WHEN** the same request fingerprint and payload checksum are seen again
- **THEN** the system deduplicates the raw payload record

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

### Requirement: Quota Governance

The system SHALL track API quota usage with a daily operational limit that resets in `America/Santiago`.

#### Scenario: Daily quota usage is visible internally

- **WHEN** jobs consume Mercado Publico APIs
- **THEN** the system exposes internal quota usage visibility through a read contract

### Requirement: Minimum Job Surface

The system SHALL require state-based V1 jobs, detail rehydrate jobs, Compra Agil incremental jobs, and reconciliation refresh in this phase.

#### Scenario: Minimum operational job surface is present

- **WHEN** this backbone is implemented in this phase
- **THEN** it includes:
  - `api-v1-licitaciones-by-state`
  - `api-v1-licitacion-detail-by-codigo`
  - `api-v1-oc-by-state`
  - `api-v1-oc-detail-by-codigo`
  - `api-v2-compra-agil-incremental`
  - `api-v2-compra-agil-detail-by-codigo`
  - `reconciliation-refresh`

#### Scenario: Date-based jobs are deferred

- **WHEN** the backbone is implemented in this phase
- **THEN** `by-date` V1 jobs are not required for completion
- **AND** they may be introduced later as operational extensions

### Requirement: Internal Consumer Reads

The system SHALL provide internal read contracts for downstream consumers without exposing raw persistence details.

#### Scenario: Downstream consumer lists detected processes

- **WHEN** an internal consumer requests detected procurement processes
- **THEN** the system serves the list from the gold/read contract
- **AND** the minimum list shape includes `processType`, `processCode`, `title`, `canonicalState`, `rawStateCode`, `buyerCode`, `buyerName`, `publishedAt`, `closingAt`, `sourcePriority`, `reconciliationStatus`, and `lastSeenAt`

#### Scenario: Downstream consumer inspects process detail

- **WHEN** an internal consumer requests a process detail by type and code
- **THEN** the system returns canonical process detail plus reconciliation context
- **AND** the minimum detail shape includes canonical header, normalized items, adjudication summary when applicable, related OC summaries, source lineage summary, and reconciliation summary

#### Scenario: Downstream consumer inspects operational health

- **WHEN** an internal consumer requests pipeline health or quota usage
- **THEN** the system returns latest job outcomes, freshness indicators, and quota fields needed for operational visibility

### Requirement: Scope Guardrails

The system SHALL keep CRM-facing consumer behavior out of scope for this change.

#### Scenario: CRM projection is deferred

- **WHEN** this change is implemented
- **THEN** it does not create `Opportunity` records
- **AND** it does not sync to `Companies` or `People`
- **AND** it does not ship the future `Licitaciones` UI
