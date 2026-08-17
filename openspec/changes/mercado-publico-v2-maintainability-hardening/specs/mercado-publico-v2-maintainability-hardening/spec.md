## ADDED Requirements

### Requirement: Command submission keeps one transaction owner
`MercadoPublicoV2SyncControlService.submitCommand()` SHALL remain the
transaction owner for command submission. Any collaborator extracted from the
submission path SHALL receive the existing `EntityManager` and SHALL NOT open
an independent transaction for work that currently participates in the
submission transaction. Queue dispatch SHALL occur only after the submission
transaction has successfully completed.

#### Scenario: An extraction touches the submission path
- **WHEN** a persistence helper is extracted from `submitCommand()`
- **THEN** the helper receives the existing transaction `EntityManager` and
  opens no new transaction

#### Scenario: Dispatch waits for the transaction
- **WHEN** a start command produces a queued result
- **THEN** the transaction commits before the queue job is added, and a
  characterization test proves the ordering at the `submitCommand` seam

### Requirement: Shared request policy lives in one neutral pure util
The system SHALL provide `buildCompraAgilRequestParams` in
`services/utils/mercado-publico-v2-sync-request-params.util.ts` as a pure
function with no DB, queue, Nest state, injected dependency, or lifecycle. Both
`MercadoPublicoV2DurableSyncService` and `MercadoPublicoV2SyncControlService`
SHALL import it from the util; neither SHALL export or own it. No injectable
service SHALL be created for it.

#### Scenario: Both orchestrators build request parameters
- **WHEN** DurableSync creates a run or SyncControl previews one
- **THEN** both derive parameters from the same pure util import and the
  implementation text is unchanged

### Requirement: Deferred hydration recovery belongs to DurableSync
The system SHALL own `recoverDeferredHydrations()` in
`MercadoPublicoV2DurableSyncService`. `MercadoPublicoV2DebtRecoveryCronJob`
SHALL depend on `MercadoPublicoV2DurableSyncService` and call it directly.
`MercadoPublicoV2SyncControlService` SHALL have no
`MercadoPublicoV2DurableSyncService` dependency. Recovery behavior SHALL stay
identical: due `deferred` items are claimed with the same backoff SQL and
dispatched as focused `'recovery'` runs, skipping items whose observation is
already fresher.

#### Scenario: The cron dispatches recovery runs
- **WHEN** the debt recovery cron handles due deferred items
- **THEN** it calls `recoverDeferredHydrations()` on DurableSync and the
  existing recovery characterization tests pass moved, with behavior
  unchanged

#### Scenario: SyncControl is free of the execution dependency
- **WHEN** the edge removal lands
- **THEN** the SyncControl constructor injects no DurableSync service and the
  module provider registrations stay unchanged

### Requirement: Behavior preservation is pinned against a recorded baseline
The system SHALL record a baseline commit SHA and green status of the targeted
Mercado Publico V2 suites before any code move, and SHALL treat any
pre-existing failure as recorded baseline state. The behavior-preservation
matrix in `design.md` SHALL be the authoritative map from invariants to their
existing characterization suites. Tests SHALL be added only for uncovered
invariants; behavior already characterized by existing suites SHALL NOT be
re-tested in a duplicate contract suite.

#### Scenario: Baseline precedes moves
- **WHEN** implementation begins
- **THEN** the baseline result is recorded and reproducible, and no
  extraction starts until it is

#### Scenario: A move preserves its mapped invariant
- **WHEN** a pure-util or recovery move lands
- **THEN** the existing suites mapped by the matrix stay green unchanged and
  only the new queue-after-commit test is added

### Requirement: No premature abstractions in this change
The system SHALL NOT introduce injectable state services, repository
interfaces, outcome structs, store services, a transactional outbox, or a
watermark service in this change. `SyncCommandJob` SHALL stay unmodified. A
further extraction SHALL be authorized only when it names one cohesive
responsibility with a clear owner, meaningfully reduces orchestration
complexity, and hides no transaction boundary.

#### Scenario: A speculative abstraction is proposed
- **WHEN** a service would have one caller or one implementation and no new
  behavior
- **THEN** the change defers it behind the stop-and-reassess gate instead of
  adding provider wiring

### Requirement: Release readiness proves operational guarantees
The system SHALL provide a runbook documenting start, cancel, inspect, recover,
429 handling, stuck-run handling, Redis restart, and DB failure procedures
after all moves verify green. The runbook SHALL document the ownership split:
SyncControl owns command and transaction lifecycle; DurableSync owns execution
and deferred hydration recovery; the request-params util is shared pure policy.

#### Scenario: Final gate passes
- **WHEN** the full Mercado Publico suites, typechecks, lint, and diff checks
  are green and no schema, GraphQL, queue, or payload diff exists
- **THEN** the runbook is published and OpenSpec validation passes
