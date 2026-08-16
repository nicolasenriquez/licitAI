## Context

The external architecture is approved. The friction is concentration: one
Module, `MercadoPublicoV2DurableSyncService`, executes and understands
discovery, hydration, fixture, retries, and SQL. The safe seam for this change
is the existing public method surface plus the focused Jest suites that cross
it — external behavior must stay byte-identical while internals move. The
laziest solution that holds is adopted per slice: move, do not rewrite.

## Goals / Non-Goals

**Goals**
- Give each extracted Module one main reason to change.
- Keep every external contract identical: DB schema, GraphQL, queue names and
  payloads, API semantics, watermark, retry, and projection semantics.
- Make each slice independently verifiable with existing specs plus one new
  pure-util spec.

**Non-Goals**
- Change or optimize SQL, transactions, or indexes during extraction.
- Introduce outcome structs, generic repositories, state machines, or
  frameworks.
- Reduce LOC as a goal; deletion is limited to moved or duplicated code.

## Boundary and Ownership

### Workflow policy

Owned by a new pure util `resolve-v2-sync-run-stage.util.ts`. Its Interface is
one function from `{ status, errorStage, errorRetryable }` to
`'cancelled_before_start' | 'requires_rediscovery' | 'discovery' | 'hydration'`.
It has high Depth (hides the state table) and high Leverage (two callers,
`resume` and `executeExistingRun`, replace duplicated if-chains with one
switch). Locality: the decision lives next to the specs that pin it, following
the `drivers/api/utils` pure-function pattern.

The util owns only the shared stage decision. The terminal allowed-list guard
stays in `executeExistingRun` because the two entry points intentionally
diverge on `failed` + `hydrating` and `succeeded` runs: `resume()` re-enters
hydration, while `executeExistingRun()` throws a terminal error. The guard is
pinned by the existing specs; the util's decision table covers only the four
shared outcomes.

### Persistence stores

`MercadoPublicoV2SyncRunStore` owns `mp.sync_run`, `mp.source_watermark`,
`mp.sync_run_page`, and quota-reset reads. `MercadoPublicoV2SyncRunItemStore`
owns `mp.sync_run_item` and `mp.sync_run_item_attempt`. Their Interface is
domain verbs (`setStatus`, `heartbeat`, `hasCancellationRequest`,
`getNextDiscoveryPage`, `markProcessing`, `markTerminal`, `resetProcessing`,
`recordAttempt`, `carryForwardSucceededItems`, `upsertDiscoveryItem`,
`resetForResume`, `claimDueDeferred`), not generic CRUD. `SyncRunStore` also
owns the lifecycle verbs the fixture runner needs without widening
DurableSync's public surface: `createSyncRun`, `checkpointPage`,
`completeSyncRun`, `failSyncRun`, `readRunCounts`, `listObservationIds`.

`MercadoPublicoV2CohortStore` owns `mp.v2_cohort` lifecycle
(`freezeActiveCohort`, `readActiveCohortCodes`, `markCohortTerminal`, the
cohort insert in discovery) and the current-detail read
(`readCurrentDetailsByCode` over `mp.compra_agil` and `mp.v2_observation`).
`freezeActiveCohort` is called by both orchestration and discovery, so it must
live in a store both can depend on.

SQL is copied verbatim; any query tuning is a later dimension. Locality: all
SQL for one table lives in one file, testable with a plain DataSource mock.

### Runners

`MercadoPublicoV2DiscoveryRunnerService.run()` returns
`'completed' | 'cancelled' | 'page_budget_reached'`;
`MercadoPublicoV2HydrationRunnerService.run()` returns
`'completed' | 'cancelled'`. The string union is the outcome: DurableSync keeps
only interpretation (`hydrateOrFinish`, `cancelRun`, `finishRun`). The runners
depend on stores and the API client, never back on DurableSync.

### Projection input

`MercadoPublicoV2ProjectionService` gains one private `buildProjectionInput()`
returning `normalized`, `semanticPayload`, `semanticFingerprint`, and
`observedAt`. The four call sites reuse it. The type stays file-local until a
second consumer exists.

### Sync control stores

`MercadoPublicoV2SyncCommandStore` and `MercadoPublicoV2SyncRunAttemptStore`
accept `EntityManager | DataSource` so transactions stay owned by SyncControl,
matching the existing `appendAudit(entityManager, ...)` pattern. SyncControl
retains policy, queue dispatch, idempotency orchestration, operator commands,
recovery coordination, and audit, plus a documented set of policy SQL that
stays in the service: `mp.sync_operator` read, `mp.sync_run` state reads and
writes (active-run detection, cancellation, heartbeat, create), the
`mp.source_watermark` read, the `core."userWorkspace"` timeline read, and
`mp.sync_run_audit` writes. Recovery `mp.sync_run_item` SQL goes through the
`SyncRunItemStore` verbs `resetForResume` (assertResumableRun) and
`claimDueDeferred` (recoverDeferredHydrations), both passing the
`EntityManager`.

### Fixture runner

`MercadoPublicoV2FixtureRunnerService` owns `runFixture` and
`projectPendingItems` (sole caller of the latter is `runFixture` at line 542).
It depends only on stores, persistence, and projection, and calls the
`SyncRunStore` lifecycle verbs directly (`createSyncRun`, `checkpointPage`,
`completeSyncRun`, `failSyncRun`) plus the `SyncRunItemStore` verbs for
pending-item projection. It does not depend on DurableSync or on the discovery
runner. The e2e command delegates to it. `'fixture'` stays a persisted intent
value; only the executable surface leaves the productive Module.

## Decisions

1. One pure function for the resume decision, not a policy class or state
   machine.

   Rationale: two callers share the same stage table; a pure function is the
   smallest testable unit and matches the existing util pattern. The function
   covers only the shared stage decision; the terminal allowed-list guard
   stays in `executeExistingRun` because the callers intentionally diverge on
   `failed` + `hydrating` and `succeeded` runs (`resume` re-enters hydration,
   `executeExistingRun` throws terminal).

   Alternatives considered:
   - State-machine library or policy class.
     - Rejected because it adds a dependency or ceremony for four states.
   - Separate helpers per caller.
     - Rejected because the stage table is identical; only the terminal guard
       differs, and that guard stays in the caller.
   - One function covering both full chains including the terminal throw.
     - Rejected because it forces a fifth `'terminal'` outcome that only one
       caller can produce, bending the shared table to serve one entry point.

2. String-union outcomes for runners, no `DiscoveryOutcome` /
   `HydrationOutcome` structs.

   Rationale: only DurableSync reads the result; a struct with five fields is
   speculative with one consumer.

   Alternatives considered:
   - Struct outcomes now.
     - Rejected because YAGNI; revisit when a second consumer appears.

3. SQL copied verbatim during store extraction.

   Rationale: one dimension of change per task; rewriting queries in the same
   diff hides behavior drift inside a move.

   Alternatives considered:
   - Refactor SQL, indexes, and transactions in the same PR.
     - Rejected because a green suite could not prove which dimension broke.

4. Injectable store services, not plain functions.

   Rationale: the module already uses NestJS DI everywhere; registration is a
   two-line diff.

   Alternatives considered:
   - Plain functions taking a DataSource.
     - Rejected because it breaks the repo convention and module DI wiring.

5. Fixture relocation deferred to the final implementation slice.

   Rationale: `runFixture` needs `createSyncRun`, `checkpointPage`,
   `finishRun`, and `failRun`, all private; moving today forces widening the
   productive interface. After stores and runners exist, the fixture runner
   depends only on stores, persistence, and projection: the `SyncRunStore`
   lifecycle verbs (`createSyncRun`, `checkpointPage`, `completeSyncRun`,
   `failSyncRun`) replace the private DurableSync calls, and the fixture runner
   never touches DurableSync or the discovery runner.

   Alternatives considered:
   - Move the fixture now.
     - Rejected because it duplicates half the class or publishes private
       methods for test-only code.
   - Delete the fixture path.
     - Rejected because the isolated E2E harness depends on it.

6. File-local projection input type.

   Rationale: all four normalization sites live in one file; exporting a type
   used by one module adds an interface with no second consumer.

   Alternatives considered:
   - Exported `ProjectionInput` type in `drivers/`.
     - Rejected because YAGNI until another module consumes it.

## Blast Radius

### Touched runtime areas
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/`
  (durable-sync, sync-control, projection, new stores and runners).
- `mercado-publico.module.ts` provider registrations.
- `commands/mercado-publico-v2-e2e-fixture.command.ts` delegation target.
- New `mercado-publico-v2.types.ts` holding `MercadoPublicoV2SyncIntent` and
  `MercadoPublicoV2DurableSyncResult`; import sites update with no behavior
  change.

### Untouched runtime areas
- `mp` schema, GraphQL resolvers and types, BullMQ jobs and payloads, cron
  jobs, guards, read services, drivers/api (axios stays encapsulated),
  frontend, migrations, evidence replay service.

## Verification Strategy

- Fail-first decision-table spec for `resolveSyncRunStage` before the util
  exists.
- Characterization tests for any PR-0 coverage gap before moves begin.
- Per-slice: focused Jest suites plus unchanged existing specs.
- Final gate: full mp suites, server and front typecheck, lint, diff-check, and
  explicit proof of zero schema/GraphQL/queue diff.
