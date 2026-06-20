# Design: mercado-publico-ingestion-backbone

## Summary

Create a deployment-local shared Mercado Publico ingestion backbone inside `twenty-server` backed by a static PostgreSQL schema `mp`. The backbone serves as a public procurement corpus shared across workspaces within a single installation without polluting per-workspace schemas or prematurely encoding business workflow decisions.

This change is API-executable and CSV-ready, but not yet CSV-executing.

## Delivery Principles

- Phase 0 is investigation only. No code implementation starts there.
- Implementation should follow repository seams and existing module patterns discovered during investigation, not invented structure.
- Tests should verify behavior through the module interface and public contracts, not internal wiring.
- Architecture changes should prefer deeper modules with higher leverage and better locality over shallow pass-through abstractions.
- Validation should start with the smallest relevant gates and expand only as needed.
- Shared domain rules should live in repository files, especially `docs/business/mercado-publico-ingestion-context.md`, not only in OpenSpec text.

## Architectural Exception

`mp` is a static schema shared across workspaces within a single deployment.

This is a deliberate exception to Twenty's default `workspace_<id>` isolation model:

- the exception is limited to public procurement reference corpus
- it must not be generalized to tenant-owned CRM data
- it does not change the current deployment topology
- a customer-isolated deployment still owns its own `mp` schema

## Architecture

### Persistence Boundary

- Store the shared corpus under `mp`, not under `workspace_<id>`.
- Share `mp` across workspaces within the same installation only.
- Create all schema objects through instance commands.
- Keep the current Twenty multi-tenant model unchanged.
- Treat the shared ingestion backbone as a core module with a clear interface and limited external seam surface.

### Data Layers

#### Raw

- `mp.raw_api_payload`
- `mp.raw_csv_file`
- `mp.raw_csv_row`

Purpose:
- Preserve full request payloads and CSV lineage
- Record request fingerprints, checksums, params, status, timestamps, and ingestion counters

#### Staging

- `mp.stg_api_v1_licitacion`
- `mp.stg_api_v1_orden_compra`
- `mp.stg_api_v2_compra_agil`
- `mp.stg_csv_contract`
- `mp.stg_job_run`

Purpose:
- Hold list snapshots, detail snapshots, CSV contract state, and job execution traces

#### Canonical

- `mp.public_buyer`
- `mp.licitacion`
- `mp.licitacion_item`
- `mp.licitacion_adjudicacion`
- `mp.orden_compra`
- `mp.orden_compra_item`
- `mp.compra_agil`
- `mp.compra_agil_producto`
- `mp.compra_agil_cotizacion`
- `mp.estado_dim`

Purpose:
- Store normalized entities keyed by natural keys and source attribution

#### Reconciliation

- `mp.reconciliation_licitacion_oc`
- `mp.reconciliation_event`

Purpose:
- Store exact and heuristic links across licitaciones, OCs, and Compra Agil
- Preserve mismatches and manual review requirements as auditable events

#### Gold / Read

- `mp.gold_detected_process`
- `mp.gold_pipeline_health`
- `mp.gold_api_quota_usage`

Purpose:
- Expose consumer-friendly internal read contracts without coupling consumers to raw or staging tables

## Natural Keys

- Licitacion: `CodigoExterno`
- Orden de Compra: `Codigo`
- Compra Agil: `codigo`
- Buyer: `CodigoOrganismo` or RUT with explicit source attribution

## Normalization Rules

- Preserve the full raw payload for every external request.
- List endpoints store auditable snapshots.
- Detail endpoints rehydrate canonical entities.
- Never overwrite non-null canonical values with `null`.
- Always preserve raw state code and raw state label alongside canonical state.
- Preserve source attribution at field-family level when priority rules influence the canonical result.

## Source Priority Matrix

- Licitacion identity:
  - exact-key reconciliation across API and CSV
- Recent licitacion lifecycle state:
  - API wins
- Historical completeness and offer evidence:
  - CSV wins when CSV execution lands
- Recent OC operational state:
  - API by code wins
- Compra Agil to OC linkage:
  - `id_orden_compra` or `id_oc` wins over `codigo_orden_compra`
- Raw provenance:
  - both sources are preserved independently
- Heuristic item, amount, or supplier matching:
  - candidate only, never auto-promoted to exact truth

## Reconciliation Policy

- Exact key joins take precedence over all heuristics.
- Licitacion to OC exact match uses `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`.
- Compra Agil must not join to licitacion through `CodigoLicitacion`.
- Compra Agil to OC exact linkage uses `id_orden_compra` or `id_oc` when present.
- API wins for recent operational lifecycle state.
- CSV wins for historical completeness and offer detail when CSV execution lands.
- Heuristic matches may only emit:
  - `candidate_item_amount_supplier`
  - `manual_review_required`
  - `unmatched`
- Reconciliation mismatches must generate auditable `reconciliation_event` rows.
- `reconciliation_event` must be idempotent by logical mismatch fingerprint so reruns do not create event noise.

## Job Catalog

Required in this phase:

- `api-v1-licitaciones-by-state`
- `api-v1-licitacion-detail-by-codigo`
- `api-v1-oc-by-state`
- `api-v1-oc-detail-by-codigo`
- `api-v2-compra-agil-incremental`
- `api-v2-compra-agil-detail-by-codigo`
- `reconciliation-refresh`

Deferred in this phase:

- `api-v1-licitaciones-by-date`
- `api-v1-oc-by-date`
- `api-v2-compra-agil-by-publication-window`

## Operational Defaults

- Compra Agil incremental polling uses `ttl_cambio_ms`.
- Active and published licitaciones sweep more frequently.
- Broader V1 state sweeps run less frequently.
- Detail rehydrate triggers on:
  - first seen
  - state drift
  - unresolved reference
  - mismatch against canonical state

## Explicitly Deferred In This Change

- CSV file download, decompression, parsing, and batch normalization execution
- Historical completeness claims derived from CSV execution
- API V1 by-date sweep jobs
- Opportunity, Company, People, or UI projections
- Cross-customer shared control plane behavior

## Traceability Requirements

Every job run must persist:

- `job_id`
- `source`
- `endpoint`
- `request_params`
- `http_status`
- `fetched_at`
- `checksum`
- `schema_fingerprint`
- `records_*`
- `error_summary`

## Idempotency

- Deduplicate raw payloads by request fingerprint plus payload checksum.
- Deduplicate canonical entities by natural key.
- Deduplicate reconciliation events by logical mismatch fingerprint.
- Support safe reruns without duplicating canonical rows.

## Resilience

- `401` / `403`: fail hard
- `404`: soft miss, but auditable
- `429` / `500` / `503` / timeout: `retryable_failed`
- Apply bounded backoff
- No infinite retry loops
- Enforce daily operational quota with reset in `America/Santiago`

## Secrets

- `MERCADO_PUBLICO_API_TICKET`
- `COMPRA_AGIL_API_TICKET`

Rules:
- Never log secrets
- Never store secrets in fixtures
- Never serialize secrets into raw payload error structures

## Internal Read Contracts

- `listDetectedProcesses(filters)`
- `getDetectedProcessDetail(processType, processCode)`
- `getPipelineHealth()`
- `getApiQuotaUsage()`

These contracts should remain the primary test surface for downstream behavior-oriented tests where possible.

### Internal Read Contract Shapes

`listDetectedProcesses(filters)`

- Filters:
  - `processTypes`
  - `states`
  - `buyerCode`
  - `publishedFrom`
  - `publishedTo`
  - `changedSince`
  - `page`
  - `limit`
  - `sort`
- Returns at minimum:
  - `processType`
  - `processCode`
  - `title`
  - `canonicalState`
  - `rawStateCode`
  - `rawStateLabel`
  - `buyerCode`
  - `buyerName`
  - `publishedAt`
  - `closingAt`
  - `sourcePriority`
  - `reconciliationStatus`
  - `lastSeenAt`

`getDetectedProcessDetail(processType, processCode)`

- Returns at minimum:
  - canonical header
  - raw state summary
  - adjudication summary when applicable
  - normalized items
  - related OC summaries
  - source lineage summary
  - reconciliation summary

`getPipelineHealth()`

- Returns at minimum:
  - latest run status by job
  - freshness or lag indicators
  - last success timestamps
  - failure counters

`getApiQuotaUsage()`

- Returns at minimum:
  - `source`
  - `dailyLimit`
  - `used`
  - `remaining`
  - `resetAt`
  - `last429At`

## Delivery Workflow

### Phase 0: Investigation

- Prime the codebase and review repo documentation, standards, ADRs, and established backend/data patterns.
- Review `docs/business/mercado-publico-ingestion-context.md` alongside the existing business and architecture docs.
- Review module, interface, seam, and adapter patterns already used in `twenty-server`.
- Produce:
  - pattern inventory
  - blast-radius review
  - regression seam map
  - minimal implementation plan
- Make no implementation changes in this phase.

### Phase 1: TDD and Verification Design

- Convert critical behaviors into vertical-slice tests.
- Prefer integration-style tests through public contracts.
- Confirm which seams require DB-backed tests, local substitutes, or mocks.
- Define the minimum red-green-refactor path before implementation begins.

### Phase 2: Layered Implementation

- Database layer first: instance commands, schema objects, constraints, indexes, views.
- Backend layer second: ingestion modules, normalization rules, reconciliation rules, read contracts, and job policies.
- Frontend layer is explicitly out of scope for this change and should remain excluded.

### Phase 3: Validation and CI

- Run unit, integration, and DB verification in the smallest useful order.
- Expand to CI-level validation only after local and targeted checks pass.
- Confirm no unintended regressions escaped the blast-radius review.

### Phase 4: Closeout

- Update any durable docs affected by the change.
- Review whether `CHANGELOG.md` needs an `Unreleased` entry.
- Record what was validated, what remains deferred, and which consumer-facing phases are intentionally postponed.

## Consumer Contract For Later Change

- `gold_detected_process` becomes the source for future `Licitaciones` UI
- Selection into `Opportunity`
- Sync into `Companies` and `People`

Those consumer behaviors are explicitly out of scope for this change.
