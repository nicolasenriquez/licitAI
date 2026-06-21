# Tasks: mercado-publico-ingestion-backbone

## Phase 0: Investigation Only

- [ ] 0.1: Prime the codebase and read the relevant repository context for `twenty-server`, database commands, upgrade commands, message queue patterns, secure HTTP patterns, config/secret handling, CSV/file handling patterns, `docs/business/mercado-publico-source-contract.md`, `docs/business/mercado-publico-ingestion-context.md`, and docs/standards relevant to backend and data work.
  Footnote: This phase is intentionally non-implementing. Understand structure, entry points, current state, domain rules, and recent patterns before proposing code shape.

- [ ] 0.2: Inventory existing module, interface, adapter, migration, queue, config, secure HTTP, file-storage, and fixture patterns already used in `twenty-server`.
  Footnote: Focus on depth, leverage, locality, and deletion-test thinking so the planned backbone deepens the codebase instead of adding shallow pass-through modules.

- [ ] 0.3: Verify the untouched baseline using the smallest relevant repository quality gates and record any pre-existing failures.
  Footnote: The implementation phase should start from a documented baseline, not from assumptions about repo health.

- [ ] 0.4: Review blast radius and regression checks for static `mp` schema creation, instance commands, API ingestion jobs, CSV ingestion jobs, read contracts, quota handling, and secret handling.
  Footnote: The deliverable is an explicit review of files, flows, migrations, tests, runtime behaviors, and validation checks that prove the change is safe.

- [ ] 0.5: Produce a minimal, surgical implementation plan mapped to repository patterns rather than invented structure.
  Footnote: The plan must satisfy the full source contract while preserving current tenancy, queue, config, upgrade conventions, and the explicit `mp` architectural exception. Freeze runtime config variables, cadence defaults, recent-state boundary, and CSV re-download conflict policy before implementation starts.

## Phase 1: TDD and Test Design

- [ ] 1.1: Define the tracer-bullet implementation path and order the remaining slices by risk.
  Footnote: Start with the smallest vertical slice that proves schema creation, one ingestion path, and one read path end to end.

- [ ] 1.2: Define the public test surface for backend modules and internal read contracts.
  Footnote: Tests should verify behavior through public interfaces, persisted rows, job outcomes, and read contracts rather than private collaborator calls. Phase-1 read contracts stay internal backend services, not new public APIs.

- [ ] 1.3: Specify unit tests for V1 `ddmmaaaa` date formatting and V2 Compra Agil parameter guards.
  Footnote: Keep request-shape tests deterministic and small.

- [ ] 1.4: Specify unit tests for CSV encoding detection, delimiter detection, quotechar detection, and latin-1 accented text parsing.
  Footnote: These tests should pin the observed June 2026 CSV parsing behavior.

- [ ] 1.5: Specify unit tests for comma decimal parsing, `1900-01-01` sentinel handling, and null-like value normalization.
  Footnote: Raw values must remain preserved even when normalized outputs change.

- [ ] 1.6: Specify unit tests for state normalization, unknown raw type handling, HTTP failure classification, non-null-over-null protection, and reconciliation rules.
  Footnote: Protect canonical behavior and operational outcomes with narrow tests.

- [ ] 1.7: Specify integration and DB verification for schema creation and raw-layer idempotency.
  Footnote: Cover schema creation, raw API dedupe, and raw CSV file/row dedupe where behavior actually lives.

- [ ] 1.8: Specify integration and DB verification for list-to-detail ingestion, canonical refresh, reconciliation visibility, and gold/read contract correctness.
  Footnote: Prefer realistic DB-backed verification over mocked orchestration checks.

- [ ] 1.9: Define API fixture placement and coverage for V1 licitaciones, V1 OCs, and V2 Compra Agil.
  Footnote: Fixtures must not contain real API tickets or sensitive operational data.

- [ ] 1.10: Define CSV fixture placement and coverage for licitaciones and OCs.
  Footnote: CSV fixtures must cover latin-1, `;`, `"` quotechar, comma decimals, `NA`/blank values, `1900-01-01`, repeated OC `Codigo` with `IDItem`, blank `CodigoLicitacion`, Compra Agil OC markers, repeated licitacion `CodigoExterno` with `Codigoitem`, supplier/offer grain, and exact unusual raw column names.

## Phase 2: Database Actions

- [ ] 2.1: Create the instance command scaffold for the static `mp` schema rollout.
  Footnote: Follow existing upgrade-command and instance-command conventions exactly. Keep `up` and `down` logic explicit, reversible where possible, and idempotent.

- [ ] 2.2: Create the static `mp` schema.
  Footnote: This is the deployment-local architectural exception and must stay explicit.

- [ ] 2.3: Create raw API persistence objects.
  Footnote: Include request fingerprint, payload checksum, params, timestamps, status metadata, counters, schema fingerprints, and error summaries according to the frozen design contract.

- [ ] 2.4: Create raw CSV file persistence objects.
  Footnote: Include file registry, detected encoding, detected delimiter, quotechar, `header_raw`, `observed_columns`, `column_count`, `schema_fingerprint`, and file-level lineage fields according to the frozen design contract.

- [ ] 2.5: Create raw CSV row persistence objects.
  Footnote: Include row lineage, `raw_row_text`, `raw_row_json`, `row_checksum`, `parse_status`, and `parse_error` without enforcing incorrect row-grain uniqueness.

- [ ] 2.6: Create staging objects for API list and detail snapshots.
  Footnote: Staging may project observed fields, but raw remains the source of replay truth.

- [ ] 2.7: Create staging objects for CSV parsed OC projections.
  Footnote: Preserve the observed OC item grain without requiring one row per business header.

- [ ] 2.8: Create staging objects for CSV parsed licitacion projections.
  Footnote: Preserve the observed licitacion item/supplier/offer grain without requiring one row per business header.

- [ ] 2.9: Create canonical licitacion objects and uniqueness constraints.
  Footnote: Cover `licitacion`, `licitacion_item`, `licitacion_oferta`, and `licitacion_adjudicacion` according to the frozen natural-key contract.

- [ ] 2.10: Create canonical orden de compra objects and uniqueness constraints.
  Footnote: Cover `orden_compra` and `orden_compra_item` according to the frozen natural-key contract.

- [ ] 2.11: Create canonical Compra Agil objects and uniqueness constraints.
  Footnote: Cover `compra_agil`, `compra_agil_producto_solicitado`, and `compra_agil_cotizacion` according to the frozen natural-key contract.

- [ ] 2.12: Create reconciliation link objects.
  Footnote: Reconciliation storage must remain auditable, explainable, and safe to rerun.

- [ ] 2.13: Create reconciliation event objects.
  Footnote: Logical mismatch events must dedupe cleanly without repeated noise on rerun.

- [ ] 2.14: Create gold/read objects.
  Footnote: These objects back internal consumer reads and should stay decoupled from raw persistence details.

## Phase 3: Backend Actions

- [ ] 3.1: Create the Mercado Publico backend module and register it using existing `twenty-server` composition patterns.
  Footnote: Match the module/interface shape found in investigation. Prefer a deep module with a small interface over a broad orchestration surface.

- [ ] 3.2: Register typed runtime configuration variables for tickets, base URLs, HTTP settings, quota timezone, and CSV storage/source settings.
  Footnote: Consume all runtime config through `TwentyConfigService` and do not add ad hoc `process.env` reads.

- [ ] 3.3: Wire Mercado Publico job execution into the existing backend queue and worker patterns.
  Footnote: Use repository-standard job infrastructure and do not introduce a separate Mercado Publico scheduler or control plane.

- [ ] 3.4: Implement the API V1 licitaciones client.
  Footnote: Keep request construction, date formatting, and raw response capture localized.

- [ ] 3.5: Implement the V1 licitaciones by-date job.
  Footnote: V1 date jobs must use `ddmmaaaa` and persist list snapshots as raw auditable payloads.

- [ ] 3.6: Implement the V1 licitaciones by-state job.
  Footnote: Preserve raw `CodigoEstado` and raw state label; do not treat the list response as full detail truth.

- [ ] 3.7: Implement the V1 licitacion detail by-`CodigoExterno` job.
  Footnote: Detail jobs rehydrate canonical entities and must protect existing non-null values from null regressions.

- [ ] 3.8: Implement the API V1 ordenes de compra client.
  Footnote: Keep request construction and raw response capture localized.

- [ ] 3.9: Implement the V1 ordenes de compra by-date job.
  Footnote: V1 date jobs must use `ddmmaaaa` and persist list snapshots as raw auditable payloads.

- [ ] 3.10: Implement the V1 ordenes de compra by-state job.
  Footnote: Preserve raw OC state, raw provider state, and treat `CodigoLicitacion` as optional.

- [ ] 3.11: Implement the V1 orden de compra detail by-`Codigo` job.
  Footnote: Detail jobs rehydrate canonical entities and must not require `CodigoLicitacion`.

- [ ] 3.12: Implement the API V2 Compra Agil client.
  Footnote: Enforce documented bounds and parameter guards in one place.

- [ ] 3.13: Implement the V2 Compra Agil incremental job.
  Footnote: Support paginated listing, `ttl_cambio_ms`, and `cambio_desde/cambio_hasta`.

- [ ] 3.14: Implement the V2 Compra Agil publication-window job.
  Footnote: Support `publicado_desde/publicado_hasta` using the documented request contract.

- [ ] 3.15: Implement the V2 Compra Agil detail by-`codigo` job.
  Footnote: Use `orden_compra.id_orden_compra` and `id_oc` as the exact OC linkage signals when present.

- [ ] 3.16: Implement CSV download, checksum, and decompression handling.
  Footnote: File acquisition must stay auditable before any parsing decisions are applied.

- [ ] 3.17: Implement CSV profiling for encoding, delimiter, quotechar, header capture, and schema fingerprinting.
  Footnote: Do not assume UTF-8 or `;` without runtime detection, even if June 2026 fixtures observe them.

- [ ] 3.18: Implement raw CSV row loading for ordenes de compra files.
  Footnote: Preserve unknown columns and observed row grain exactly as received.

- [ ] 3.19: Implement raw CSV row loading for licitaciones files.
  Footnote: Preserve unknown columns and observed row grain exactly as received.

- [ ] 3.20: Implement API snapshot staging projections.
  Footnote: Keep list and detail staging distinct enough to preserve source behavior.

- [ ] 3.21: Implement CSV OC staging projections.
  Footnote: Preserve the observed OC item grain and exact raw column names needed for traceability.

- [ ] 3.22: Implement CSV licitacion staging projections.
  Footnote: Preserve the observed licitacion item/supplier/offer grain and exact raw column names needed for traceability.

- [ ] 3.23: Implement canonical refresh for licitaciones and licitacion items/offers/adjudicaciones.
  Footnote: Normalize defensively, preserve raw values, and accept repeated raw business keys before canonical dedupe.

- [ ] 3.24: Implement canonical refresh for ordenes de compra and OC items.
  Footnote: Normalize defensively, preserve raw values, and keep `CodigoLicitacion` nullable.

- [ ] 3.25: Implement canonical refresh for Compra Agil entities.
  Footnote: Preserve explicit OC linkage and keep optional fields optional unless fixtures prove otherwise.

- [ ] 3.26: Implement CSV scalar normalization and sentinel/null handling utilities.
  Footnote: Cover comma decimals, `NA`/blank values, and `1900-01-01` without mutating raw storage.

- [ ] 3.27: Implement non-null-over-null protection and idempotent canonical rerun behavior.
  Footnote: Reruns and partial detail refreshes must not regress populated canonical fields.

- [ ] 3.28: Implement exact reconciliation policies for API/CSV same-key, licitacion-to-OC, and Compra Agil-to-OC matches.
  Footnote: Exact links must remain explicit and auditable.

- [ ] 3.29: Implement candidate, unmatched, and manual-review-required reconciliation policies and event recording.
  Footnote: Heuristic matches must not silently become exact truth.

- [ ] 3.30: Implement the internal read contract for detected processes.
  Footnote: Serve the minimum list shape from the gold/read layer, not from raw persistence details.

- [ ] 3.31: Implement the internal read contract for process detail.
  Footnote: Return canonical detail plus reconciliation context and source lineage summary.

- [ ] 3.32: Implement the internal read contract for pipeline health.
  Footnote: Report cadence-relative freshness and latest job outcomes needed for operations.

- [ ] 3.33: Implement the internal read contract for API quota usage.
  Footnote: Expose daily quota visibility, `last429At`, and timezone-aware reset behavior.

- [ ] 3.34: Implement the internal read contract for CSV file health.
  Footnote: Expose profiling outcomes, freshness, and last successful file processing state.

- [ ] 3.35: Implement bounded retry, quota reset, and failure classification policies for Mercado Publico API jobs.
  Footnote: Hard-fail auth errors, audit soft misses, record parameter failures, and bound transient retries without infinite loops.

- [ ] 3.36: Confirm that frontend work remains explicitly out of scope for this change.
  Footnote: If any consumer-facing UI need emerges, document it as deferred follow-up work instead of leaking it into this backbone implementation.

## Phase 4: Validation and CI

- [ ] 4.1: Execute unit tests for request formatting and parameter guards.
  Footnote: Cover V1 `ddmmaaaa` formatting and V2 parameter-boundary behavior first.

- [ ] 4.2: Execute unit tests for CSV profiling and parsing behavior.
  Footnote: Cover encoding, delimiter, quotechar, and latin-1 accented text handling.

- [ ] 4.3: Execute unit tests for scalar normalization, sentinel handling, null-like values, state mapping, and HTTP failure classification.
  Footnote: Validation should prove behavior, not just compile shape.

- [ ] 4.4: Execute unit tests for non-null-over-null protection, idempotent reruns, and reconciliation rules.
  Footnote: These tests protect the highest-regression canonical rules.

- [ ] 4.5: Execute integration and DB verification for schema creation and raw-layer persistence.
  Footnote: Confirm schema creation plus raw API and raw CSV dedupe behavior in the database.

- [ ] 4.6: Execute integration and DB verification for API list-to-detail ingestion and canonical refresh.
  Footnote: This should prove the end-to-end API path from raw to canonical.

- [ ] 4.7: Execute integration and DB verification for CSV profiling, raw load, and canonical refresh.
  Footnote: This should prove the end-to-end CSV path from file acquisition to canonical projections.

- [ ] 4.8: Execute integration and DB verification for reconciliation visibility, quota visibility, CSV file health, and gold/read contract correctness.
  Footnote: This is where the earlier blast-radius review is confirmed or falsified. Any missing regression check should be documented explicitly.

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
