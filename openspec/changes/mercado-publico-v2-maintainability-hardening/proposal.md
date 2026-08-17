## Why

The Mercado Publico V2 backend architecture is correct, but its workload is
concentrated: `MercadoPublicoV2DurableSyncService` mixes orchestration,
discovery, hydration, fixture, retry, and raw SQL in one class, and
`MercadoPublicoV2SyncControlService` mixes policy, dispatch, and SQL the same
way. The external architecture stays; the internal modules need to gain a
single main reason to change.

The first design of this change proposed a network of stores and runner
services. Applying ponytail audit/review/debt plus a correctness review to the
real code shows that most of that network is premature: it replaces two large
classes with many new classes, providers, and constructor dependencies while
hiding an already-correct transaction boundary. This revision keeps the same
goal — robust, modular, understandable, with zero lost operational guarantees —
but pursues it with the smallest functional diff: fewer dependency edges,
clearer ownership, same behavior, minimum new code.

## Investigation / Current State

- `mercado-publico-v2-durable-sync.service.ts` is 1987 lines with 40+ methods
  and 37 raw SQL call sites; `mercado-publico-v2-sync-control.service.ts` is
  1185 lines with 35 raw SQL call sites. Large files alone do not prove that
  store abstractions are the right next move.
- `MercadoPublicoV2SyncControlService.recoverDeferredHydrations()` exists at
  line 634 and is called only by `MercadoPublicoV2DebtRecoveryCronJob`. It is
  the sole use of the `MercadoPublicoV2DurableSyncService` constructor
  dependency (constructor line 148, call site line 682). The cron currently
  routes through SyncControl, creating an unnecessary dependency edge
  `SyncControl -> DurableSync`.
- `buildCompraAgilRequestParams` is exported from
  `mercado-publico-v2-durable-sync.service.ts` (line 167) and imported by
  SyncControl (line 19, used at line 910). A shared pure policy therefore looks
  like DurableSync-owned surface.
- `submitCommand()` already owns the correct transaction boundary: command
  find/insert, audit, run create/reuse/cancel/resume, and result persistence
  all run inside one `coreDataSource.transaction(...)`; queue dispatch runs
  only after that transaction resolves (lines 191-282). This boundary is
  correct but implicit — nothing freezes it against future extraction drift.
- `MercadoPublicoV2DurableSyncService` already injects
  `MercadoPublicoConfigService`, `DataSource`, and a logger, so moving deferred
  hydration recovery there adds no new dependency.
- Existing test baseline is strong: 24 `it()` blocks across the two
  durable-sync specs, a 678-line sync-control spec (including the two
  `recoverDeferredHydrations` tests at lines 624-677), and pure-util specs such
  as `classify-http-failure.util.spec.ts`. No cron-job spec exists.
- Two duplicated validators exist on purpose: `getMaxPages` throws
  `UserInputError` in SyncControl and `Error` in DurableSync. Unifying them
  would change an observable error contract; the duplication is recorded as
  deliberate debt.

## What Changes

- Freeze the submission transaction invariant as an explicit OpenSpec
  requirement and a production comment: `submitCommand()` stays the
  transaction owner, extracted collaborators receive the existing
  `EntityManager`, and queue dispatch happens only after the transaction
  commits. Add one characterization test proving the ordering
  (transaction commit before queue add). No production transaction change.
- Extract `buildCompraAgilRequestParams` into a neutral pure util
  `services/utils/mercado-publico-v2-sync-request-params.util.ts`. Both
  DurableSync and SyncControl import it; neither owns it. Zero new providers.
- Move `recoverDeferredHydrations()` from SyncControl to DurableSync,
  including the `MERCADO_PUBLICO_V2_DEBT_RECOVERY_BATCH_LIMIT` constant and the
  existing recovery tests (behavior unchanged). The debt recovery cron depends
  on DurableSync directly. The `SyncControl -> DurableSync` constructor
  dependency edge disappears; no new edge appears.
- Add a behavior-preservation matrix to `design.md` mapping each invariant to
  its existing characterization suite, and a behavior-preservation gate to
  `tasks.md`. Do not duplicate existing suites.
- Add a Phase 0 baseline gate: record the baseline commit SHA and green status
  before any code move, so baseline failures are distinguishable from
  refactor regressions.
- Keep the release-ready operator runbook task.

## Change Profile

- Profile: runtime-change
- Why this profile fits: server module structure changes across two services
  and one cron job; observable behavior must be proven unchanged, so
  fail-first characterization and baseline gating stays mandatory.

## Out Of Scope

- Any DB schema change, GraphQL schema change, queue name change, job payload
  change, API semantic change, watermark semantic change, retry semantic
  change, or projection semantic change.
- Rewriting, optimizing, or re-transacting any SQL statement while extracting
  it (one dimension of change per task).
- New frameworks or libraries: no CQRS, no state-machine library, no generic
  repository, no transactional outbox, no new external dependency.
- New injectable abstractions in this change: no `SyncRunStateService`, no
  `SyncCommandStateService`, no `SyncRequestPolicyService`, no
  `WatermarkService`, no `DeferredHydrationRecoveryService`, no repository
  interfaces, no outcome structs.
- Store, runner, fixture-relocation, projection-input, types-file, and
  `resolve-v2-sync-run-stage` extraction work. These stay deferred until the
  stop-and-reassess gate after the minimal cuts; each requires a cohesive
  independently-owned responsibility, a clear owner, a meaningful reduction in
  orchestration complexity, and no hidden transaction boundary.
- Unifying the two `getMaxPages` validators (error contract differs) and the
  duplicate watermark read (transactionally different callers). Both are
  recorded as deliberate debt with ceilings and upgrade triggers.
- Changing V1/CSV retirement scope, migrations, `mp` evidence, or the G4/G5
  authorities recorded by `mercado-publico-v2-legacy-retirement`.
- Deleting behavior for line-count reasons; the phase of legacy deletion is
  complete.

## Ownership and Test Seam

- Highest existing Seam: the public methods of
  `MercadoPublicoV2DurableSyncService` (`start`, `startOrResume`, `resume`,
  `rediscover`, `executeExistingRun`, and now `recoverDeferredHydrations`) and
  `MercadoPublicoV2SyncControlService` (`submitCommand`, `claimCommand`,
  `finalizeCommand`, `deferCommand`, `recoverDispatches`) — the external
  behavior callers and tests observe today.
- Owning Module: the Mercado Publico module under `packages/twenty-server`.
  SyncControl owns command submission, claim, finalize, cancel, resume,
  dispatch recovery, and operator-facing run state. DurableSync owns sync
  execution, checkpoints, hydration, resume, and deferred hydration recovery.
- Interface: public signatures and return types stay unchanged; SQL statement
  text stays unchanged (moved, not edited); the GraphQL surface and `mp` schema
  stay unchanged; module provider registrations stay unchanged (both services
  are already registered).
- Highest test Seam: the existing Jest specs for durable-sync and sync-control,
  plus the one new queue-after-commit characterization test and, if the moved
  pure util gains a spec, the `classify-http-failure.util.spec.ts` pattern (no
  Nest, no Postgres, no mocks).
- Adapter: the `drivers/api/utils` pure-function pattern is the adapter for
  shared pure policy; Injectable services with injected `DataSource` remain the
  adapter only where a real lifecycle exists.
- Depth / Leverage / Locality: the neutral util gives two orchestrators one
  shared pure calculation with no ownership distortion; the recovery move
  deletes a whole dependency edge; the invariant test pins the transaction
  boundary end-to-end at the only place it is observable.

## Prior Art and First Proof

- Prior art: `classify-http-failure.util.ts` + spec; the two durable-sync specs
  (562 and 743 lines); the sync-control spec including the existing recovery
  tests.
- First failing behavior or contract proof: the queue-after-commit
  characterization test is added before any code move and fails only if the
  ordering contract is broken; the moved recovery tests must pass unchanged
  after relocation.

## Execution Order Decision

- Required: yes
- Why: the baseline gate blocks everything; characterization pins the contract
  before moves; the pure-util move is dependency-free; the recovery move is
  the highest-value edge removal and is followed by a mandatory reassess
  instead of an automatic second wave.

## Impact

- Affects `packages/twenty-server` Mercado Publico services (two service files,
  one cron job, one new util file, two spec files) only.
- Net architectural result: +1 file, 0 new providers, 0 new interfaces, 0 new
  DB tables, 0 new queues, 0 new injectable abstractions; one removed edge
  `SyncControl -X-> DurableSync`; one shared pure dependency from both
  orchestrators to the request-params util.
- Does not affect the frontend, the `mp` schema, GraphQL, BullMQ payloads,
  migrations, or any external contract.

## Verification Policy

- Phase 0 freezes the baseline: record the commit SHA and green status of the
  targeted suites before any code move; pre-existing failures are recorded as
  such.
- Add the queue-after-commit characterization test before any production move.
- Verify each move with its focused suites plus the unchanged existing specs;
  recovery tests move with behavior unchanged.
- Prove the zero-change constraints explicitly at the final gate: no schema,
  GraphQL, queue, or payload diff.
- Do not substitute a broad green suite for per-move proof.

## Notes

- Context: senior-lead review proposal for "Mercado Publico V2 Maintainability
  Hardening" — approve the external architecture, harden the internal modules
  with the smallest functional diff.
- Review method: ponytail audit, review, and debt were applied, complemented
  by a correctness review because ponytail-review/audit deliberately leave
  correctness, security, and performance out of scope.
- Correction to prior analysis: `recoverDeferredHydrations()` does exist in
  the current HEAD of `MercadoPublicoV2SyncControlService`; the earlier
  tests-versus-production mismatch finding is withdrawn. The real problem is
  the misplaced owner and the unnecessary `SyncControl -> DurableSync` edge.
- Not sourced from an implementation SDLC map: verified 2026-08-16 that
  `.scratch/mercado-publico-v2-reconstruction/implementation-sdlc-map.md`
  contains no maintainability or hardening group; this change is new work.
- Assumptions: behavior-preserving refactor only; every move is one
  architectural dimension; deliberate duplications are recorded as debt, not
  extracted prematurely; a second wave of extraction is not pre-authorized.
- Boundaries: no schema, GraphQL, queue, API, watermark, retry, or projection
  semantic change; no new dependency; no new injectable abstraction; no
  removal of the `'fixture'` intent value from persisted data.
