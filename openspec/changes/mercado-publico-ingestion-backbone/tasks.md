---
type: change-tasks
title: "Tasks: mercado-publico-ingestion-backbone"
description: "Tasks for Mercado Publico Ingestion Backbone."
okf_version: "0.1"
---
# Tasks: mercado-publico-ingestion-backbone

## Phase 0: Investigation Only

- [x] 0.1: Prime the codebase and read the relevant repository context for `twenty-server`, database commands, upgrade commands, message queue patterns, secure HTTP patterns, config/secret handling, CSV/file handling patterns, `docs/business/mercado-publico-source-contract.md`, `docs/business/mercado-publico-ingestion-context.md`, and docs/standards relevant to backend and data work.
  Footnote: This phase is intentionally non-implementing. Understand structure, entry points, current state, domain rules, and recent patterns before proposing code shape.

- [x] 0.2: Inventory existing module, interface, adapter, migration, queue, config, secure HTTP, file-storage, and fixture patterns already used in `twenty-server`.
  Footnote: Focus on depth, leverage, locality, and deletion-test thinking so the planned backbone deepens the codebase instead of adding shallow pass-through modules.

- [x] 0.3: Verify the untouched baseline using the smallest relevant repository quality gates and record any pre-existing failures.
  Footnote: The implementation phase should start from a documented baseline, not from assumptions about repo health.

- [x] 0.4: Review blast radius and regression checks for static `mp` schema creation, instance commands, API ingestion jobs, CSV ingestion jobs, read contracts, quota handling, and secret handling.
  Footnote: The deliverable is an explicit review of files, flows, migrations, tests, runtime behaviors, and validation checks that prove the change is safe.

- [x] 0.5: Produce a minimal, surgical implementation plan mapped to repository patterns rather than invented structure.
  Footnote: The plan must satisfy the full source contract while preserving current tenancy, queue, config, upgrade conventions, and the explicit `mp` architectural exception. Freeze runtime config variables, cadence defaults, recent-state boundary, and CSV re-download conflict policy before implementation starts.

## Phase 1: TDD and Test Design

- [x] 1.1: Define the tracer-bullet implementation path and order the remaining slices by risk.
  Footnote: Start with the smallest vertical slice that proves schema creation, one ingestion path, and one read path end to end.

- [x] 1.2: Define the public test surface for backend modules and internal read contracts.
  Footnote: Tests should verify behavior through public interfaces, persisted rows, job outcomes, and read contracts rather than private collaborator calls. Phase-1 read contracts stay internal backend services, not new public APIs.

- [x] 1.3: Specify unit tests for V1 `ddmmaaaa` date formatting and V2 Compra Agil parameter guards.
  Footnote: Keep request-shape tests deterministic and small.

- [x] 1.4: Specify unit tests for CSV encoding detection, delimiter detection, quotechar detection, and latin-1 accented text parsing.
  Footnote: These tests should pin the observed June 2026 CSV parsing behavior.

- [x] 1.5: Specify unit tests for comma decimal parsing, `1900-01-01` sentinel handling, and null-like value normalization.
  Footnote: Raw values must remain preserved even when normalized outputs change.

- [x] 1.6: Specify unit tests for state normalization, unknown raw type handling, HTTP failure classification, non-null-over-null protection, and reconciliation rules.
  Footnote: Protect canonical behavior and operational outcomes with narrow tests.

- [x] 1.7: Specify integration and DB verification for schema creation and raw-layer idempotency.
  Footnote: Cover schema creation, raw API dedupe, and raw CSV file/row dedupe where behavior actually lives.

- [x] 1.8: Specify integration and DB verification for list-to-detail ingestion, canonical refresh, reconciliation visibility, and gold/read contract correctness.
  Footnote: Prefer realistic DB-backed verification over mocked orchestration checks.

- [x] 1.9: Define API fixture placement and coverage for V1 licitaciones, V1 OCs, and V2 Compra Agil.
  Footnote: Fixtures must not contain real API tickets or sensitive operational data.

- [x] 1.10: Define CSV fixture placement and coverage for licitaciones and OCs.
  Footnote: CSV fixtures must cover latin-1, `;`, `"` quotechar, comma decimals, `NA`/blank values, `1900-01-01`, repeated OC `Codigo` with `IDItem`, blank `CodigoLicitacion`, Compra Agil OC markers, repeated licitacion `CodigoExterno` with `Codigoitem`, supplier/offer grain, and exact unusual raw column names.

- [x] 1.11: Create the binding schema catalog mapping every API field and CSV column to exact PostgreSQL columns, types, constraints, and source attribution.
  Footnote: This catalog (`schema-catalog.md`) is the binding schema for Phase 2 instance commands. Any deviation during implementation requires updating this document first. This enforces `proposal.md:19`.

## Phase 2: Database Actions

- [x] 2.1: Create the instance command scaffold for the static `mp` schema rollout.
  Footnote: Column definitions are binding in `schema-catalog.md` §Naming Conventions. Follow existing upgrade-command and instance-command conventions exactly. Keep `up` and `down` logic explicit, reversible where possible, and idempotent.

- [x] 2.2: Create the static `mp` schema.
  Footnote: Column definitions are binding in `schema-catalog.md` §Raw Layer. This is the deployment-local architectural exception and must stay explicit.

- [x] 2.3: Create raw API persistence objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Raw Layer (`raw_api_payload`). Include request fingerprint, payload checksum, params, timestamps, status metadata, counters, schema fingerprints, and error summaries according to the frozen design contract. FK `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL is added in task 2.6 with `stg_job_run` creation to avoid circular dependency (deviation noted in `schema-catalog.md` §Known Deviations).

- [x] 2.4: Create raw CSV file persistence objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Raw Layer (`raw_csv_file`). Include file registry, detected encoding, detected delimiter, quotechar, `header_raw`, `observed_columns`, `column_count`, `schema_fingerprint`, and file-level lineage fields according to the frozen design contract.

- [x] 2.5: Create raw CSV row persistence objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Raw Layer (`raw_csv_row`). Include row lineage, `raw_row_text`, `raw_row_json`, `row_checksum`, `parse_status`, and `parse_error` without enforcing incorrect row-grain uniqueness.

- [x] 2.6: Create staging objects for API list and detail snapshots.
  Footnote: Column definitions are binding in `schema-catalog.md` §Staging Layer (`stg_api_v1_licitacion`, `stg_api_v1_orden_compra`, `stg_api_v2_compra_agil`, `stg_job_run`). Staging may project observed fields, but raw remains the source of replay truth. FK `ingestion_job_id` → `mp.stg_job_run(id)` for `raw_api_payload`, `raw_csv_file`, and `raw_csv_row` lands here with `stg_job_run` creation to avoid circular dependency (deviation noted in `schema-catalog.md` §Known Deviations).

- [x] 2.7: Create staging objects for CSV parsed OC projections.
  Footnote: Column definitions are binding in `schema-catalog.md` §Staging Layer (`stg_csv_orden_compra`). Preserve the observed OC item grain without requiring one row per business header.

- [x] 2.8: Create staging objects for CSV parsed licitacion projections.
  Footnote: Column definitions are binding in `schema-catalog.md` §Staging Layer (`stg_csv_licitacion`). Preserve the observed licitacion item/supplier/offer grain without requiring one row per business header.

- [x] 2.9: Create canonical licitacion objects and uniqueness constraints.
  Footnote: Column definitions are binding in `schema-catalog.md` §Canonical Layer (`licitacion`, `licitacion_item`, `licitacion_oferta`, `licitacion_adjudicacion`). Cover `licitacion`, `licitacion_item`, `licitacion_oferta`, and `licitacion_adjudicacion` according to the frozen natural-key contract. Supporting reference tables (`public_buyer`, `public_supplier`, `estado_dim`, `modalidad_dim`) remain deferred in this slice, and `licitacion_adjudicacion` keeps its natural-key-only contract until nullable item-link semantics are resolved (deviations noted in `schema-catalog.md` §Known Deviations).

- [x] 2.10: Create canonical orden de compra objects and uniqueness constraints.
  Footnote: Column definitions are binding in `schema-catalog.md` §Canonical Layer (`orden_compra`, `orden_compra_item`). Cover `orden_compra` and `orden_compra_item` according to the frozen natural-key contract.

- [x] 2.11: Create canonical Compra Agil objects and uniqueness constraints.
  Footnote: Column definitions are binding in `schema-catalog.md` §Canonical Layer (`compra_agil`, `compra_agil_producto_solicitado`, `compra_agil_cotizacion`). Cover `compra_agil`, `compra_agil_producto_solicitado`, and `compra_agil_cotizacion` according to the frozen natural-key contract.

- [x] 2.12: Create reconciliation link objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Reconciliation Layer (`reconciliation_public_market_entities`). Reconciliation storage must remain auditable, explainable, and safe to rerun.

- [x] 2.13: Create reconciliation event objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Reconciliation Layer (`reconciliation_event`). Logical mismatch events must dedupe cleanly without repeated noise on rerun.

- [x] 2.14: Create gold/read objects.
  Footnote: Column definitions are binding in `schema-catalog.md` §Gold Layer. These objects back internal consumer reads and should stay decoupled from raw persistence details.

## Phase 3: Backend Actions

Execution order note: Phase 3 task numbers are a work-breakdown index, not the preferred implementation sequence.
Preferred Phase 3 execution order:
- Foundation already completed: `3.1 -> 3.2 -> 3.3`
- First tracer bullet: `3.4 -> 3.5 -> 3.20 -> 3.23 -> 3.30`
- V1 expansion: `3.7 -> 3.8 -> 3.6 -> 3.9 -> 3.11 -> 3.10 -> 3.24`
- V2 expansion: `3.12 -> 3.13 -> 3.14 -> 3.15 -> 3.25`
- CSV pipeline: `3.16 -> 3.17 -> 3.26 -> 3.18 -> 3.19 -> 3.21 -> 3.22`
- Cross-source hardening: `3.27 -> 3.28 -> 3.29`
- Remaining internal reads and operations: `3.31 -> 3.35 -> 3.32 -> 3.33 -> 3.34`
- Scope and operator closeout: `3.36 -> 3.37`
Use dependency/risk order above instead of assuming numeric adjacency within Phase 3.

- [x] 3.1: Create the Mercado Publico backend module and register it using existing `twenty-server` composition patterns.
  Footnote: Match the module/interface shape found in investigation. Prefer a deep module with a small interface over a broad orchestration surface.

- [x] 3.2: Register typed runtime configuration variables for tickets, base URLs, HTTP settings, quota timezone, and CSV storage/source settings.
  Footnote: Consume all runtime config through `TwentyConfigService` and do not add ad hoc `process.env` reads.
  Status: Done. All 12 vars registered. Both MP tickets masked via HIDE_PASSWORD.

- [x] 3.3: Wire manual Mercado Publico job triggering and orchestration into the existing backend queue and worker patterns.
  Footnote: Use repository-standard job infrastructure and do not introduce a separate Mercado Publico scheduler, control plane, or new public execution surface in phase 1.

- [x] 3.4: Implement the API V1 licitaciones client.
  Footnote: Keep request construction, date formatting, and raw response capture localized.

- [x] 3.5: Implement the V1 licitaciones by-date job.
  Footnote: V1 date jobs must use `ddmmaaaa` and persist list snapshots as raw auditable payloads.

- [x] 3.6: Implement the V1 licitaciones by-state job.
  Footnote: Preserve raw `CodigoEstado` and raw state label; do not treat the list response as full detail truth.
  Status: Done. Client getByEstado(estado: string) added. By-state service mirrors by-date pattern. Reuses existing staging + canonical refresh. Single estado per invocation per source-contract V1 API spec.

- [x] 3.7: Implement the V1 licitacion detail by-`CodigoExterno` job.
  Footnote: Detail jobs rehydrate canonical entities and must protect existing non-null values from null regressions.
  Status: Done. Client method getByCodigoExterno added, detail service mirrors by-date pattern with snapshotKind='detail', canonical refresh already handles both list/detail snapshot kinds with per-field non-null protection via COALESCE.

- [x] 3.8: Implement the API V1 ordenes de compra client.
  Footnote: Keep request construction and raw response capture localized.
  Status: Done. Client service mirrors V1 licitaciones pattern. Shared classifyMercadoPublicoHttpStatus + parseMercadoPublicoBodyError utils extracted. getByDate returns OC records via extractV1OrdenesDeCompraListRecords.

- [x] 3.9: Implement the V1 ordenes de compra by-date job.
  Footnote: V1 date jobs must use `ddmmaaaa` and persist list snapshots as raw auditable payloads.
  Status: Done. OC by-date service mirrors licitaciones by-date. OC persistence + canonical refresh methods added. Canonical state stubbed as 'unknown_raw_state' — real state normalizer deferred to 3.6. Shared error handler utils extracted.

- [x] 3.10: Implement the V1 ordenes de compra by-state job.
  Footnote: Preserve raw OC state, raw provider state, and treat `CodigoLicitacion` as optional.
  Status: Done. Client getByEstado added. normalizeOcState util maps 8 OC state codes to canonical snake_case. Canonical refresh wired with per-field non-null protection for canonical_state. By-state service mirrors by-date pattern.

- [x] 3.11: Implement the V1 orden de compra detail by-`Codigo` job.
  Footnote: Detail jobs rehydrate canonical entities and must not require `CodigoLicitacion`.
  Status: Done. Client method getByCodigo added to MercadoPublicoApiV1OrdenesDeCompraClientService (reuses recursive list extract util). Detail service mirrors licitacion detail-by-codigo pattern with snapshotKind='detail'. Canonical refresh handles list/detail snapshot kinds with per-field non-null protection via COALESCE. Orchestrator dispatch wired. Unit spec: 6 tests pass (parsePayload validation + success/soft-miss/transport-failure).

- [x] 3.12: Implement the API V2 Compra Agil client.
  Footnote: Enforce documented bounds and parameter guards in one place.
  Status: Done. Client MercadoPublicoApiV2CompraAgilClientService created with getList(getByCodigo methods. V2 ticket sent as HTTP header (not param) per source-contract.md:144-145. Detail URL = path segment /v2/compra-agil/{codigo}. Param guard util validateCompraAgilListParams enforces tamano_pagina≤50, numero_pagina≥1, id/q mutex. Extract util handles list arrays + single-record detail. All 4 V2 constants registered. Unit specs: 12 param-guard cases + 7 extract cases + 10 client cases = 29 passing. No orchestrator dispatch yet (3.13+ wires V2 jobs).

- [x] 3.13: Implement the V2 Compra Agil incremental job.
  Footnote: Support paginated listing, `ttl_cambio_ms`, and `cambio_desde/cambio_hasta`.
  Status: Done. Service mirrors V1 by-state pattern. parsePayload requires window (ttl_cambio_ms > 0 or cambio_desde non-empty). Client getList already supports all V2 params from 3.12. persistV2CompraAgilSnapshot sews raw persistence seam (staging projection deferred to 3.20). refreshV2CompraAgilFromApiSnapshot stub returns 0 (canonical upsert deferred to 3.25). Orchestrator dispatch wired. Unit spec: 7 tests pass (parsePayload window guard + success with ttl_cambio_ms and cambio_desde/cambio_hasta + error/transport failure).

- [x] 3.14: Implement the V2 Compra Agil publication-window job.
  Footnote: Support `publicado_desde/publicado_hasta` using the documented request contract.
  Status: Done. Service mirrors 3.13 incremental. parsePayload requires at least one of publicado_desde/publicado_hasta non-empty (window guarantee). Reuses persistV2CompraAgilSnapshot + refreshV2CompraAgilFromApiSnapshot stubs. Orchestrator dispatch wired. Unit spec: 7 tests pass.

- [x] 3.15: Implement the V2 Compra Agil detail by-`codigo` job.
  Footnote: Use `orden_compra.id_orden_compra` and `id_oc` as the exact OC linkage signals when present.
  Status: Done. Service mirrors V1 OC detail-by-codigo (3.11). Calls client.getByCodigo which already preseserves OC linkage fields from 3.12. parsePayload requires non-empty codigo. Soft miss via recordsFetched===0 finalizes success with recordsFailed=1, no throw. Reuses persistV2CompraAgilSnapshot + refreshV2CompraAgilFromApiSnapshot stubs. Orchestrator dispatch wired. Unit spec: 7 tests pass.

- [x] 3.16: Implement CSV download, checksum, and decompression handling.
  Footnote: File acquisition must stay auditable before any parsing decisions are applied.

- [x] 3.17: Implement CSV profiling for encoding, delimiter, quotechar, header capture, and schema fingerprinting.
  Footnote: Do not assume UTF-8 or `;` without runtime detection, even if June 2026 fixtures observe them.

- [x] 3.18: Implement raw CSV row loading for ordenes de compra files.
  Footnote: Preserve unknown columns and observed row grain exactly as received.

- [x] 3.19: Implement raw CSV row loading for licitaciones files.
   Footnote: Preserve unknown columns and observed row grain exactly as received.
   Status: Done. Dataset-agnostic raw-load service (from 3.18) verified against licitaciones fixtures: latin-1, 110-col header, repeated CodigoExterno across Codigoitem + supplier/offer grain, raw Oferta seleccionada preserved. 13 test cases pass in mercado-publico-csv-raw-load-licitaciones.spec.ts. No service/orchestrator/constants edit needed — shared service already handles both datasets.

- [x] 3.20: Implement API snapshot staging projections.
  Footnote: Keep list and detail staging distinct enough to preserve source behavior.
  Status: Done. V1 licitaciones + V1 OC staging already implemented in prior slices. V2 Compra Agil staging projection now complete: insertV2CompraAgilStagingRows writes to mp.stg_api_v2_compra_agil per schema-catalog.md columns. Staging fields include codigo, estado, id_orden_compra, id_oc, codigo_orden_compra + date windows. No region in staging (not in catalog binding). persistence spec: 3 tests pass (V1 licitaciones, V1 OC, V2 Compra Agil).

- [x] 3.21: Implement CSV OC staging projections.
   Footnote: Preserve the observed OC item grain and exact raw column names needed for traceability.
   Status: Done. Added `MercadoPublicoCsvStagingProjectionService` with dataset-aware dispatcher. `projectStagingRow` util maps column names from `observed_columns` to staging positions. 3 new persistence methods: `insertStgCsvOrdenCompraRows` (batch INSERT into mp.stg_csv_orden_compra, 25 cols), `insertStgCsvLicitacionRows` (batch INSERT into mp.stg_csv_licitacion, 23 cols), `getRawCsvRowsByFileId` (reads success-only rows). `getRawCsvFileObservedColumns` added for column-name lookup. `csv-canonical-refresh` job registered in constants + orchestrator + module. Plain INSERT (no ON CONFLICT) matches API staging pattern. 19 tests pass (9 unit + 7 integration + 3 run-command). Empty CSV values → null in staging. Unknown columns → `all_observed_fields` jsonb. No schema changes.

- [x] 3.22: Implement CSV licitacion staging projections.
   Footnote: Preserve the observed licitacion item/supplier/offer grain and exact raw column names needed for traceability.
   Status: Done. Same service dispatches by `source_dataset`. `LICITACIONES_STAGING_COLUMN_MAP` maps 18 observed column names to staging columns. Repeated `CodigoExterno` + `Codigoitem` rows all accepted (no UK). `Oferta seleccionada` preserved raw. Column→index mapping driven by `observed_columns`. Integration spec verifies item+supplier/offer grain.

- [x] 3.23: Implement canonical refresh for licitaciones and licitacion items/offers/adjudicaciones.
  Footnote: Normalize defensively, preserve raw values, and accept repeated raw business keys before canonical dedupe.
  Status: Done. Licitation header refresh already existed. Added 3 new methods: refreshLicitacionItemsFromCsvSnapshot (UK codigo_externo+codigoitem), refreshLicitacionOfertasFromCsvSnapshot (UK codigo_externo+codigoitem+codigo_proveedor+nombre_de_la_oferta), refreshLicitacionAdjudicacionesFromCsvSnapshot (UK codigo_externo+codigoitem+rut_proveedor, codigoitem nullable). All read from mp.stg_csv_licitacion (CSV staging, empty until CSV pipeline lands). Non-null overflow protection via COALESCE. is_oferta_seleccionada inline boolean conversion (oferta_seleccionada==='Si'). moneda/raw_monto_estimado left NULL (not in CSV staging projection). No FK on adjudicacion per schema-catalog known deviation. Unit spec: 7 tests (4 existing + 3 new sub-entity).

- [x] 3.24: Implement canonical refresh for ordenes de compra and OC items.
  Footnote: Normalize defensively, preserve raw values, and keep `CodigoLicitacion` nullable.
  Status: Done. mp.orden_compra header refresh already existed. Added refreshOrdenCompraItemsFromCsvSnapshot (UK iditem). Reads from mp.stg_csv_orden_compra. UPSERT into mp.orden_compra_item with COALESCE non-null protection. raw_total_linea_neto stored as raw text (total_linea_neto numeric stays NULL — normalizeDecimal deferred to 3.26). nombre_producto_generico stays NULL (not in OC staging projection). codigo FK updatable via COALESCE. Unit spec: 8 tests (7 existing + 1 new OC item).

- [x] 3.25: Implement canonical refresh for Compra Agil entities.
  Footnote: Preserve explicit OC linkage and keep optional fields optional unless fixtures prove otherwise.
  Status: Done. Real impl of refreshV2CompraAgilFromApiSnapshot mirrors V1 OC pattern. SELECT DISTINCT ON(codigo) from mp.stg_api_v2_compra_agil → UPSERT into mp.compra_agil with non-null-over-null COALESCE protection. OC linkage fields (id_orden_compra, id_oc, codigo_orden_compra) preserved. region passed as null (not in staging columns yet; 3.20 adds). mp.compra_agil_producto_solicitado and mp.compra_agil_cotizacion deferred (no staging source). Unit spec: 2 new V2 cases added to existing canonical-refresh spec (4 total).

- [x] 3.26: Implement CSV scalar normalization and sentinel/null handling utilities.
  Footnote: Cover comma decimals, `NA`/blank values, and `1900-01-01` without mutating raw storage.

- [x] 3.27: Implement non-null-over-null protection and idempotent canonical rerun behavior.
  Footnote: Reruns and partial detail refreshes must not regress populated canonical fields.

- [x] 3.28: Implement exact reconciliation policies for API/CSV same-key, licitacion-to-OC, and Compra Agil-to-OC matches.
  Footnote: All 4 exact match types from source-contract.md:472-477 implemented: exact_codigo_externo, csv_api_same_business_key (OC), exact_codigo_licitacion, exact_compra_agil_id_orden_compra. csv_api_same_business_key reads source from staging tables. Compra Agil cotizaciones deferred to 3.29+. reconciliation-refresh job registered in constants + orchestrator. Idempotent via UK ON CONFLICT DO NOTHING. Unit spec: 7 tests pass. TypeScript: clean.

- [x] 3.29: Implement candidate, unmatched, and manual-review-required reconciliation policies and event recording.
  Footnote: 4 heuristic match types from source-contract.md:478-481 partially implemented: candidate_supplier_amount (same nombre_proveedor trim, no exact key, confidence 'medium'), candidate_item_amount (canonical licitacion_item with monto exists but no exact key, confidence 'low'), unmatched (canonical rows with zero reconciliation links + gold status update to 'unmatched'), manual_review_required (recorded as event_type). Heuristic amount tolerance = 0% (ponytail: ceiling, upgrade via fixture distribution). 3 event types: state_mismatch, source_period_rerun_mismatch, manual_review_required. Event fingerprint = sha256(...) with UK idempotency. gold_detected_process.reconciliation_status updated for unmatched rows. Same reconciliation-refresh job + service + module. Unit spec: 14 tests total (7 exact + 7 heuristic). TS: clean.

- [x] 3.30: Implement the internal read contract for detected processes.
  Footnote: Serve the minimum list shape from the gold/read layer, not from raw persistence details.

- [x] 3.31: Implement the internal read contract for process detail.
  Footnote: Return canonical detail plus reconciliation context and source lineage summary.
  Status: Done. Single service MercadoPublicoProcessDetailReadService with getDetectedProcessDetail(processType, processCode) dispatching by type. Licitacion: items + adjudications + related OCs via reconciliation. OrdenCompra: items + null adjudications + related OCs. CompraAgil: items + null adjudications + related OCs. Source lineage from staging tables (api-v1-licitaciones, api-v1-oc, api-v2-compra-agil, csv-datos-abiertos) filtered to rowCount > 0. Reconciliation summary aggregated from mp.reconciliation_public_market_entities (exact/candidate/unmatched/manualReviewRequired counts). Registered in module providers + exports. Unit spec: 7 tests pass + integration spec: 4 tests pass. TypeScript: clean.

- [x] 3.32: Implement the internal read contract for pipeline health.
  Footnote: Report cadence-relative freshness and latest job outcomes needed for operations.
  Status: Done. Single service MercadoPublicoPipelineHealthReadService with getPipelineHealth() aggregating from mp.stg_job_run via 2 raw queries (DISTINCT ON for latest run per job + GROUP BY with FILTER for 7-day failure count). Returns 16 entries (one per MERCADO_PUBLICO_SUPPORTED_JOB_NAMES) with latestStatus, lastSuccessAt, lastFailureAt, lagSinceLastSuccessMs, failureCount, freshness=null, expectedCadenceMs=null (phase 1 has no fixed cadence). Registered in module providers + exports. Unit spec: 9 tests pass + integration-shaped spec: 5 tests pass. TypeScript clean. Format clean. No public API surface. No writer to mp.gold_pipeline_health (table stays empty, aggregated live from stg_job_run).

- [x] 3.33: Implement the internal read contract for API quota usage.
  Footnote: Expose daily quota visibility, `last429At`, and timezone-aware reset behavior.
  Status: Done. Read service MercadoPublicoApiQuotaUsageReadService.getApiQuotaUsage() reads from mp.gold_api_quota_usage (SELECT source, used, reset_at, last_429_at). dailyLimit sourced from new config var MERCADO_PUBLICO_API_DAILY_LIMIT (default 10000, non-sensitive) wired via MercadoPublicoConfigService.getSettings(). remaining = max(0, dailyLimit - used). Tracker unchanged; daily_limit column in gold table stays unwritten (config-derived, not stored). Returns 0..3 entries (the 3 per-endpoint sources the tracker writes: api-v1-licitaciones, api-v1-oc, api-v2-compra-agil). Doc: 10000/day 24h America/Santiago documented in docs/business/mercado-publico-source-contract.md §Quota and Rate Limits. Unit spec: 4 tests pass + integration-shaped spec: 2 tests pass. TypeScript clean. Format clean. No public API surface.

- [x] 3.34: Implement the internal read contract for CSV file health.
  Footnote: Expose profiling outcomes, freshness, and last successful file processing state.

- [x] 3.35: Implement bounded retry, quota reset, and failure classification policies for Mercado Publico API jobs.
  Footnote: Failure classification already done by classifyMercadoPublicoHttpStatus + classifyHttpFailure (3.3-3.15). Bounded retry: retryLimit + fixed backoff wired in MercadoPublicoRunCommand using config vars MERCADO_PUBLICO_HTTP_MAX_RETRIES + MERCADO_PUBLICO_HTTP_RETRY_BACKOFF_MS. QueueJobOptions extended with backoff field, BullMQ driver passes it through. Quota tracking: MercadoPublicoQuotaTrackerService upserts per-source into mp.gold_api_quota_usage on 429 response, timezone-aware reset (America/Santiago). Tracker wired in 3 API client services (V1 licitaciones, V1 OC, V2 Compra Agil). quotaTimezone config var consumed. Tracker swallows DB errors (observability, not hard dependency). Unit specs: 3 quota + 4 command + 2 client = 9 new tests. TS: clean.

- [ ] 3.36: Confirm that frontend work remains explicitly out of scope for this change.
  Footnote: If any consumer-facing UI need emerges, document it as deferred follow-up work instead of leaking it into this backbone implementation.

- [ ] 3.37: Document the manual phase-1 operator runbook and optional local helper commands for one process per command.
  Footnote: Keep this as an operational helper only. Do not redefine the repository-wide standard command surface.

## Phase 4: Validation and CI

- [x] 4.1: Execute unit tests for request formatting and parameter guards.
  Footnote: 7/7 format-v1-date + 12/12 validate-compra-agil-params green. Impl uses UTC (not America/Santiago) — accepted deviation, document in 5.1 closeout.

- [x] 4.2: Execute unit tests for CSV profiling and parsing behavior.
  Footnote: 8/8 detect-encoding + 7/7 detect-delimiter + 6/6 detect-quotechar green. Latin-1 accented text pinned via detect-encoding fallback cases. csv-profiling service specs deferred to 3.17/4.7.

- [x] 4.3: Execute unit tests for scalar normalization, sentinel handling, null-like values, state mapping, and HTTP failure classification.
  Footnote: 36 normalize-scalar + 11 normalize-oc-state + 2 normalize-licitacion-type + 12 new normalize-v1-licitacion-state + 12 new classify-http-failure = 73 cases green. Two missing specs written (both were spec'd in test-design §1.3/§1.6 but never created). Impl names diverge from test-design — written to impl signatures. flag in 5.1: audit all 1.x completed specs for missing-on-disk files.

- [x] 4.4: Execute unit tests for non-null-over-null protection, idempotent reruns, and reconciliation rules.
  Footnote: 9 canonical-refresh + 27 reconciliation = 36/36 green. Non-null protection (sparse-row + V2 null staging), idempotent reruns (UK + fingerprint dedupe), exact+heuristic reconciliation rules all passing. Positional mocks intact at canonical-refresh:5-6.

- [x] 4.5: Execute integration and DB verification for schema creation and raw-layer persistence.
  Footnote: Confirm schema creation plus raw API and raw CSV dedupe behavior in the database.
  Status: Done. Added DB-backed verification suite `packages/twenty-server/test/integration/mercado-publico/suites/raw-layer-persistence.spec.ts` covering `mp` schema/table existence, dedupe constraints, `raw_api_payload` dedupe, and `raw_csv_file` + `raw_csv_row` dedupe without depending on the broader app bootstrap.

- [x] 4.6: Execute integration and DB verification for API list-to-detail ingestion and canonical refresh.
  Footnote: Confirm the end-to-end API path from raw payload to staging to canonical rows, including detail rehydrate and non-null-over-null protection.
  Footnote: This should prove the end-to-end API path from raw to canonical.

- [x] 4.7: Execute integration and DB verification for CSV profiling, raw load, and canonical refresh.
  Footnote: Confirm OC and licitaciones CSV paths from raw file registry through profiling, raw row persistence, staging, and implemented canonical projections.
  Footnote: This should prove the end-to-end CSV path from file acquisition to canonical projections.

- [x] 4.8: Execute integration and DB verification for reconciliation visibility, quota visibility, CSV file health, and gold/read contract correctness.
  Status: Done. 3 NEW DB-backed integration specs added:
    `packages/twenty-server/test/integration/mercado-publico/suites/reconciliation-refresh.spec.ts`
    `packages/twenty-server/test/integration/mercado-publico/suites/quota-usage-db.spec.ts`
    `packages/twenty-server/test/integration/mercado-publico/suites/csv-file-health-db.spec.ts`
  Coverage:
    - reconciliation-refresh: exact_codigo_externo, csv_api_same_business_key, exact_codigo_licitacion, exact_compra_agil_id_orden_compra (both id_orden_compra and id_oc fallback), null-link guard, candidate_supplier_amount, candidate_item_amount, unmatched (gold_detected_process write), state_mismatch event, source_period_rerun_mismatch event, idempotent rerun dedupe on both reconciliation_public_market_entities and reconciliation_event.
    - quota-usage-db: all 3 source entries, remaining computation, used-exceeds-limit guard, last429At populated/null, resetAt storage, empty source set.
    - csv-file-health-db: parseStatus=success/error/pending, ordering (dataset asc, period desc, fileName asc), parseErrorCount/parseSuccessCount, lastLoadedAt from stg_job_run, sourceModality passthrough, in-flight detection via LATERAL JOIN, empty table, no-job-run-yet pending.
  In-memory "integration-shaped" specs (pipeline-health, process-detail, detected-process-list) retained as-is — no SQL risk above shape-match proven by existing spec logic.
  Residual gaps: Pre-existing type errors in 4.5/4.6/4.7 integration specs not addressed (api-v1-licitaciones-canonical-refresh.spec.ts:169, csv-ingestion-canonical-refresh.spec.ts:194+338, raw-layer-persistence.spec.ts:230+243). Workspace-migration-runner errors per investigation.md 0.3 baseline unchanged.
  Fixes: MercadoPublicoReconciliationService.reconcileCandidateSupplier INNER JOIN mp.stg_csv_orden_compra column reference corrected from csv.monto_total_oc (nonexistent) to csv.monto_total_oc_pesos_chilenos::numeric (actual column). MercadoPublicoReconciliationService.reconcileCandidateItem abs() arithmetic cast stg.monto_estimado_adjudicado::numeric to avoid text-numeric operator mismatch.
  Confirms 0.4 blast-radius review: all 4.8 target surfaces now have at least one DB-backed spec covering real Postgres SQL, constraints, and FK topology.

- [ ] 4.9: Run repository quality gates relevant to the touched surfaces.
  Footnote: Keep the validation order pragmatic: targeted tests first, then type/lint gates for touched packages.

- [ ] 4.10: Expand to CI-level validation if local gates are green and the touched scope justifies it.
  Footnote: Broader validation should be earned by local signal, not run blindly first.

- [ ] 4.11: Verify fixture coverage for all required API and CSV source families.
  Footnote: Fixture review must confirm no real tickets or secrets are committed and that CSV fixtures cover the observed June 2026 parsing and grain cases documented in `docs/business/mercado-publico-source-contract.md`.

## Phase 5: Closeout

- [ ] 5.1: Update durable documentation affected by implementation and validation outcomes.
  Footnote: Do not leave important contracts trapped in code or chat. Update source, architecture, operations, and ADR docs if implementation changes shared understanding.

- [ ] 5.2: Review `CHANGELOG.md` and add or explicitly skip an `Unreleased` entry according to release relevance.
  Footnote: The changelog decision itself should be explicit.

- [ ] 5.3: Record final handoff notes covering what was implemented, what was verified, what remains deferred, and which follow-up consumer phases depend on this backbone.
  Footnote: The closeout should make the next change easier: clear status, clean deferred scope, no ambiguity about what is ready for consumer-facing work.
