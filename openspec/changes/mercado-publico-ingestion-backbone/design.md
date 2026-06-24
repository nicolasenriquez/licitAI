# Design: mercado-publico-ingestion-backbone

## Summary

Create a deployment-local shared Mercado Publico ingestion backbone inside `twenty-server` backed by a static PostgreSQL schema `mp`. The backbone serves as a public procurement corpus shared across workspaces within a single installation without polluting per-workspace schemas or prematurely encoding CRM workflow decisions.

This change is manually executable in phase 1, process by process, through existing internal backend infrastructure.

## Delivery Principles

- Phase 0 is investigation only. No application implementation starts there.
- Implementation follows existing `twenty-server` patterns for modules, config, secure HTTP, jobs, instance commands, and tests.
- Tests verify behavior through module interfaces, read contracts, persisted rows, and job outcomes.
- Architecture changes should prefer deeper modules with better locality over shallow pass-through abstractions.
- Validation starts with the smallest relevant gates and expands only as needed.
- Shared domain and source rules live in repository files, especially `docs/business/mercado-publico-source-contract.md` and `docs/business/mercado-publico-ingestion-context.md`.

## Architectural Exception

`mp` is a static schema shared across workspaces within a single deployment.

This is a deliberate exception to Twenty's default `workspace_<id>` isolation model:

- the exception is limited to public procurement reference data
- it must not be generalized to tenant-owned CRM data
- it does not change the current deployment topology
- a customer-isolated deployment still owns its own `mp` schema
- the decision is recorded in `docs/decisions/0005-deployment-local-mercado-publico-schema.md`

## Architecture

### Persistence Boundary

- Store the shared corpus under `mp`, not under `workspace_<id>`.
- Share `mp` across workspaces within the same installation only.
- Create all schema objects through instance commands.
- Keep the current Twenty multi-tenant model unchanged.
- Treat the shared ingestion backbone as a core module with a clear interface and limited external surface.
- Do not expose raw `mp` tables directly to user-facing UI or apps.

### Static Schema Access Model

- `workspace_<id>` CRM data remains on the existing metadata-driven TwentyORM path.
- `mp` is a static-schema exception and must not require runtime metadata compilation or workspace schema generation.
- `mp` objects are created through instance commands and accessed through dedicated backend module services and static-table query access patterns appropriate for a deployment-local schema.
- This change must not generalize static-schema access patterns to tenant-owned CRM records.

### Data Layers

#### Raw

> **Binding column definitions**: see `schema-catalog.md` §Raw Layer for complete column names, types, constraints, and source mapping.

- `mp.raw_api_payload`
- `mp.raw_csv_file`
- `mp.raw_csv_row`

Purpose:

- Preserve full request payloads, downloaded file metadata, and row lineage.
- Record request fingerprints, payload checksums, file checksums, params, status, timestamps, observed columns, schema fingerprints, and ingestion counters.

Minimum object contract:

- `mp.raw_api_payload`
  - PK: surrogate `id`
  - UK: `source + endpoint + request_fingerprint + payload_checksum`
  - Required fields: `source`, `endpoint`, `request_fingerprint`, `payload_checksum`, `request_params`, `http_status`, `fetched_at`, `raw_payload`, `schema_fingerprint`
- `mp.raw_csv_file`
  - PK: surrogate `id`
  - UK: `source_dataset + source_period + file_checksum`
  - Required fields: `source_dataset`, `source_period`, `source_file_name`, `file_checksum`, `file_size_bytes`, `detected_encoding`, `detected_delimiter`, `quotechar`, `header_raw`, `observed_columns`, `column_count`, `schema_fingerprint`, `row_count`, `downloaded_at`
- `mp.raw_csv_row`
  - PK: surrogate `id`
  - UK: `raw_csv_file_id + row_number + row_checksum`
  - Required fields: `raw_csv_file_id`, `source_dataset`, `source_period`, `row_number`, `raw_row_text`, `raw_row_json`, `row_checksum`, `parse_status`, `parse_error`

#### Staging

> **Binding column definitions**: see `schema-catalog.md` §Staging Layer for complete column names, types, constraints, and source mapping.

- `mp.stg_api_v1_licitacion`
- `mp.stg_api_v1_orden_compra`
- `mp.stg_api_v2_compra_agil`
- `mp.stg_csv_licitacion`
- `mp.stg_csv_orden_compra`
- `mp.stg_job_run`

Purpose:

- Hold list snapshots, detail snapshots, parsed CSV row projections, and job execution traces before canonical refresh.

Minimum object contract:

- API staging rows keep source family, snapshot kind (`list` or `detail`), natural key, fetched timestamp, and selected projected fields.
- CSV staging rows keep `raw_csv_row_id`, projected observed fields, and grain-safe identifiers such as `Codigo`, `IDItem`, `CodigoExterno`, `Codigoitem`, `CodigoProveedor`, and `Nombre de la Oferta` when present.
- `mp.stg_job_run` keeps `job_name`, `job_run_id`, `status`, `started_at`, `finished_at`, counters, and `error_summary`.

#### Canonical

> **Binding column definitions**: see `schema-catalog.md` §Canonical Layer for complete column names, types, constraints, and source mapping.

- `mp.public_buyer`
- `mp.public_supplier`
- `mp.licitacion`
- `mp.licitacion_item`
- `mp.licitacion_oferta`
- `mp.licitacion_adjudicacion`
- `mp.orden_compra`
- `mp.orden_compra_item`
- `mp.compra_agil`
- `mp.compra_agil_producto_solicitado`
- `mp.compra_agil_cotizacion`
- `mp.estado_dim`
- `mp.modalidad_dim`

Purpose:

- Store normalized entities keyed by natural keys, preserve raw state fields, and retain source attribution.

Minimum key and uniqueness contract:

- `mp.licitacion`: UK `CodigoExterno`
- `mp.licitacion_item`: UK `CodigoExterno + Codigoitem`
- `mp.licitacion_oferta`: UK `CodigoExterno + Codigoitem + CodigoProveedor + Nombre de la Oferta`, subject to validation against real duplicate cases
- `mp.licitacion_adjudicacion`: UK `CodigoExterno + Codigoitem + RutProveedor`, nullable item segment only if source proves process-level award only
- `mp.orden_compra`: UK `Codigo`
- `mp.orden_compra_item`: UK `IDItem`
- `mp.compra_agil`: UK `codigo`
- `mp.compra_agil_producto_solicitado`: UK `codigo + codigo_producto + ordinal`
- `mp.compra_agil_cotizacion`: UK `codigo + rut_proveedor + id_cotizacion`

#### Reconciliation

> **Binding column definitions**: see `schema-catalog.md` §Reconciliation Layer for complete column names, types, constraints, and source mapping.

- `mp.reconciliation_public_market_entities`
- `mp.reconciliation_event`

Purpose:

- Store exact, candidate, unmatched, and manual-review-required links across licitaciones, OCs, Compra Agil, and CSV/API records.
- Preserve mismatches as auditable events.

Minimum object contract:

- `mp.reconciliation_public_market_entities`
  - PK: surrogate `id`
  - UK: `entity_a_source + entity_a_type + entity_a_key + entity_b_source + entity_b_type + entity_b_key + match_type`
  - Required fields: `match_confidence`, `matched_by`, `matched_at`, `review_status`
- `mp.reconciliation_event`
  - PK: surrogate `id`
  - UK: logical mismatch fingerprint
  - Required fields: `event_type`, `entity_type`, `entity_key`, `source_a`, `source_b`, `details`, `created_at`

#### Gold / Read

> **Binding column definitions**: see `schema-catalog.md` §Gold Layer for complete column names, types, constraints, and source mapping.

- `mp.gold_detected_process`
- `mp.gold_pipeline_health`
- `mp.gold_api_quota_usage`
- `mp.gold_csv_file_health`
- `mp.gold_conciliacion_licitacion_oc`

Purpose:

- Expose consumer-friendly internal read contracts without coupling consumers to raw or staging tables.

## Source Contracts

`docs/business/mercado-publico-source-contract.md` is the durable source contract. Implementation must follow it for:

- API V1 `ddmmaaaa` date format.
- API V1 list vs detail behavior.
- API V1 licitacion and OC state codes.
- Compra Agil V2 params, pagination, mutually exclusive `id`/`q`, and OC linkage.
- CSV download/profiling/raw row metadata.
- CSV partial UI-visible columns.
- CSV header-as-operational-schema behavior.
- Observed June 2026 CSV behavior for `latin-1`, `;`, `"` quotechar, comma decimals, null-like raw values, `1900-01-01` sentinel dates, and row grain.
- Fixture requirements.

## Natural Keys

- Licitacion: `CodigoExterno`
- Orden de Compra: `Codigo`
- Compra Agil: `codigo`
- CSV OC header candidate: `Codigo`
- CSV OC item candidate: `IDItem`
- CSV licitacion header candidate: `CodigoExterno`
- CSV licitacion item candidate: `CodigoExterno + Codigoitem`
- CSV licitacion offer candidate: `CodigoExterno + Codigoitem + CodigoProveedor + Nombre de la Oferta`, subject to validation
- Buyer: `CodigoOrganismo` or RUT with explicit source attribution
- Supplier: RUT or source-specific supplier code with explicit source attribution

## Normalization Rules

- Preserve the full raw payload for every external API request.
- Preserve every downloaded CSV file record before parsing.
- Preserve every CSV row as `raw_row_text` and parsed `raw_row_json` when parsing succeeds.
- Preserve raw CSV column names exactly as observed, including misspellings, spaces, punctuation, and duplicate-suffixed names.
- List endpoints store auditable snapshots.
- Detail endpoints rehydrate canonical entities.
- Never overwrite non-null canonical values with `null`.
- Always preserve raw state code and raw state label alongside canonical state.
- Preserve source attribution at field-family level when priority rules influence the canonical result.
- Do not enforce raw CSV uniqueness on `CodigoExterno`.
- Do not enforce raw CSV uniqueness on `Codigo`, `ID`, `IDItem`, or `Codigoitem`.
- Do not drop unknown CSV columns.
- Do not validate licitacion type against a single closed list; map unknown types to `unknown_raw_type`.
- Treat `NA`, empty fields, and whitespace-only fields as raw values in raw storage; canonical projections may normalize them to null with explicit rules.
- Treat `1900-01-01` as a sentinel date in canonical projections while retaining the raw value.
- Convert comma decimals only in validated numeric canonical fields, never in raw storage.
- Do not infer that every business date inside a monthly CSV belongs to the file month.

## Observed CSV Grain

The June 2026 observed CSV files provide concrete fixture requirements:

- OC CSV observed grain is item-level. `Codigo` can repeat, while `IDItem` is the observed candidate item key.
- OC `CodigoLicitacion` is nullable and must not be required.
- OC Compra Agil detection in CSV is defensive: `EsCompraAgil = Si` and/or `CodigoAbreviadoTipoOC = AG`.
- OC modality normalization should consider `CodigoTipo`, `CodigoAbreviadoTipoOC`, and `DescripcionTipoOC` together.
- Licitaciones CSV observed grain is `licitacion + item + proveedor/oferta`. `CodigoExterno` and `Codigo` can repeat.
- Licitaciones `Codigoitem` is the observed candidate item key.
- Licitaciones supplier candidates include `CodigoProveedor` and `RutProveedor`.
- Licitaciones CSV is historical and offer evidence; it is not the primary source for active opportunities.

## Source Priority Matrix

- Licitacion identity:
  - exact-key reconciliation across API and CSV
- Recent licitacion lifecycle state:
  - API wins when `now(America/Santiago) <= max(FechaCierre, FechaPublicacion) + 30 days`
- Historical completeness and offer evidence:
  - CSV wins after CSV rows are loaded and profiled
- Recent OC operational state:
  - API by code wins
- Long-range OC completeness:
  - CSV wins after CSV rows are loaded and profiled
- Compra Agil to OC linkage:
  - `id_orden_compra` or `id_oc` wins over `codigo_orden_compra`
- Raw provenance:
  - all sources are preserved independently
- Heuristic item, amount, or supplier matching:
  - candidate only, never auto-promoted to exact truth

## Reconciliation Policy

- Exact key joins take precedence over all heuristics.
- API and CSV licitacion same-business-key match uses `CodigoExterno`.
- API and CSV OC same-business-key match uses `Codigo`.
- Licitacion to OC exact match uses `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`.
- Compra Agil must not join to licitacion through `CodigoLicitacion`.
- Compra Agil to OC exact linkage uses `id_orden_compra` or `id_oc` when present.
- API wins for recent operational lifecycle state.
- CSV wins for historical completeness and offer detail after CSV rows are loaded, profiled, and mapped.
- If the same CSV `source_period` is re-downloaded with a different checksum:
  - keep both raw files
  - rerun canonical and reconciliation from the newer file
  - do not mutate or delete older raw lineage
  - emit a reconciliation event if business-key outcomes change
- Heuristic matches may only emit:
  - `candidate_supplier_amount`
  - `candidate_item_amount`
  - `manual_review_required`
  - `unmatched`
- Reconciliation mismatches must generate auditable `reconciliation_event` rows.
- `reconciliation_event` must be idempotent by logical mismatch fingerprint so reruns do not create repeated event noise.

## Job Catalog

Required in this phase:

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

## Job Execution Model

- Use the existing backend queue and worker patterns already standard in the repository.
- Do not introduce a separate Mercado Publico scheduler, control plane, or parallel job framework in phase 1.
- Mercado Publico jobs should remain manually triggerable, enqueueable, observable, and retryable through the existing backend job infrastructure conventions.
- Phase 1 does not add a new public GraphQL, REST, or MCP execution surface for these jobs.
- Phase 1 keeps the execution model internal to `twenty-server`.

## Deferred Automation Defaults

- API V1 dates are formatted as `ddmmaaaa`.
- Compra Agil incremental polling supports `ttl_cambio_ms`.
- Compra Agil incremental polling also supports `cambio_desde` and `cambio_hasta`.
- Compra Agil publication sweeps support `publicado_desde` and `publicado_hasta`.
- Compra Agil pagination uses `tamano_pagina <= 50` and `numero_pagina >= 1`.
- If automation is introduced in a later phase, high-frequency jobs should run every `1 hour`:
  - `api-v1-licitaciones-by-state` for active operational states
  - `api-v2-compra-agil-incremental`
- If automation is introduced in a later phase, lower-frequency jobs should run every `24 hours`:
  - `api-v1-licitaciones-by-date`
  - `api-v1-oc-by-date`
  - `api-v1-oc-by-state`
  - `api-v2-compra-agil-by-publication-window`
  - `reconciliation-refresh`
  - `csv-canonical-refresh`
- In phase 1, CSV jobs run on demand when source URLs and storage roots are configured.
- Detail rehydrate triggers on:
  - first seen
  - state drift
  - unresolved reference
  - mismatch against canonical state
  - Compra Agil OC linkage appearing after a previous null linkage
- CSV files are profiled before parsing into staging.
- CSV files do not fail only because unknown columns appear.
- Gold health is cadence-relative:
  - `healthy`: last success at or under `1.5x` expected cadence
  - `degraded`: over `1.5x` and at or under `3x` expected cadence
  - `stale`: over `3x` expected cadence

## CSV File Lifecycle

- `MERCADO_PUBLICO_CSV_STORAGE_ROOT` is an operational staging location, not by itself the audit contract.
- The phase-1 audit contract is the persisted raw file metadata, raw row lineage, checksums, and profiling outcomes stored under `mp`.
- Implementations may retain downloaded file bytes temporarily or longer, but they must not make auditability depend on indefinite filesystem retention alone.
- If a local file retention or cleanup policy becomes an operational standard, that policy should be documented in `docs/operations/`.

## Explicitly Deferred In This Change

- Opportunity, Company, People, or UI projections
- Cross-customer shared control plane behavior
- Currency conversion without an official exchange-rate source
- Automatic promotion of heuristic reconciliation candidates to exact truth
- Product-facing historical completeness claims beyond loaded and profiled source files

## Traceability Requirements

Every API job run must persist:

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

Every CSV file run must persist:

- `source_system`
- `source_dataset`
- `source_url`
- `source_file_name`
- `source_period`
- `source_modality`
- `downloaded_at`
- `file_checksum`
- `file_size_bytes`
- `compression_type`
- `detected_encoding`
- `detected_delimiter`
- `quotechar`
- `header_raw`
- `observed_columns`
- `column_count`
- `schema_fingerprint`
- `row_count`
- `ingestion_job_id`

Every CSV row must persist:

- `ingestion_job_id`
- `source_dataset`
- `source_file_name`
- `source_period`
- `row_number`
- `raw_row_text`
- `raw_row_json`
- `row_checksum`
- `parse_status`
- `parse_error`
- `created_at`

## Idempotency

- Deduplicate raw API payloads by request fingerprint plus payload checksum.
- Deduplicate raw CSV files by source identity plus file checksum.
- Deduplicate raw CSV rows by file checksum plus row number plus row checksum.
- Deduplicate canonical entities by natural key.
- Deduplicate reconciliation events by logical mismatch fingerprint.
- Support safe reruns without duplicating canonical rows, raw file entries, or reconciliation noise.

## Resilience

- `400`: fail validation and record parameter error.
- `401` / `403`: fail hard.
- `404`: soft miss, but auditable.
- `429` / `500` / `503` / timeout: `retryable_failed`.
- Apply bounded backoff.
- No infinite retry loops.
- Enforce daily operational quota with reset in `America/Santiago`.
- Record `last429At` and retry window when available.

## Secrets

- `MERCADO_PUBLICO_API_TICKET`
- `COMPRA_AGIL_API_TICKET`

## Runtime Configuration

The backbone must use typed Twenty config variables rather than ad hoc `process.env` reads in feature code.

Required configuration variables:

- `MERCADO_PUBLICO_API_TICKET` - sensitive
- `COMPRA_AGIL_API_TICKET` - sensitive
- `MERCADO_PUBLICO_API_V1_BASE_URL` - non-sensitive
- `COMPRA_AGIL_API_BASE_URL` - non-sensitive
- `MERCADO_PUBLICO_HTTP_TIMEOUT_MS` - non-sensitive
- `MERCADO_PUBLICO_HTTP_MAX_RETRIES` - non-sensitive
- `MERCADO_PUBLICO_HTTP_RETRY_BACKOFF_MS` - non-sensitive
- `MERCADO_PUBLICO_QUOTA_TIMEZONE` - non-sensitive, default `America/Santiago`
- `MERCADO_PUBLICO_CSV_STORAGE_ROOT` - non-sensitive
- `MERCADO_PUBLICO_CSV_OC_SOURCE_URL` - non-sensitive
- `MERCADO_PUBLICO_CSV_LICITACIONES_SOURCE_URL` - non-sensitive
- `MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED` - non-sensitive

Rules:

- Register these variables in `TwentyConfig` with metadata and sensitivity flags.
- Consume them through `TwentyConfigService`.
- Use `SecureHttpClientService` for outbound HTTP clients.
- Do not put feature-level `process.env` access in the Mercado Publico module.

Rules:

- Never log secrets.
- Never store secrets in fixtures.
- Never serialize secrets into raw payload error structures.
- Use environment or managed configuration only.

## Fixture Contract

Required fixtures:

- API V1 licitacion list response.
- API V1 licitacion detail response.
- API V1 OC list response.
- API V1 OC detail response.
- API V2 Compra Agil list response.
- API V2 Compra Agil detail response with OC linkage present.
- API V2 Compra Agil detail response with OC linkage absent.
- CSV licitaciones sample or anonymized real header plus at least one row.
- CSV ordenes de compra sample or anonymized real header plus at least one row.
- CSV latin-1 sample with accented text.
- CSV semicolon delimiter sample.
- CSV quotechar sample using `"`.
- CSV comma-decimal numeric sample.
- CSV null-like value sample covering `NA`, blank, and whitespace.
- CSV `1900-01-01` sentinel date sample.
- CSV OC sample where `Codigo` repeats and `IDItem` is unique.
- CSV OC sample where `CodigoLicitacion` is blank.
- CSV OC Compra Agil sample using `EsCompraAgil = Si` and/or `CodigoAbreviadoTipoOC = AG`.
- CSV licitaciones sample where `CodigoExterno` repeats across `Codigoitem` and supplier/offer rows.
- CSV licitaciones sample preserving exact observed unusual column names such as `Nombre producto genrico`, `DescripcionCriteriosRequisitosSociales.1`, and `Monto Estimado Adjudicado`.

## Internal Read Contracts

- `listDetectedProcesses(filters)`
- `getDetectedProcessDetail(processType, processCode)`
- `getPipelineHealth()`
- `getApiQuotaUsage()`
- `getCsvFileHealth()`

These contracts should remain the primary behavior-oriented test surface where possible.
In phase 1 they are implemented as internal backend service contracts inside `twenty-server`, not as new public GraphQL, REST, or MCP surfaces.

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

`getCsvFileHealth()`

- Returns at minimum:
  - `sourceDataset`
  - `sourcePeriod`
  - `sourceFileName`
  - `fileChecksum`
  - `detectedEncoding`
  - `detectedDelimiter`
  - `schemaFingerprint`
  - `rowCount`
  - `parseStatus`
  - `lastLoadedAt`

## Delivery Workflow

### Phase 0: Investigation

- Prime the codebase and review repo documentation, standards, ADRs, and established backend/data patterns.
- Review `docs/business/mercado-publico-source-contract.md` and `docs/business/mercado-publico-ingestion-context.md` alongside existing business and architecture docs.
- Review module, interface, adapter, migration, queue, config, and secure HTTP patterns already used in `twenty-server`.
- Verify the untouched baseline with the smallest relevant repository gates and document any pre-existing failures before implementation starts.
- Produce:
  - pattern inventory
  - blast-radius review
  - regression check map
  - minimal implementation plan
- Make no application implementation changes in this phase.

### Phase 1: TDD and Verification Design

- Convert critical behaviors into tracer-bullet and follow-on vertical-slice tests.
- Prefer integration-style tests through public contracts and persisted outcomes.
- Confirm which behaviors require DB-backed tests, source fixtures, local substitutes, or mocks.
- Define the minimum red-green-refactor path before implementation begins.

### Phase 2: Layered Implementation

- Foundation blockers first: instance commands, schema objects, typed config registration, and raw persistence seams.
- First tracer-bullet slice next: one narrow end-to-end source path through ingestion, canonical refresh, and internal read output.
- Source expansion and hardening after that: additional source jobs, normalization rules, reconciliation rules, internal service-layer read contracts, and job policies.
- Frontend layer is explicitly out of scope for this change and should remain excluded.
- Provide an optional local operator helper with one command per manual process, without changing the repository-wide standard command surface.

### Phase 3: Validation and CI

- Run unit, integration, and DB verification in the smallest useful order.
- Expand to CI-level validation only after local and targeted checks pass.
- Confirm no unintended regressions escaped the blast-radius review.

### Phase 4: Closeout

- Update any durable docs affected by the implementation.
- Review whether `CHANGELOG.md` needs an `Unreleased` entry.
- Record what was validated, what remains deferred, and which consumer-facing phases are intentionally postponed.

## Consumer Contract For Later Change

- `gold_detected_process` becomes the source for future `Licitaciones` UI.
- Selection into `Opportunity`.
- Sync into `Companies` and `People`.

Those consumer behaviors are explicitly out of scope for this change.
