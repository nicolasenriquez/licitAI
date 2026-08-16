## 0. Investigation and Scope Lock

- [ ] 0.1 Verify the current evidence before slicing: line and SQL query counts
  of `mercado-publico-v2-durable-sync.service.ts`,
  `mercado-publico-v2-sync-control.service.ts`, and
  `mercado-publico-v2-projection.service.ts`; the four projection
  normalization sites; the sole caller of `projectPendingItems`; and the two
  verified-done bullets (axios encapsulation in `drivers/api/utils`, absent
  frontend `as never` casts).
  Traceability: locks the refactor scope against code evidence instead of the
  proposal document alone.

- [ ] 0.2 Confirm the existing Jest baseline is green (durable-sync specs,
  sync-control spec, projection spec) and record the coverage gap against the
  PR-0 behavior list (new run, resume, rediscover, pagination, page budget,
  429/rate limit, retryable failure, hard failure, hydration skip and success,
  cancellation, watermark advance, partial_failed, evidence replay, projection
  idempotency).
  Traceability: freezes behavior before any code moves and identifies which
  behaviors need characterization tests in 1.2.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add `resolve-v2-sync-run-stage.util.spec.ts` with the full decision
  table: cancelled before start, requires rediscovery, discovery, and hydration
  cases covering the exact conditions of the shared stage decision in
  `resume()` 327-348 and `executeExistingRun()` 390-417. The terminal
  allowed-list guard stays in `executeExistingRun()` and remains pinned by its
  existing specs. Confirm the spec fails because the util does not exist yet.
  Traceability: pins the resume-stage decision before extraction; must pass
  after 2.1 without touching any existing spec.

- [ ] 1.2 Add characterization tests for any PR-0 behavior gap found in 0.2
  (for example cancellation during hydration, partial_failed hydration resume,
  watermark advance), asserting DurableSync public results as observed today.
  Traceability: closes coverage gaps with current-behavior pins so later slices
  prove zero behavior change.

## 2. Implementation

### Workflow Policy

- [ ] 2.1 Create
  `services/utils/resolve-v2-sync-run-stage.util.ts` with the single pure
  function and refactor `resume()` and `executeExistingRun()` to switch on it.
  Collapse the two duplicated discovery blocks (425-446 and 448-479) into one
  branch that derives the start page from `context.status === 'queued'`.
  Traceability: replaces duplicated if-chains with one testable decision; no
  new dependency.

### Persistence Stores

- [ ] 2.2 Create `MercadoPublicoV2SyncRunStore` (Injectable, injected
  DataSource) and move the `mp.sync_run`, `mp.source_watermark`,
  `mp.sync_run_page`, and quota-reset queries from DurableSync verbatim
  (`readWatermark`, `setStatus`, `heartbeat`, `hasCancellationRequest`,
  `getNextDiscoveryPage`, `completeDiscovery`, counter updates) plus the
  lifecycle verbs (`createSyncRun`, `checkpointPage`, `completeSyncRun`,
  `failSyncRun`, `readRunCounts`, `listObservationIds`, `advanceWatermark`).
  Swap the call sites without editing SQL text.
  Traceability: removes raw SQL from orchestration; query content unchanged in
  this task; the fixture runner gets its seam without widening DurableSync's
  public surface.

- [ ] 2.3 Create `MercadoPublicoV2SyncRunItemStore` and move the
  `mp.sync_run_item` and `mp.sync_run_item_attempt` queries verbatim
  (`listPendingHydrations`, `markProcessing`, `markPending`, `markSucceeded`,
  `markTerminal`, `resetProcessing`, `upsertDiscoveryItem`,
  `carryForwardSucceededItems`, `recordAttempt`,
  `listPendingProjectionItems`, `resetForResume`, `claimDueDeferred`). Swap
  call sites in `hydrate()` and the `markItem*` helpers; `resetForResume` and
  `claimDueDeferred` are consumed by SyncControl in 2.7 via `EntityManager`.
  Traceability: hydration, discovery, and recovery consumers get domain-verb
  persistence without SQL drift.

### Runners

- [ ] 2.4 Create `MercadoPublicoV2DiscoveryRunnerService` and move
  `discover()`, `checkpointPage()`, and `completeDiscovery()` bodies verbatim.
  `run()` returns the existing `'completed' | 'cancelled' | 'page_budget_reached'`
  union; no outcome struct while only DurableSync consumes it. DurableSync only
  interprets the result. Cohort and current-detail reads go through
  `MercadoPublicoV2CohortStore` from 2.9.
  Traceability: DurableSync stops executing discovery and keeps orchestration.

- [ ] 2.5 Create `MercadoPublicoV2HydrationRunnerService` and move `hydrate()`
  plus the item-marking calls. `run()` returns `'completed' | 'cancelled'`;
  DurableSync keeps `hydrateOrFinish()` as the interpreter.
  Traceability: removes the largest single block from DurableSync.

### Projection

- [ ] 2.6 Add a private `buildProjectionInput()` in
  `MercadoPublicoV2ProjectionService` returning `normalized`, `semanticPayload`,
  `semanticFingerprint`, and `observedAt`, and replace the four normalization
  sites (`ingest` 196, `rebuild` 283, `project` 369, `projectGoldRow` 544).
  Keep the returned type file-local.
  Traceability: one computation per record; no exported type until a second
  consumer exists.

### Sync Control

- [ ] 2.7 Create `MercadoPublicoV2SyncCommandStore` and
  `MercadoPublicoV2SyncRunAttemptStore`, both accepting
  `EntityManager | DataSource` (matching `appendAudit`), and move the claim,
  finalize, defer, and command/attempt recovery SQL verbatim. Recovery
  `sync_run_item` SQL goes through the `SyncRunItemStore` verbs added in 2.3
  (`resetForResume`, `claimDueDeferred`). SyncControl keeps policy, queue
  dispatch, idempotency orchestration, operator commands, and audit, plus the
  documented policy SQL: `mp.sync_operator` read, `mp.sync_run` state reads and
  writes, `mp.source_watermark` read, workspace timeline read, and
  `mp.sync_run_audit` writes.
  Traceability: the control service loses command/attempt SQL while keeping
  application-level responsibilities; the stays-list records what remains and
  why.

### Fixture

- [ ] 2.8 Create `MercadoPublicoV2FixtureRunnerService` and move `runFixture()`
  and `projectPendingItems()` (sole caller at line 542) out of DurableSync.
  The runner depends only on stores, persistence, and projection and calls the
  `SyncRunStore` lifecycle verbs (`createSyncRun`, `checkpointPage`,
  `completeSyncRun`, `failSyncRun`) directly. `MercadoPublicoV2E2EFixtureCommand`
  delegates to the runner. The `'fixture'` intent value stays as persisted
  data.
  Traceability: the fixture-only surface leaves the productive workflow module
  without depending on it or on the discovery runner.

- [ ] 2.9 Create `MercadoPublicoV2CohortStore` (Injectable, injected
  DataSource) and move the `mp.v2_cohort` lifecycle SQL
  (`freezeActiveCohort`, `readActiveCohortCodes`, `markCohortTerminal`, the
  cohort insert in discovery) and the current-detail read
  (`readCurrentDetailsByCode` over `mp.compra_agil` and `mp.v2_observation`)
  verbatim. Swap the call sites in DurableSync orchestration and in the
  discovery and hydration runners.
  Traceability: the last unowned SQL leaves DurableSync; `freezeActiveCohort`
  gets one home both orchestration and discovery depend on.

## 3. Verification

- [ ] 3.1 Run the policy util spec and the existing durable-sync suites; the
  new spec passes and the existing suites stay green unchanged.
  Traceability: proves 2.1 preserved resume and executeExistingRun behavior.

- [ ] 3.2 Run the durable-sync and sync-control suites after store extraction
  and confirm the diff shows moves only with no SQL edits.
  Traceability: proves the verbatim-copy constraint per query.

- [ ] 3.3 Run the durable-sync suites after discovery extraction.
  Traceability: proves discovery behavior moved without change.

- [ ] 3.4 Run the durable-sync suites after hydration extraction and confirm
  DurableSync contains no direct `mp` SQL and reads top-to-bottom as
  orchestration.
  Traceability: proves the concentration goal for the main service.

- [ ] 3.5 Run the projection spec plus a fingerprint equivalence check after
  2.6.
  Traceability: proves normalization moved to one path without value change.

- [ ] 3.6 Run the sync-control spec after 2.7.
  Traceability: proves claim, finalize, defer, and recovery behavior unchanged.

- [ ] 3.7 Run the fixture-related specs (durable-sync fixture test and command
  consumers) after 2.8.
  Traceability: proves the fixture path still works through the runner.

- [ ] 3.8 Run the final gate: full Mercado Publico Jest suites, server and
  front typecheck, lint, `git diff --check`, and explicit proof of zero
  schema, GraphQL, queue-name, and job-payload diff.
  Traceability: proves every no-change constraint from the proposal holds after
  all slices.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Create `docs/operations/mercado-publico-v2-runbook.md` (start,
  cancel, inspect, recover, 429 handling, stuck run, Redis restart, DB failure)
  and document the DurableSync invariants: no direct SQL, no axios, no fixture
  behavior, orchestration readable top-to-bottom.
  Traceability: release-ready operator documentation after behavior is proven
  unchanged.

- [ ] 4.2 Run `openspec validate --strict
  mercado-publico-v2-maintainability-hardening` and confirm proposal, design,
  tasks, and spec stay aligned.
  Traceability: final artifact-level proof for this change.

## Execution Order

### Slice 0 — Safety baseline
- Tasks: `0.1 -> 0.2`
- Checkpoint: current-behavior evidence recorded and any coverage gap listed
  for 1.2.
- Blocks: Slice 1.

### Slice 1 — Workflow policy
- Tasks: `1.1 -> 2.1 -> 3.1`
- Checkpoint: one pure util passes its decision-table spec and both resume
  entry points behave identically.
- Blocked by: Slice 0.
- Blocks: Slice 2.

### Slice 2 — Persistence stores
- Tasks: `1.2 -> 2.2 -> 2.3 -> 2.9 -> 3.2`
- Checkpoint: no raw `mp` SQL remains in DurableSync and the diff shows moved
  queries only.
- Blocked by: Slice 1.
- Blocks: Slices 3, 4, 6, 7.

### Slice 3 — Discovery runner
- Tasks: `2.4 -> 3.3`
- Checkpoint: discovery executes behind `MercadoPublicoV2DiscoveryRunnerService`
  and DurableSync only interprets the outcome.
- Blocked by: Slice 2.
- Blocks: Slice 8.

### Slice 4 — Hydration runner
- Tasks: `2.5 -> 3.4`
- Checkpoint: hydration executes behind `MercadoPublicoV2HydrationRunnerService`
  and DurableSync is orchestration-only.
- Blocked by: Slice 2.
- Blocks: Slice 8.

### Slice 5 — Projection input
- Tasks: `2.6 -> 3.5`
- Checkpoint: the four normalization sites share `buildProjectionInput()` with
  identical fingerprints.
- Blocked by: None (parallel with Slices 3, 4, 6, 7).
- Blocks: Slice 8.

### Slice 6 — Sync control stores
- Tasks: `2.7 -> 3.6`
- Checkpoint: SyncControl keeps policy and dispatch while claim, finalize,
  defer, and recovery SQL live behind the two stores.
- Blocked by: Slice 2.
- Blocks: Slice 8.

### Slice 7 — Fixture relocation
- Tasks: `2.8 -> 3.7`
- Checkpoint: the fixture surface runs through
  `MercadoPublicoV2FixtureRunnerService` and the productive workflow no longer
  contains fixture methods.
- Blocked by: Slice 2.
- Blocks: Slice 8.

### Slice 8 — Final gate and closeout
- Tasks: `3.8 -> 4.1 -> 4.2`
- Checkpoint: full suites green, zero schema/GraphQL/queue diff proven, runbook
  published, and OpenSpec validation passes.
- Blocked by: Slices 3, 4, 5, 6, 7.
- Blocks: None.
