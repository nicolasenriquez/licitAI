## Phase 0 — Freeze Baseline

- [ ] 0.1 Run the repository's existing server/pre-push validation gate
  against the untouched branch HEAD and record the exact baseline commit SHA.
  Traceability: baseline failures must be distinguishable from refactor
  regressions.

- [ ] 0.2 Confirm the Mercado Publico V2 targeted suites are green:
  durable-sync specs, sync-control spec, projection spec.
  Traceability: freezes behavior before any code move.

- [ ] 0.3 If any test is already failing, record it as pre-existing before
  modifying production code.
  Traceability: prevents misattributing baseline failure to the refactor.

- [ ] 0.4 Do not begin extraction work until the baseline result is
  reproducible.
  Traceability: gate for every later phase.

## Phase 1 — Characterization

- [ ] 1.1 Add the queue-after-commit characterization test to the
  sync-control spec: mock `transaction` to record `transaction:start` /
  `transaction:commit` events around the callback and `messageQueueService.add`
  to record `queue:add`; assert the event order is
  `transaction:start -> transaction:commit -> queue:add` for a start command
  that dispatches. Confirm the test is green on the unchanged code.
  Traceability: pins the transaction-ownership boundary end-to-end at the
  only observable seam.

- [ ] 1.2 Add the transaction-ownership invariant and the
  behavior-preservation matrix to the spec and design artifacts (done at
  artifact level; no production change).
  Traceability: makes "preserve behavior" checkable instead of implicit.

## Phase 2 — Pure Helper Ownership

- [ ] 2.1 Create
  `services/utils/mercado-publico-v2-sync-request-params.util.ts` and move
  `buildCompraAgilRequestParams` there with the SAME existing implementation.
  Traceability: shared pure policy gets a neutral home; no new provider.

- [ ] 2.2 Swap imports: DurableSync imports the util; SyncControl imports the
  util and no longer imports `buildCompraAgilRequestParams` from the
  durable-sync file.
  Traceability: dependency direction becomes
  `SyncControl/DurableSync -> util` instead of `SyncControl -> DurableSync
  file`.

- [ ] 2.3 Run the durable-sync and sync-control suites; both stay green
  unchanged. If the util gains a spec, follow the
  `classify-http-failure.util.spec.ts` pattern (no Nest, no mocks).
  Traceability: proves the move changed only the import sites.

## Phase 3 — Remove Wrong Dependency Edge

- [ ] 3.1 Move `recoverDeferredHydrations()` verbatim from SyncControl to
  DurableSync, together with `MERCADO_PUBLICO_V2_DEBT_RECOVERY_BATCH_LIMIT`.
  DurableSync already has `mercadoPublicoConfigService`, `coreDataSource`,
  and `logger`; no new constructor dependency.
  Traceability: recovery belongs to the durable execution lifecycle owner.

- [ ] 3.2 Update `MercadoPublicoV2DebtRecoveryCronJob` to inject
  `MercadoPublicoV2DurableSyncService` and call
  `recoverDeferredHydrations()` on it. Module provider registrations stay
  unchanged.
  Traceability: cron path becomes `Cron -> DurableSync`; the
  `SyncControl -> DurableSync` edge disappears.

- [ ] 3.3 Remove the `mercadoPublicoV2DurableSyncService` constructor
  dependency and the method from SyncControl.
  Traceability: SyncControl returns to command/control-only responsibilities.

- [ ] 3.4 Move the two existing recovery tests (`recovers due deferred items
  as focused recovery runs`, `does not dispatch a deferred item whose
  observation is already fresher`) from the sync-control spec to the
  durable-sync spec with behavior unchanged; adapt the SyncControl spec
  constructor calls that pass the DurableSync mock.
  Traceability: the recovery behavior keeps its characterization; no test
  loss.

- [ ] 3.5 Run both suites; recovery tests pass moved, all other tests green
  unchanged.
  Traceability: proves the edge removal preserved behavior.

## Phase 4 — Final Gate and Closeout

- [ ] 4.1 Run the final gate: full Mercado Publico Jest suites, server and
  front typecheck, lint, `git diff --check`, and explicit proof of zero
  schema, GraphQL, queue-name, and job-payload diff.
  Traceability: proves every no-change constraint from the proposal holds.

- [ ] 4.2 Create `docs/operations/mercado-publico-v2-runbook.md` (start,
  cancel, inspect, recover, 429 handling, stuck run, Redis restart, DB
  failure) and document the current ownership: SyncControl owns command and
  transaction lifecycle; DurableSync owns execution and deferred hydration
  recovery; the request-params util is shared pure policy.
  Traceability: release-ready operator documentation after behavior is proven
  unchanged.

- [ ] 4.3 Run `openspec validate --strict
  mercado-publico-v2-maintainability-hardening` and confirm proposal, design,
  tasks, and spec stay aligned.
  Traceability: final artifact-level proof for this change.

## Extraction Rule

For every extraction in this change:

1. baseline targeted tests green
2. perform one cohesive move
3. targeted tests green
4. typecheck/lint/build
5. commit

Do not combine unrelated cleanup with the extraction.

## Behavior-Preservation Gate

- [ ] Existing characterization tests pass before each extraction.
- [ ] Existing characterization tests pass after each extraction.
- [ ] Add only tests for uncovered invariants; do not duplicate behavior
  already characterized by existing suites.
- [ ] No task is complete while its mapped invariant is failing.

## Execution Order

### Slice 0 — Safety baseline
- Tasks: `0.1 -> 0.2 -> 0.3 -> 0.4`
- Checkpoint: baseline SHA recorded, targeted suites green or pre-existing
  failures listed.
- Blocks: Slices 1, 2, 3.

### Slice 1 — Characterization
- Tasks: `1.1 -> 1.2`
- Checkpoint: queue-after-commit test green on unchanged code; invariant and
  matrix in the artifacts.
- Blocked by: Slice 0.
- Blocks: Slices 2, 3.

### Slice 2 — Pure helper ownership
- Tasks: `2.1 -> 2.2 -> 2.3`
- Checkpoint: both orchestrators import the shared util; suites green.
- Blocked by: Slice 1.
- Blocks: Slice 4.

### Slice 3 — Remove wrong dependency edge
- Tasks: `3.1 -> 3.2 -> 3.3 -> 3.4 -> 3.5`
- Checkpoint: cron path is `Cron -> DurableSync`; SyncControl has no
  DurableSync dependency; moved recovery tests green.
- Blocked by: Slice 1.
- Blocks: Slice 4.

### Slice 4 — Final gate and closeout
- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: full suites green, zero schema/GraphQL/queue diff proven,
  runbook published, OpenSpec validation passes.
- Blocked by: Slices 2, 3.
- Blocks: None.

## Stop and Reassess

After Slices 2 and 3, re-measure `MercadoPublicoV2DurableSyncService` and
`MercadoPublicoV2SyncControlService`.

- [ ] Do not automatically authorize a further phase of repository or state
  service extraction.

A further extraction is authorized only when all four hold:

- [ ] one cohesive responsibility can be named
- [ ] a clear owner exists for it
- [ ] the extraction meaningfully reduces orchestration complexity
- [ ] no transaction boundary is hidden

If the four do not hold: stop.
