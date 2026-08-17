## Context

The external architecture is approved. The friction is concentration and two
misplaced ownership edges: SyncControl imports a pure request builder from the
DurableSync file, and the debt recovery cron routes through SyncControl only to
call DurableSync. The safe seam for this change is the existing public method
surface plus the focused Jest suites that cross it — external behavior must
stay byte-identical while ownership moves. The laziest solution that holds is
adopted per move: move, do not rewrite; freeze, do not rebuild.

## Goals / Non-Goals

**Goals**
- Delete the `SyncControl -> DurableSync` dependency edge; no new edge
  appears.
- Give the shared request-params policy a neutral home neither orchestrator
  owns.
- Freeze the already-correct submission transaction boundary as an explicit
  invariant plus one characterization test.
- Map existing behavior coverage to invariants so "preserve behavior" is
  checkable, not a slogan.
- Make every move independently verifiable with existing specs plus one new
  characterization test.

**Non-Goals**
- Change or optimize SQL, transactions, or indexes during any move.
- Introduce injectable services, providers, interfaces, outcome structs, state
  machines, or frameworks in this change.
- Extract stores, runners, fixture relocation, projection input, the types
  file, or the resume-stage decision before the stop-and-reassess gate.
- Reduce LOC as a goal; deletion is limited to moved code and one wrong
  dependency edge.

## Boundary and Ownership

### Transaction ownership invariant

`MercadoPublicoV2SyncControlService.submitCommand()` MUST remain the
transaction owner for command submission. Any collaborator extracted from the
submission path MUST receive the existing `EntityManager`; it MUST NOT open an
independent transaction for work that currently participates in the submission
transaction. Queue dispatch MUST occur only after the submission transaction
has successfully completed.

Today the code already honors this: command find/insert, audit append, run
create/reuse/cancel/resume, and result persistence run inside one
`coreDataSource.transaction(...)`; `dispatch()` runs after the transaction
resolves. This change freezes the contract — production comment, OpenSpec
requirement, and one characterization test — instead of introducing a
transaction-coordinator service that would only hide a boundary that is
currently easy to see.

The ordering test lives at the `submitCommand` seam because it is the only
place the boundary is observable end-to-end: a test of `dispatch()` or
`createRunOrReuse()` alone cannot prove commit-before-dispatch.

### Shared pure request policy

`buildCompraAgilRequestParams` moves to
`services/utils/mercado-publico-v2-sync-request-params.util.ts`. The function
has no DB, no queue, no Nest state, no injected dependency, and no lifecycle.
An injectable `SyncRequestPolicyService` would add a class, constructor,
provider registration, two constructor injections, test mocks, and module
wiring to encapsulate a pure function — an abstraction with one implementation.

Result:

```text
              ┌──────────────────────────┐
SyncControl ─▶│ sync-request-params util │
DurableSync ─▶│                          │
              └──────────────────────────┘
```

instead of:

```text
SyncControl ──▶ DurableSync file ──┐
                                   └─ pure helper
```

### Deferred hydration recovery

`recoverDeferredHydrations()` moves from SyncControl to DurableSync because
the operation manipulates `sync_run_item`, deferred hydration, recovery
attempts, and `DurableSync.start()` — the durable execution lifecycle, not
command control. The cron depends on DurableSync directly:

```text
MercadoPublicoV2DebtRecoveryCronJob
                │
                ▼
MercadoPublicoV2DurableSyncService
                │
                └── recoverDeferredHydrations()
```

A new `DeferredHydrationRecoveryService` is rejected: it would have one
caller, one execution dependency on DurableSync, one DB dependency, and one
config dependency, and it would add provider wiring to a module that already
registers DurableSync, SyncControl, projection, replay, jobs, and crons.

DurableSync already injects `MercadoPublicoConfigService`, `DataSource`, and
a logger, so the move adds no dependency. The batch-limit constant and the two
existing recovery tests move with the method, behavior unchanged. The
`SyncControl -> DurableSync` constructor dependency disappears entirely.
Module provider registrations stay unchanged because both services are
already registered.

SyncControl concentrates on command submission, claim, finalize, cancel,
resume, dispatch recovery, and operator-facing run state.

### Behavior-preservation matrix

The existing suites already characterize most of the contract. The matrix
documents what protects which invariant; new tests are added only for
uncovered invariants. No contract-test suite is duplicated.

| Invariant | Existing characterization |
|---|---|
| malformed idempotency key rejected before persistence | SyncControl spec |
| same-workspace active run is reused | SyncControl spec |
| foreign workspace run identity is not leaked | SyncControl spec |
| concurrent starts produce one global active run | SyncControl spec |
| retryable command is deferred with retryLimit=0 | SyncControl spec |
| deferred hydration is skipped when fresher detail exists | recovery tests (moved with the method) |
| 429 without Retry-After uses recorded quota reset | DurableSync spec |
| resumed run keeps checkpoint/page-budget behavior | existing-run spec |
| cancellation preserves durable checkpoint semantics | existing-run spec |
| queue dispatch occurs after submission transaction | NEW characterization test |

## Decisions

1. Freeze the transaction boundary; do not extract a coordinator.

   Rationale: the production code already structures the boundary correctly.
   A `TransactionCoordinatorService`, repository layer, or unit-of-work
   wrapper would hide a contract that is currently visible at a glance.

   Alternatives considered:
   - Transaction coordinator or unit-of-work abstraction.
     - Rejected because it adds a layer with one caller and zero behavior
       gain.
   - Transactional outbox for dispatch.
     - Rejected because it changes queue/schema semantics, which this change
       explicitly promises not to touch; an outbox is a separate capability
       and a separate change.

2. Pure util, not injectable service, for the shared request policy.

   Rationale: the function has no state and no lifecycle; a pure util is the
   smallest testable unit and matches `drivers/api/utils`.

   Alternatives considered:
   - `SyncRequestPolicyService` injectable.
     - Rejected because it adds provider wiring, injection, and mocks around
       a pure function (yagni: abstraction with one implementation).

3. Recovery moves into DurableSync, not into a new service.

   Rationale: DurableSync is the execution lifecycle owner and already has
   every dependency the method needs; the move deletes a whole edge and adds
   no new file or provider.

   Alternatives considered:
   - `DeferredHydrationRecoveryService`.
     - Rejected because it has one caller and would add provider wiring to an
       already large module (yagni: layer with one caller).
   - Leave recovery in SyncControl.
     - Rejected because it forces SyncControl to depend on DurableSync for
       work that is not command control.

4. No state services or stores in this change.

   Rationale: `SyncRunStateService`, `SyncCommandStateService`, and store
   extractions are speculative while the current private transaction-local
   methods make the participating `EntityManager` extremely visible
   (`createRunOrReuse`, `requestCancellation`, `appendAudit` all receive it).
   Hiding that behind `commandStateService.cancel(...)` would shorten LOC but
   obscure transaction ownership — a property more important than LOC.
   DurableSync being large does not by itself prove a repository abstraction
   is correct.

   Alternatives considered:
   - Extract state services now.
     - Rejected; deferred behind the stop-and-reassess gate. A future
       extraction must show a cohesive independently-owned responsibility, a
       clear owner, a meaningful reduction in orchestration complexity, and
       no hidden transaction boundary.

5. No `WatermarkService`.

   Rationale: SyncControl reads the watermark through the transaction
   `EntityManager`; DurableSync reads it via `coreDataSource.query` outside
   that transaction. The apparent duplication makes an important semantic
   difference visible. Two similar queries are cheaper than one incorrect
   abstraction.

   Alternatives considered:
   - Shared watermark store.
     - Rejected; recorded as deliberate debt with a third-consumer trigger.

6. No `getMaxPages` unification.

   Rationale: SyncControl throws `UserInputError`; DurableSync throws `Error`.
   Unifying them would change an observable error contract.

   Alternatives considered:
   - Shared validator.
     - Rejected until error semantics are explicitly normalized; recorded as
       deliberate debt.

7. `SyncCommandJob` untouched.

   Rationale: the worker is 73 lines of orchestration glue between
   SyncControl and DurableSync and already works. Lean already; adding
   abstraction would not simplify it.

   Alternatives considered:
   - Refactor the worker.
     - Rejected (delete: no modification).

8. Behavior matrix instead of a duplicate contract suite.

   Rationale: the behavior is already tested once per invariant; duplicating
   suites would mean the same behavior tested twice with two fixture systems
   and maintained twice. Document what already protects the contract, fill
   only the actual hole (queue-after-commit ordering).

   Alternatives considered:
   - New `maintainability-contract.spec.ts` re-testing everything.
     - Rejected as test bloat.

9. `resolve-v2-sync-run-stage` extraction deferred.

   Rationale: the resume-stage dedup is a real candidate, but this change
   ships the minimal set of cuts and then re-measures. The util must pass the
   same reassess gate as every other future extraction.

   Alternatives considered:
   - Include it now.
     - Rejected to keep the diff functional-minimal and the reassess signal
       clean.

## Ponytail Debt Ledger

Deliberate duplications recorded with a ceiling and an upgrade trigger.

### Debt 1 — duplicate watermark query

```text
ponytail:
duplicate watermark read kept intentionally to preserve explicit
transaction ownership; extract only if a third consumer appears or
the query contract materially changes.
```

Ceiling: 2 implementations.
Upgrade trigger: third caller OR watermark query semantics change in multiple
places.

### Debt 2 — separate maxPages validators

```text
ponytail:
maxPages validation remains duplicated because SyncControl exposes
UserInputError while DurableSync currently exposes Error; unify only
after error semantics are explicitly normalized.
```

Ceiling: 2 validators.
Upgrade trigger: shared error contract established OR third validator appears.

## Blast Radius

### Touched runtime areas
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/`
  — one new pure util file, two edited service files (SyncControl and
  DurableSync), plus their spec files.
- `crons/jobs/mercado-publico-v2-debt-recovery.cron.job.ts` — constructor
  dependency swap only.
- `mercado-publico.module.ts` — no change; both services are already
  registered providers.

### Untouched runtime areas
- `mp` schema, GraphQL resolvers and types, BullMQ jobs and payloads, queue
  names, guards, read services, drivers/api (axios stays encapsulated),
  frontend, migrations, evidence replay service, fixture surface,
  `SyncCommandJob`, projection service.

## Verification Strategy

- Phase 0: record baseline commit SHA and green status of the targeted
  suites; record pre-existing failures before any production change.
- Characterization: queue-after-commit ordering test added before production
  moves and green on the unchanged code.
- Per move: one cohesive move, then focused suites plus unchanged existing
  specs, then typecheck/lint; the moved recovery tests pass with behavior
  unchanged.
- Final gate: full mp suites, server and front typecheck, lint, diff-check,
  and explicit proof of zero schema/GraphQL/queue diff.
- Stop-and-reassess: after the minimal cuts, re-measure both services; do not
  pre-authorize a second extraction wave.
