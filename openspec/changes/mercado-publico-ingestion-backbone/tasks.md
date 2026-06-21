# Tasks: mercado-publico-ingestion-backbone

## Phase 0: Investigation Only

- [ ] 0.1: Prime the codebase and read the relevant repository context for `twenty-server`, database commands, upgrade commands, message queue patterns, secure HTTP patterns, config/secret handling, CSV/file handling patterns, `docs/business/mercado-publico-source-contract.md`, `docs/business/mercado-publico-ingestion-context.md`, and docs/standards relevant to backend and data work.
  Footnote: This phase is intentionally non-implementing. Understand structure, entry points, current state, domain rules, and recent patterns before proposing code shape.

- [ ] 0.2: Inventory existing module, interface, adapter, migration, queue, config, secure HTTP, file-storage, and fixture patterns already used in `twenty-server`.
  Footnote: Focus on depth, leverage, locality, and deletion-test thinking so the planned backbone deepens the codebase instead of adding shallow pass-through modules.

- [ ] 0.3: Review blast radius and regression checks for static `mp` schema creation, instance commands, API ingestion jobs, CSV ingestion jobs, read contracts, quota handling, and secret handling.
  Footnote: The deliverable is an explicit review of files, flows, migrations, tests, runtime behaviors, and validation checks that prove the change is safe.

- [ ] 0.4: Produce a minimal, surgical implementation plan mapped to repository patterns rather than invented structure.
  Footnote: The plan must satisfy the full source contract while preserving current tenancy, queue, config, upgrade conventions, and the explicit `mp` architectural exception.

## Phase 1: TDD and Test Design

- [ ] 1.1: Convert the backbone requirements into behavior-oriented test slices ordered by implementation risk.
  Footnote: Identify the vertical tracer-bullet path and the subsequent red-green-refactor sequence.

- [ ] 1.2: Define the public test surface for the backbone modules and internal read contracts.
  Footnote: Tests should verify behavior through public interfaces, persisted rows, job outcomes, and read contracts rather than private collaborator calls.

- [ ] 1.3: Specify minimum unit tests for V1 `ddmmaaaa` date formatting, V2 Compra Agil parameter guards, state normalization, CSV delimiter detection, CSV encoding detection, CSV quotechar detection, latin-1 accented text, comma decimal parsing, `1900-01-01` sentinel handling, null-like value handling, HTTP failure classification, non-null-over-null protection, and reconciliation rules.
  Footnote: Keep deterministic tests focused and small.

- [ ] 1.4: Specify minimum integration and DB verification for schema creation, list-to-detail ingestion, API rerun idempotency, CSV file/row idempotency, 429 retry behavior, schema constraints, reconciliation visibility, and gold/read contract correctness.
  Footnote: Prefer realistic integration checks and DB-backed verification where behavior actually lives.

- [ ] 1.5: Define fixture placement and fixture coverage for API V1 licitaciones, API V1 OCs, API V2 Compra Agil, CSV licitaciones, and CSV OCs.
  Footnote: Fixtures must not contain real API tickets or sensitive operational data. CSV fixtures must cover latin-1, `;`, `"` quotechar, comma decimals, `NA`/blank values, `1900-01-01`, repeated OC `Codigo` with `IDItem`, blank `CodigoLicitacion`, Compra Agil OC markers, repeated licitacion `CodigoExterno` with `Codigoitem`, supplier/offer grain, and exact unusual raw column names.

## Phase 2: Database Actions

- [ ] 2.1: Create instance command(s) for the static `mp` schema and all raw, staging, canonical, reconciliation, and gold/read objects.
  Footnote: Follow existing upgrade-command and instance-command conventions exactly. Keep `up` and `down` logic explicit, reversible where possible, and idempotent.

- [ ] 2.2: Define raw API persistence contracts for payloads, request fingerprints, checksums, params, timestamps, status metadata, counters, schema fingerprints, and error summaries.
  Footnote: Raw API persistence exists for auditability and replay safety.

- [ ] 2.3: Define raw CSV persistence contracts for file registry, row lineage, detected encoding, detected delimiter, quotechar, `header_raw`, `observed_columns`, `column_count`, `schema_fingerprint`, `raw_row_text`, `raw_row_json`, `row_checksum`, `parse_status`, and `parse_error`.
  Footnote: CSV raw storage must preserve unknown columns and must not enforce incorrect uniqueness at row grain.

- [ ] 2.4: Define staging objects for API list/detail snapshots and CSV parsed projections.
  Footnote: Staging may project observed fields, but raw remains the source of replay truth. CSV staging must preserve the observed OC item grain and licitacion item/supplier/offer grain without requiring one row per business entity.

- [ ] 2.5: Define canonical entities, natural-key uniqueness, canonical state mapping, unknown raw type handling, CSV scalar normalization, sentinel-date handling, and non-null preservation rules.
  Footnote: Preserve both canonical and raw state information. Protect existing non-null canonical values from null regressions on rerun or partial-detail refresh. CSV canonical mapping must retain raw values while normalizing validated comma decimals, null-like values, and `1900-01-01` sentinels defensively.

- [ ] 2.6: Define reconciliation storage and event recording for exact, candidate, unmatched, and manual-review-required states.
  Footnote: Reconciliation must remain auditable, explainable, and safe to rerun without duplicating canonical links or event noise.

## Phase 3: Backend Actions

- [ ] 3.1: Create the Mercado Publico backend module and register it using existing `twenty-server` composition patterns.
  Footnote: Match the module/interface shape found in investigation. Prefer a deep module with a small interface over a broad orchestration surface.

- [ ] 3.2: Implement API V1 clients and jobs for licitaciones by date, licitaciones by state, licitacion detail by `CodigoExterno`, OCs by date, OCs by state, and OC detail by `Codigo`.
  Footnote: V1 date jobs must use `ddmmaaaa`; list jobs store snapshots; detail jobs rehydrate canonical entities.

- [ ] 3.3: Implement API V2 Compra Agil clients and jobs for paginated listing, `ttl_cambio_ms`, `cambio_desde/cambio_hasta`, `publicado_desde/publicado_hasta`, and detail by `codigo`.
  Footnote: Enforce `tamano_pagina <= 50`, `numero_pagina >= 1`, and mutual exclusion of `id` and `q`.

- [ ] 3.4: Implement CSV download, checksum, decompression when needed, encoding detection, delimiter detection, quotechar detection, header capture, raw row preservation, and schema fingerprinting for licitaciones and OCs.
  Footnote: Do not discard unknown columns. Do not infer official CSV types from partial UI-visible columns. Support observed June 2026 latin-1, `;`, `"` quotechar, comma decimals, null-like raw values, and `1900-01-01` sentinel dates.

- [ ] 3.5: Implement normalization and ingestion policies for list snapshots, detail rehydrate, CSV validated-field mapping, CSV observed grain, source attribution, unknown raw types, and idempotent reruns.
  Footnote: Keep implementation localized behind the module interface. CSV policies must not enforce uniqueness on raw OC `Codigo` or raw licitacion `CodigoExterno`; dedupe canonical headers/items/offers only after row-grain analysis.

- [ ] 3.6: Implement reconciliation policies for API/CSV same-key matches, licitacion-to-OC exact matches, Compra Agil-to-OC exact matches, candidate matches, unmatched records, and manual-review-required events.
  Footnote: Heuristic matches must not silently become exact truth.

- [ ] 3.7: Implement internal read contracts for detected processes, process detail, pipeline health, API quota usage, and CSV file health.
  Footnote: These contracts are the downstream interface and should stay decoupled from raw/staging persistence details.

- [ ] 3.8: Implement bounded retry, quota reset, and failure classification policies for Mercado Publico API jobs.
  Footnote: Hard-fail auth errors, audit soft misses, record parameter failures, and bound transient retries without infinite loops.

- [ ] 3.9: Confirm that frontend work remains explicitly out of scope for this change.
  Footnote: If any consumer-facing UI need emerges, document it as deferred follow-up work instead of leaking it into this backbone implementation.

## Phase 4: Validation and CI

- [ ] 4.1: Execute the unit tests defined in Phase 1 and confirm the red-green path is complete.
  Footnote: Run the smallest relevant gate first. Validation should prove behavior, not just compile shape.

- [ ] 4.2: Execute integration and DB verification for schema creation, API ingestion flow, CSV ingestion flow, idempotency, reconciliation visibility, quota visibility, CSV file health, and gold/read contract correctness.
  Footnote: This is where the earlier blast-radius review is confirmed or falsified. Any missing regression check should be documented explicitly.

- [ ] 4.3: Run repository quality gates relevant to the touched surfaces, and expand to CI-level validation if local gates are green.
  Footnote: Keep the validation order pragmatic: targeted tests first, then type/lint gates, then broader CI execution when justified by change scope and repo conventions.

- [ ] 4.4: Verify fixture coverage for all required API and CSV source families.
  Footnote: Fixture review must confirm no real tickets or secrets are committed and that CSV fixtures cover the observed June 2026 parsing and grain cases documented in `docs/business/mercado-publico-source-contract.md`.

## Phase 5: Closeout

- [ ] 5.1: Update durable documentation affected by implementation and validation outcomes.
  Footnote: Do not leave important contracts trapped in code or chat. Update source, architecture, operations, and ADR docs if implementation changes shared understanding.

- [ ] 5.2: Review `CHANGELOG.md` and add or explicitly skip an `Unreleased` entry according to release relevance.
  Footnote: The changelog decision itself should be explicit.

- [ ] 5.3: Record final handoff notes covering what was implemented, what was verified, what remains deferred, and which follow-up consumer phases depend on this backbone.
  Footnote: The closeout should make the next change easier: clear status, clean deferred scope, no ambiguity about what is ready for consumer-facing work.
