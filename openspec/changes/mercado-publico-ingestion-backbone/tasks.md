# Tasks: mercado-publico-ingestion-backbone

## Phase 0: Investigation Only

- [ ] 0.1: Prime the codebase and read the relevant repository context for `twenty-server`, database commands, upgrade commands, message queue patterns, secure HTTP patterns, `docs/business/mercado-publico-ingestion-context.md`, and docs/standards relevant to backend and data work.
  Footnote: This phase is intentionally non-implementing. Follow the spirit of `.codex/commands/prime.md`: understand structure, entry points, current state, domain rules, and recent patterns before proposing any code seam or module shape.

- [ ] 0.2: Inventory existing module, interface, seam, adapter, migration, and queue patterns already used in `twenty-server`.
  Footnote: Use the architecture vocabulary from `.codex/commands/improve-codebase-architecture`. Focus on depth, leverage, locality, and deletion-test thinking so the planned backbone deepens the codebase instead of adding shallow pass-through modules.

- [ ] 0.3: Review blast radius and regression seams for schema creation, instance commands, ingestion jobs, read contracts, and secret handling.
  Footnote: The deliverable here is an explicit blast-radius review: what files, flows, migrations, tests, and runtime behaviors can regress; what stays out of scope; and what validation seams will prove the change is safe.

- [ ] 0.4: Produce a minimal, surgical implementation plan mapped to repository patterns rather than invented structure.
  Footnote: The plan should identify the smallest professional change set that can satisfy the backbone requirements while preserving current tenancy, queue, config, upgrade conventions, and the explicit `mp` architectural exception.

## Phase 1: TDD and Test Design

- [ ] 1.1: Convert the backbone requirements into behavior-oriented test slices ordered by implementation risk.
  Footnote: Follow `.codex/commands/tdd/SKILL.md`: do not batch all tests up front as a horizontal slice. Identify the vertical tracer-bullet path and the subsequent red-green-refactor sequence.

- [ ] 1.2: Define the public test surface for the backbone modules and internal read contracts.
  Footnote: Tests should verify behavior through public interfaces and observable outcomes, not internal collaborator calls. Use `.codex/commands/tdd/tests.md` and `.codex/commands/tdd/interface-design.md` as the standard.

- [ ] 1.3: Specify the minimum unit tests for date parsing, state normalization, incremental Compra Agil windows, HTTP failure classification, non-null-over-null protection, and reconciliation rules.
  Footnote: Keep these tests focused on deterministic behavior with small setup and no unnecessary mocking of internal logic.

- [ ] 1.4: Specify the minimum integration and DB verification seams for list-to-detail ingestion, rerun idempotency, 429 retry behavior, schema constraints, and gold/read contract correctness.
  Footnote: Prefer realistic integration seams and DB-backed verification where behavior actually lives. Only introduce adapters or mocks when the seam is real and justified.

## Phase 2: Database Actions

- [ ] 2.1: Create instance command(s) for the static `mp` schema and all raw, staging, canonical, reconciliation, and gold/read objects.
  Footnote: Follow existing upgrade-command and instance-command conventions exactly. Keep `up` and `down` logic professional, explicit, and consistent with repository migration discipline.

- [ ] 2.2: Define raw and staging persistence contracts for API payloads, CSV registry objects, row lineage, and job execution traces.
  Footnote: This layer exists for auditability and replay safety. The schema must preserve request fingerprints, payload checksums, params, timestamps, record counters, and error summaries. This phase does not implement CSV download, decompression, or parsing execution.

- [ ] 2.3: Define canonical entities, natural-key uniqueness, and state preservation rules.
  Footnote: Preserve both canonical and raw state information. Protect existing non-null canonical values from null regressions on rerun or partial-detail refresh.

- [ ] 2.4: Define reconciliation storage and event recording for exact, candidate, unmatched, and manual-review-required states.
  Footnote: Reconciliation must remain auditable, explainable, and safe to rerun without duplicating canonical links or event noise.

## Phase 3: Backend Actions

- [ ] 3.1: Create the Mercado Publico backend module and register it using existing `twenty-server` composition patterns.
  Footnote: Match the established module/interface shape found in the investigation phase. Prefer a deep module with a small interface over a broad orchestration surface.

- [ ] 3.2: Implement normalization and ingestion policies for list snapshots, detail rehydrate, source attribution, and idempotent reruns.
  Footnote: Keep the implementation localized behind the module seam so callers learn little while getting strong behavior leverage.

- [ ] 3.3: Implement internal read contracts for detected processes, process detail, pipeline health, and quota usage.
  Footnote: These contracts are the main downstream interface and should remain stable, testable, and decoupled from raw/staging persistence details.

- [ ] 3.4: Implement bounded retry, quota reset, and failure classification policies for Mercado Publico jobs.
  Footnote: Secret handling, retry policy, and quota logic must follow fail-fast principles: hard-fail auth errors, audit soft misses, and bound transient retries without infinite loops. The minimum job surface in this phase excludes date-based V1 sweep jobs.

- [ ] 3.5: Confirm that frontend work remains explicitly out of scope for this change.
  Footnote: If any consumer-facing UI need emerges, document it as deferred follow-up work instead of leaking it into this backbone implementation.

## Phase 4: Validation and CI

- [ ] 4.1: Execute the unit tests defined in Phase 1 and confirm the red-green path is complete.
  Footnote: Run the smallest relevant gate first. Validation should prove behavior, not just compile shape.

- [ ] 4.2: Execute integration and DB verification for ingestion flow, idempotency, reconciliation visibility, and gold/read contract correctness.
  Footnote: This is where the earlier blast-radius review is confirmed or falsified. Any missing regression seam should be documented explicitly.

- [ ] 4.3: Run repository quality gates relevant to the touched surfaces, and expand to CI-level validation if the local gates are green.
  Footnote: Keep the validation order pragmatic: targeted tests first, then type/lint gates, then broader CI execution when justified by change scope and repo conventions.

## Phase 5: Closeout

- [ ] 5.1: Update durable documentation affected by the implementation and validation outcomes.
  Footnote: Do not leave important contracts trapped in code or chat. If the backbone changes shared understanding, update the relevant docs, including `docs/business/mercado-publico-ingestion-context.md`, as part of the same delivery.

- [ ] 5.2: Review `CHANGELOG.md` and add or explicitly skip an `Unreleased` entry according to release relevance.
  Footnote: The changelog decision itself should be explicit, even if the conclusion is that this internal backbone phase does not yet need a release-facing entry.

- [ ] 5.3: Record final handoff notes covering what was implemented, what was verified, what remains deferred, and which follow-up consumer phases depend on this backbone.
  Footnote: The closeout should make the next change easier: clear status, clean deferred scope, no ambiguity about what is ready for consumer-facing work.
