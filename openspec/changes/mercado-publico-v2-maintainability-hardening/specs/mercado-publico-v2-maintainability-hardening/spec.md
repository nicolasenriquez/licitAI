## ADDED Requirements

### Requirement: Refactor preserves every external contract
The system SHALL keep the DB schema, GraphQL schema, queue names, job payloads,
API semantics, watermark semantics, retry semantics, and projection semantics
identical while internals move. A task that would change any of them SHALL stop
instead of proceeding.

#### Scenario: A slice moves internals
- **WHEN** a store, runner, or util extraction changes module internals
- **THEN** the public method signatures, return types, and persisted data
  remain identical

#### Scenario: A change touches a frozen contract
- **WHEN** a task would alter the `mp` schema, GraphQL surface, queue name, job
  payload, watermark, retry, or projection semantics
- **THEN** the task stops and the change is re-planned

### Requirement: Resume decisions come from one pure, testable function
The system SHALL decide how to resume or rediscover a sync run through a single
pure function that maps `{ status, errorStage, errorRetryable }` to
`cancelled_before_start`, `requires_rediscovery`, `discovery`, or `hydration`.
Both `resume()` and `executeExistingRun()` SHALL use it, and the decision table
SHALL be unit-tested without Nest, PostgreSQL, BullMQ, or mocks. The util SHALL
own only the shared stage decision; the terminal allowed-list guard SHALL stay
in `executeExistingRun()` and remain pinned by its existing specs.

#### Scenario: Partial failure during discovery is retryable
- **WHEN** a run has status `partial_failed`, error stage `discovering`, and a
  retryable error
- **THEN** the decision is `discovery` and the run resumes discovery from the
  next checkpointed page

#### Scenario: Failed discovery is not retryable
- **WHEN** a run failed or was cancelled during discovery without a retryable
  discovery error
- **THEN** the decision is `requires_rediscovery`

#### Scenario: The two entry points keep their intentional divergence
- **WHEN** a run has status `failed` with error stage `hydrating`
- **THEN** `resume()` proceeds to hydration while `executeExistingRun()` throws
  the existing terminal error, because the terminal guard stays in
  `executeExistingRun()`

### Requirement: Sync persistence lives behind domain-verb stores
The system SHALL move all `mp.sync_run`, `mp.source_watermark`,
`mp.sync_run_page`, quota-reset, `mp.sync_run_item`, and
`mp.sync_run_item_attempt` SQL out of `MercadoPublicoV2DurableSyncService` into
`MercadoPublicoV2SyncRunStore` and `MercadoPublicoV2SyncRunItemStore`, and all
`mp.v2_cohort` lifecycle SQL plus the current-detail read
(`mp.compra_agil`/`mp.v2_observation`) into `MercadoPublicoV2CohortStore`. The
SQL statement text SHALL be copied verbatim during extraction; query
optimization is a separate later change. Store interfaces SHALL use domain
verbs, not generic update methods. `SyncRunStore` SHALL expose the lifecycle
verbs `createSyncRun`, `checkpointPage`, `completeSyncRun`, `failSyncRun`,
`readRunCounts`, and `listObservationIds` so the fixture runner never widens
DurableSync's public surface.

#### Scenario: Extraction moves a query
- **WHEN** a query moves from DurableSync to a store
- **THEN** the SQL text and parameters are unchanged and only the call site
  changes

#### Scenario: Orchestration needs item state
- **WHEN** hydration marks an item terminal
- **THEN** it calls `markTerminal(itemId, status, errorSummary, rawApiPayloadId?)`
  instead of writing SQL inline

### Requirement: Discovery and hydration run behind their own modules
The system SHALL execute discovery through
`MercadoPublicoV2DiscoveryRunnerService` and hydration through
`MercadoPublicoV2HydrationRunnerService`. `MercadoPublicoV2DurableSyncService`
SHALL only interpret the returned string-union outcomes. Outcome structs SHALL
NOT be introduced while only one consumer reads the result.

#### Scenario: Discovery completes within page budget
- **WHEN** the discovery runner returns `page_budget_reached`
- **THEN** DurableSync continues to hydration without executing discovery logic

#### Scenario: A second consumer would need outcome fields
- **WHEN** a module other than DurableSync must read the runner result
- **THEN** an outcome struct may be introduced as a separate change, not before

### Requirement: Projection normalizes each record once
The system SHALL compute normalization, semantic payload, semantic fingerprint,
and observed time through one private `buildProjectionInput()` in
`MercadoPublicoV2ProjectionService` and reuse it at every projection site. The
returned type SHALL stay file-local until a second module consumes it.

#### Scenario: Ingest and rebuild project the same record
- **WHEN** `ingest` and `rebuild` process the same record
- **THEN** both derive their input from `buildProjectionInput()` and produce
  identical fingerprints

### Requirement: Sync control persistence moves behind two stores
The system SHALL move `mp.sync_command` and `mp.sync_run_attempt` SQL from
`MercadoPublicoV2SyncControlService` into `MercadoPublicoV2SyncCommandStore`
and `MercadoPublicoV2SyncRunAttemptStore`, both accepting
`EntityManager | DataSource` so SyncControl keeps transaction ownership.
Recovery `mp.sync_run_item` SQL SHALL go through the `SyncRunItemStore` verbs
`resetForResume` and `claimDueDeferred`, passing the `EntityManager`.
SyncControl SHALL retain policy, queue dispatch, idempotency orchestration,
operator commands, audit behavior, and a documented set of policy SQL:
the `mp.sync_operator` read, `mp.sync_run` state reads and writes,
the `mp.source_watermark` read, the workspace timeline read, and
`mp.sync_run_audit` writes.

#### Scenario: Claim within a transaction
- **WHEN** `claimCommand` claims a pending command
- **THEN** the store executes the same SQL through the passed
  `EntityManager` and SyncControl performs the audit and result mapping

#### Scenario: Recovery item updates go through the item store
- **WHEN** recovery resets items for a resumable run or claims due deferred
  items
- **THEN** SyncControl calls `resetForResume` or `claimDueDeferred` with the
  transaction `EntityManager` and writes no `mp.sync_run_item` SQL inline

### Requirement: The fixture surface lives outside the productive workflow
The system SHALL move `runFixture` and `projectPendingItems` into
`MercadoPublicoV2FixtureRunnerService` and have the E2E fixture command
delegate to it. The fixture runner SHALL depend only on stores, persistence,
and projection, calling the `SyncRunStore` lifecycle verbs (`createSyncRun`,
`checkpointPage`, `completeSyncRun`, `failSyncRun`) directly; it SHALL NOT
depend on `MercadoPublicoV2DurableSyncService` or the discovery runner.
`MercadoPublicoV2DurableSyncService` SHALL contain no fixture-specific
behavior afterwards. The `'fixture'` intent value SHALL remain valid persisted
data.

#### Scenario: E2E fixture is reset and seeded
- **WHEN** the isolated fixture command runs
- **THEN** the runner produces the same sync run results and projections as
  before the relocation

### Requirement: Release readiness proves operational guarantees
The system SHALL provide a runbook documenting start, cancel, inspect, recover,
429 handling, stuck-run handling, Redis restart, and DB failure procedures
after all slices verify green. The DurableSync invariants SHALL be documented:
no direct SQL, no axios knowledge, no fixture behavior, orchestration readable
top-to-bottom.

#### Scenario: Final gate passes
- **WHEN** the full Mercado Publico suites, typechecks, lint, and diff checks
  are green and no schema, GraphQL, queue, or payload diff exists
- **THEN** the runbook is published and OpenSpec validation passes
