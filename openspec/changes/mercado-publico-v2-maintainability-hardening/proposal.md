## Why

The Mercado Publico V2 backend architecture is correct, but its workload is
concentrated: `MercadoPublicoV2DurableSyncService` mixes orchestration,
discovery, hydration, fixture, retry, and raw SQL in one class, and
`MercadoPublicoV2SyncControlService` mixes policy, dispatch, and SQL the same
way. The external architecture stays; the internal modules need to gain a
single main reason to change. The goal is the proposal milestone
"Mercado Publico V2 Maintainability Hardening": robust + modular + understandable
with zero lost operational guarantees.

## Investigation / Current State

- `mercado-publico-v2-durable-sync.service.ts` is 1987 lines with 40+ methods
  and 37 raw SQL call sites (34 `coreDataSource.query`, 3 `entityManager.query`),
  including fixture-only methods (`runFixture` at 496; `projectPendingItems` at
  1292 whose sole caller is `runFixture` at 542).
- Resume-stage decisions are duplicated: if-chains in `resume()` (327-348) and
  `executeExistingRun()` (390-417), plus two near-identical discovery blocks
  (425-446 and 448-479).
- `mercado-publico-v2-projection.service.ts` normalizes and fingerprints the
  same record independently at four sites: `ingest` (196), `rebuild` (283),
  `project` (369), `projectGoldRow` (544).
- `mercado-publico-v2-sync-control.service.ts` is 1185 lines with 35 raw SQL
  call sites; `claimCommand()` alone touches `mp.sync_command`,
  `mp.sync_run_attempt`, and `mp.sync_run` in one transaction.
- Two proposal bullets are verified already done and produce no work:
  axios knowledge is already encapsulated in
  `drivers/api/utils/classify-http-failure.util.ts` and
  `get-transport-failure-metadata.util.ts` (DurableSync imports `classifyFailure`,
  not axios); no `jobStatus`/`JobRunStatus`-related cast exists in
  `packages/twenty-front` (unrelated `as never` casts exist in frontend tests
  and two runtime files, none touching job status).
- Existing test baseline is strong: 24 `it()` blocks across the two durable-sync
  specs (562 and 743 lines), a 678-line sync-control spec, a 418-line projection
  spec, plus pure-util specs such as `classify-http-failure.util.spec.ts`.

## What Changes

- Extract the resume-stage decision into one pure function used by both
  `resume()` and `executeExistingRun()`, collapsing the duplicated discovery
  blocks into one branch. The util owns only the shared stage decision; the
  terminal allowed-list guard stays in `executeExistingRun` because the two
  entry points intentionally diverge on `failed` and `succeeded` runs.
- Extract `MercadoPublicoV2SyncRunStore` and
  `MercadoPublicoV2SyncRunItemStore` with domain verbs (`markProcessing`,
  `markTerminal`, `setStatus`). SQL statements move verbatim; no query is
  rewritten, reindexed, or re-transacted in the same task. `SyncRunStore` also
  gains lifecycle verbs (`createSyncRun`, `checkpointPage`, `completeSyncRun`,
  `failSyncRun`, `readRunCounts`, `listObservationIds`) so the fixture runner
  never widens DurableSync's public surface.
- Extract `MercadoPublicoV2CohortStore` owning `mp.v2_cohort` lifecycle
  (`freezeActiveCohort`, `readActiveCohortCodes`, `markCohortTerminal`) and the
  current-detail read (`readCurrentDetailsByCode` over `mp.compra_agil` and
  `mp.v2_observation`); `SyncRunItemStore` gains `recordAttempt` and
  `carryForwardSucceededItems` for the remaining item-attempt SQL.
- Extract `MercadoPublicoV2DiscoveryRunnerService` and
  `MercadoPublicoV2HydrationRunnerService`. Their `run()` methods keep the
  existing string-union outcomes (`'completed' | 'cancelled' |
  'page_budget_reached'` and `'completed' | 'cancelled'`); no outcome struct is
  introduced while only one consumer exists.
- Add one private `buildProjectionInput()` in `MercadoPublicoV2ProjectionService`
  and reuse it at the four normalization sites. The returned type stays
  file-local until a second module consumes it.
- Extract `MercadoPublicoV2SyncCommandStore` and
  `MercadoPublicoV2SyncRunAttemptStore` (both accept `EntityManager | DataSource`,
  matching the existing `appendAudit(entityManager, ...)` pattern). SyncControl
  keeps policy, dispatch, idempotency, and audit, plus a documented set of
  policy SQL (operator read, run-state reads and writes, watermark read,
  audit, timeline); recovery `sync_run_item` SQL goes through
  `SyncRunItemStore.resetForResume` and `claimDueDeferred` verbs.
- Move the fixture surface (`runFixture` + `projectPendingItems`) into
  `MercadoPublicoV2FixtureRunnerService`; the e2e command delegates to it. The
  fixture runner depends only on stores, persistence, and projection and calls
  `SyncRunStore` lifecycle verbs directly. The `'fixture'` intent value stays
  as persisted data.
- Move `MercadoPublicoV2SyncIntent` and `MercadoPublicoV2DurableSyncResult`
  into a new `mercado-publico-v2.types.ts`; import sites update, no behavior
  change.
- Add `docs/operations/mercado-publico-v2-runbook.md` as the release-ready
  operator runbook.

## Change Profile

- Profile: runtime-change
- Why this profile fits: server module structure changes across services and
  module registrations; observable behavior must be proven unchanged, so
  fail-first and characterization coverage stays mandatory.

## Out Of Scope

- Any DB schema change, GraphQL schema change, queue name change, job payload
  change, API semantic change, watermark semantic change, retry semantic change,
  or projection semantic change.
- Rewriting, optimizing, or re-transacting any SQL statement while extracting
  it (one dimension of change per task).
- New frameworks or libraries: no CQRS, no state-machine library, no generic
  repository, no new external dependency.
- Changing V1/CSV retirement scope, migrations, `mp` evidence, or the G4/G5
  authorities recorded by `mercado-publico-v2-legacy-retirement`.
- Deleting behavior for line-count reasons; the phase of legacy deletion is
  complete.

## Ownership and Test Seam

- Highest existing Seam: the public methods of
  `MercadoPublicoV2DurableSyncService` (`start`, `startOrResume`, `resume`,
  `rediscover`, `executeExistingRun`), `MercadoPublicoV2SyncControlService`
  (`submitCommand`, `claimCommand`, `finalizeCommand`, `deferCommand`,
  `recoverDispatches`), and `MercadoPublicoV2ProjectionService` (`ingest`,
  `rebuild`) — the external behavior callers and tests observe today.
- Owning Module: the Mercado Publico module under `packages/twenty-server`
  (`MercadoPublicoV2DurableSyncService` for orchestration,
  `MercadoPublicoV2SyncControlService` for control, the new stores and runners
  for their extracted slices).
- Interface: public signatures and return types stay unchanged; SQL statement
  text stays unchanged (moved, not edited); the GraphQL surface and `mp` schema
  stay unchanged.
- Highest test Seam: existing Jest specs for durable-sync, sync-control, and
  projection, plus the new pure util spec following the
  `classify-http-failure.util.spec.ts` pattern (no Nest, no Postgres, no mocks).
- Adapter: the `drivers/api/utils` pure-function pattern is the adapter for
  policy decisions; Injectable services with injected `DataSource` are the
  adapter for stores; `EntityManager | DataSource` parameters follow
  `appendAudit`.
- Depth / Leverage / Locality: stores concentrate SQL behind domain verbs so
  orchestration reads top-to-bottom; the single policy function serves two
  callers with one tested decision; runners give DurableSync one reason to
  change by removing the two largest blocks.

## Prior Art and First Proof

- Prior art: `classify-http-failure.util.ts` + spec; the two durable-sync specs
  (562 and 743 lines); the sync-control and projection specs.
- First failing behavior or contract proof: a new decision-table spec for
  `resolveSyncRunStage` fails because the util does not exist (task 1.1), then
  passes only after extraction without touching existing specs; characterization
  tests pin any PR-0 behavior gap before moves begin (task 1.2).

## Execution Order Decision

- Required: yes
- Why: policy extraction is dependency-free and highest ROI; stores block both
  runners, the sync-control stores, and the fixture relocation; the closeout
  slice is blocked by every implementation slice.

## Impact

- Affects `packages/twenty-server` Mercado Publico services, module
  registrations, and focused Jest suites only.
- Affects developer reasoning: DurableSync drops from ~1987 lines to roughly
  300-600 orchestration lines after all slices.
- Does not affect the frontend, the `mp` schema, GraphQL, BullMQ payloads,
  migrations, or any external contract.

## Verification Policy

- Add fail-first coverage at the owning seam: the decision table before the
  util exists, characterization tests before any code moves.
- Verify each slice with its focused suites plus the unchanged existing specs.
- Prove the zero-change constraints explicitly at the final gate: no schema,
  GraphQL, queue, or payload diff.
- Do not substitute a broad green suite for per-slice proof.

## Notes

- Context: senior-lead review proposal for "Mercado Publico V2 Maintainability
  Hardening" — approve the external architecture, harden the internal modules.
- Not sourced from an implementation SDLC map: verified 2026-08-16 that
  `.scratch/mercado-publico-v2-reconstruction/implementation-sdlc-map.md`
  contains no maintainability or hardening group; this change is new work.
- Assumptions: behavior-preserving refactor only; every task is one
  architectural dimension; lazy simplifications are deliberate and recorded in
  design decisions (string-union outcomes instead of structs, verbatim SQL
  copy, file-local projection input type, terminal guard left in
  `executeExistingRun`, fixture runner calling store lifecycle verbs directly).
- Boundaries: no schema, GraphQL, queue, API, watermark, retry, or projection
  semantic change; no new dependency; no removal of the `'fixture'` intent
  value from persisted data.
