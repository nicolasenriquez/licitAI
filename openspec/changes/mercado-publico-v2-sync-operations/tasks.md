## 0. Scope and schema

- [x] 0.1 Record the G3 decision that replaces Issue 29's incompatible-scope
  queue with one global run and durable outbox recovery.
  Traceability: Group G3; Issue 29; AC 29.1 superseded by confirmed G3 scope.
  Notes: Reconciled against `proposal.md` Decisions That Narrow the Source Issue
  and `design.md` One active run. G3 records `global_sync_active` reuse and
  durable outbox recovery; no incompatible-scope queue is implemented.

- [x] 0.2 Generate one additive fast instance command for operator, command,
  attempt, audit, owner, cancellation, heartbeat, and one-active-run state.
  Define the guarded `down` before runtime work.
  Traceability: Group G3; Issue 28; Issue 29; durable schema and rollback.
  Notes: Added and registered `MpV2SyncOperationsFastInstanceCommand` at
  `2-16.0/1791000000000`. It adds G3 tables, control fields, partial unique
  index, and data-preserving guarded rollback. Focused migration spec covers
  schema presence and rollback guard. Jest 3/3, server typecheck, direct
  oxlint, `git diff --check`, and `openspec validate` pass. Generator invocation
  could not connect to host PostgreSQL; the raw-SQL command was added in the
  repository's generated-command style.

## 1. Failing proof

- [x] 1.1 Add failing tests for explicit human operator access and denial of
  analyst, unassigned administrator, API key, and application.
  Traceability: Group G3; Issue 28; AC 28.1.
  Notes: Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/graphql/__tests__/mercado-publico-v2-sync-control.resolver.spec.ts`.
  Failing as intended: imports the not-yet-implemented
  `mercado-publico-v2-sync-control.resolver`,
  `guards/mercado-publico-v2-sync-operator.guard`, and
  `services/mercado-publico-v2-sync-control.service`. Assumed API:
  `MercadoPublicoV2SyncControlResolver`/`MercadoPublicoV2SyncControlNamespaceResolver`
  guarded by `[WorkspaceAuthGuard, MercadoPublicoV2SyncOperatorGuard]`;
  namespace fields `latestRun`, `start`, `resume`, `cancel`; service methods
  `isOperator`, `submitCommand`, `getLatestRun`; guard throws
  `PermissionsException` and never consults assignments for apiKey or
  application requests. Start/cancel require `confirmed`; resume does not.

- [x] 1.2 Add failing transactional tests for idempotency replay/conflict,
  same- and foreign-workspace reuse, one global run, outbox recovery, and
  immutable audit.
  Traceability: Group G3; Issue 28; AC 28.2, AC 28.3; Issue 29; AC 29.1,
  AC 29.4, AC 29.5.
  Notes: Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/services/__tests__/mercado-publico-v2-sync-control.service.spec.ts`.
  Failing as intended: module not found. Assumed API: ctor
  `(dataSource, messageQueueService)`; `submitCommand` returns
  `{state:'queued'|'reused'|'global_sync_active'|'cancelled', syncRunId?}`.
  Replay of same key and fingerprint returns saved result without a new
  command insert; changed request rejects with 409/conflict; unique violation
  (23505) on `mp.sync_run` falls back to active-run reuse, exactly one insert
  attempted; foreign owner returns only `global_sync_active` with no foreign
  run data; enqueue failure still returns `queued` and never marks the
  command failed; audit is INSERT-only.

- [x] 1.3 Add failing worker tests for no synchronous provider call, duplicate
  no-op, stale heartbeat recovery, queued cancellation, active cooperative
  cancellation, checkpoints, and permitted resume.
  Traceability: Group G3; Issue 28; AC 28.4, AC 28.6; Issue 29; AC 29.2,
  AC 29.3, AC 29.5.
  Notes: Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/jobs/__tests__/mercado-publico-v2-sync-command.job.spec.ts`
  (fails: module not found; assumed `MercadoPublicoV2SyncCommandJob.handle({commandId})`
  delegating to `claimCommand(commandId, workerId)` returning
  `{kind:'claimed',syncRunId,attemptId}|{kind:'noop',reason}`, then
  `executeExistingRun(syncRunId)`, never `start()`, no provider dependency)
  and
  `packages/twenty-server/src/engine/core-modules/mercado-publico/services/__tests__/mercado-publico-v2-durable-sync.service.existing-run.spec.ts`
  (fails: `executeExistingRun is not a function`). Existing-run proof: no
  second `sync_run` insert; cooperative cancel stops after one provider page,
  keeps the page checkpoint, records `cancelled`; resume hydrates only
  discovery-complete runs and rejects discovery-failed and terminal runs.

## 2. Implementation

- [x] 2.1 Apply the generated instance command. Add the explicit operator
  management command and document its deployment use.
  Traceability: Group G3; Issue 28; AC 28.1.
  Notes: Migration applied by registration: `MpV2SyncOperationsFastInstanceCommand`
  imported and listed in `INSTANCE_COMMANDS`
  (`packages/twenty-server/src/database/commands/upgrade-version-command/instance-commands.constant.ts`);
  focused migration spec passes (3/3). Added
  `packages/twenty-server/src/engine/core-modules/mercado-publico/commands/mercado-publico-sync-operator.command.ts`
  (`mercado-publico:sync-operator`, options `-w`, `-u`, `-a`, `--remove`,
  idempotent upsert + delete against `mp.sync_operator`) and registered it in
  `mercado-publico.module.ts`. Documented deployment use in
  `docs/operations/mercado-publico-compra-agil-v2.md` (schema ships via
  `database:migrate:prod`; assignment policy: no implicit admin control).
  Runtime application to a database happens on the next standard upgrade run.

- [ ] 2.2 Add the control guard, control service, and GraphQL namespace.
  Persist and replay start, resume, and cancel commands. Create the run before
  dispatch. Do not call a provider in the resolver.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.4, AC 28.6.

- [ ] 2.3 Add existing-run execution to the durable service and the queue
  worker. Claim commands idempotently, heartbeat atomic boundaries, enforce the
  partial index, and append audit and attempts.
  Traceability: Group G3; Issue 28; AC 28.3, AC 28.4; Issue 29; AC 29.1,
  AC 29.4.

- [ ] 2.4 Add the one-minute existing `cronQueue` recovery command and job.
  Re-dispatch pending commands and stale workers only; do not retry normal
  failed runs.
  Traceability: Group G3; Issue 28; AC 28.2; Issue 29; AC 29.5.

- [ ] 2.5 Add cooperative cancellation at discovery-page and item boundaries.
  Keep checkpoints and evidence; allow only the selected resume states.
  Traceability: Group G3; Issue 28; AC 28.4; Issue 29; AC 29.2, AC 29.3.

- [ ] 2.6 Add the guarded Centro de control route, operator navigation,
  confirmation dialog, and latest-run safe timeline.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.5; Issue 29;
  AC 29.4.

## 3. Verification and closeout

- [ ] 3.1 Run focused migration, GraphQL, control-service, queue-worker,
  durable-sync, and concurrency tests.
  Traceability: Group G3; Issue 28; AC 28.1 through AC 28.6; Issue 29;
  AC 29.1 through AC 29.5.

- [ ] 3.2 Run isolated operator and analyst Playwright checks for confirmation,
  safe state, denial, keyboard operation, and responsive rendering.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.5, AC 28.6;
  Issue 29; AC 29.2, AC 29.5.

- [ ] 3.3 Run GraphQL codegen, changed-file lint, typechecks, formatting,
  `git diff --check`, and `openspec validate mercado-publico-v2-sync-operations`.
  Traceability: Group G3; Issue 28; Issue 29; quality gate.
