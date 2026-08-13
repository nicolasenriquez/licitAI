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

- [x] 2.2 Add the control guard, control service, and GraphQL namespace.
  Persist and replay start, resume, and cancel commands. Create the run before
  dispatch. Do not call a provider in the resolver.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.4, AC 28.6.
  Notes: Added
  `guards/mercado-publico-v2-sync-operator.guard.ts` (human session + explicit
  `mp.sync_operator` assignment only; rejects apiKey/application before any
  query), `services/mercado-publico-v2-sync-control.service.ts` (`isOperator`,
  `submitCommand`, `getLatestRun`; fingerprint replay vs `409 Conflict`;
  one-run partial index reuse same/foreign workspace; command insert before
  run insert; audit INSERT-only with inline event types; enqueue failure keeps
  `queued` and dispatchable), and
  `graphql/mercado-publico-v2-sync-control.resolver.ts` (root
  `mercadoPublicoV2SyncControl` query + namespace `latestRun`, `start`,
  `resume`, `cancel`; start/cancel require `confirmed: true`; no provider or
  durable engine in the resolver). Registered all in
  `mercado-publico.module.ts`; added
  `MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME` constant. 1.1/1.2 failing-proof
  suites now pass (21/21). Two fixture corrections, recorded here: the 1.2
  replay test stored a placeholder fingerprint that can never equal the
  computed one, so it now uses `buildMercadoPublicoV2SyncCommandFingerprint`;
  run-insert mock conditions use `'INSERT INTO mp.sync_run ('` so audit
  inserts into `mp.sync_run_audit` no longer match them. Lint 0/0, oxfmt fix
  applied. Typecheck deferred (1.3 failing-proof imports unresolved until
  2.3).

- [x] 2.3 Add existing-run execution to the durable service and the queue
  worker. Claim commands idempotently, heartbeat atomic boundaries, enforce the
  partial index, and append audit and attempts.
  Traceability: Group G3; Issue 28; AC 28.3, AC 28.4; Issue 29; AC 29.1,
  AC 29.4.
  Notes: Added
  `jobs/mercado-publico-v2-sync-command.job.ts`
  (`@Processor(MessageQueue.mercadoPublicoQueue)`,
  `@Process(MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME)`; handle = conditional
  claim then `executeExistingRun`; no provider dependency; no `start()` call).
  Added `claimCommand` to
  `services/mercado-publico-v2-sync-control.service.ts` (terminal/duplicate
  and queued-cancel no-op; conditional `UPDATE ... WHERE state = 'pending'`
  claim; appends `mp.sync_run_attempt` row and `claimed` audit; sets run
  heartbeat). Added `executeExistingRun` to
  `services/mercado-publico-v2-durable-sync.service.ts`: validates terminal
  and discovery-failed runs, runs queued runs from discovery, resumes
  active-discovery runs from the next checkpoint page, resumes hydration for
  `partial_failed`/`cancelled`/active hydration states, resets stuck
  `processing` items, touches heartbeats at page and item boundaries, and
  returns `cancelled` cooperatively between discovery pages while keeping
  checkpoints. `MercadoPublicoV2DurableSyncResult.status` gains `'cancelled'`.
  Registered the job in `mercado-publico.module.ts`. Fixture corrections in
  the 1.3 existing-run spec: item-select mock checked before the
  `FROM mp.sync_run` mock (substring collision with
  `FROM mp.sync_run_item`), and the projection transaction mock now returns an
  observation id for `INSERT INTO mp.v2_observation`. Focused suites 10/10;
  full mercado-publico module 78 suites / 538 tests pass; lint 0/0; oxfmt fix
  applied.

- [x] 2.4 Add the one-minute existing `cronQueue` recovery command and job.
  Re-dispatch pending commands and stale workers only; do not retry normal
  failed runs.
  Traceability: Group G3; Issue 28; AC 28.2; Issue 29; AC 29.5.
  Notes: Added
  `crons/jobs/mercado-publico-v2-sync-recovery.cron.job.ts`
  (`@Processor(MessageQueue.cronQueue)`, one-minute pattern `* * * * *`);
  computes stale-heartbeat margin from managed config
  (`(timeout + backoff) * (retries + 1) + 60s`), calls
  `recoverDispatches`, then re-enqueues returned command ids on
  `mercadoPublicoQueue`. Added
  `crons/commands/mercado-publico-v2-sync-recovery.cron.command.ts`
  (`cron:mercado-publico:sync-recovery`) registering the repeat job. Added
  `recoverDispatches` to the control service: pending commands without a
  recent dispatch are re-dispatched; stale claimed commands whose run is
  still active are reset to `pending` (attempt marked `stale`, audit
  `heartbeat_recovery`) and re-dispatched; stale claimed commands whose run
  is terminal are closed from the run status and never re-dispatched, so
  normal failed runs are not retried. Both registered in
  `mercado-publico.module.ts`. Resolver auth params made optional to match
  the 1.1 proof contract, and `tsgo` passes for the first time since 1.x
  (all failing-proof imports now implemented). Full module 78 suites / 538
  tests pass; lint 0/0; oxfmt fix applied.

- [x] 2.5 Add cooperative cancellation at discovery-page and item boundaries.
  Keep checkpoints and evidence; allow only the selected resume states.
  Traceability: Group G3; Issue 28; AC 28.4; Issue 29; AC 29.2, AC 29.3.
  Notes: Page-boundary cancellation already landed in 2.3; this task adds the
  item boundary: `hydrate` now checks `cancellation_requested_at` before every
  item after the first and returns `'cancelled'`, finishing the current atomic
  item and keeping checkpoints/evidence; the run is recorded `cancelled` with
  its phase in `error_stage` (`discovering`/`hydrating`) via `cancelRun`. A
  new `hydrateOrFinish` helper routes hydrate cancellation to `cancelRun`
  instead of `finishRun`. Resume-state selection is enforced in
  `assertResumableRun` inside the control service: resume commands are only
  accepted for workspace-owned runs with status `partial_failed` or
  `cancelled` whose `error_stage` is not `discovering`; everything else
  returns `409 Conflict`. `executeExistingRun` extends the rediscover guard to
  cancelled runs that failed during discovery. Full module 78 suites / 538
  tests pass; typecheck passes; lint 0/0; oxfmt fix applied.

- [x] 2.6 Add the guarded Centro de control route, operator navigation,
  confirmation dialog, and latest-run safe timeline.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.5; Issue 29;
  AC 29.4.
  Notes: Added `AppPath.MercadoPublicoV2SyncControl`
  (`/mercado-publico/centro-de-control`) in twenty-shared; added the guarded
  route in `useCreateAppRouter.tsx` and the nav link in
  `MercadoPublicoV2Nav.tsx`. Added
  `pages/mercado-publico/MercadoPublicoV2SyncControlPage.tsx` with latest-run
  status, start/cancel/resume actions (custom confirmation dialog;
  start/cancel require `confirmed: true`; fresh UUID idempotency keys; no
  internal IDs or payloads rendered), and a sanitized timeline of audit events
  with visible operator names. Extended the backend namespace:
  `MercadoPublicoV2LatestRunDTO` now exposes `syncRunId`, `startedAt`,
  `updatedAt`, `safeStatus`, and `timeline` events; `getLatestRun` builds the
  timeline from `mp.sync_run_audit` joined through `mp.sync_command` and
  `core.user_workspace`/`core.user` for operator names. Server guard remains
  authoritative; non-operators see a denial card. Front/server typechecks
  pass; server sync-control specs 21/21; lint 0/0 both packages. GraphQL
  codegen was attempted but the local schema endpoint is not reachable; the
  page uses locally declared result types and codegen runs in 3.3.

## 3. Verification and closeout

- [x] 3.1 Run focused migration, GraphQL, control-service, queue-worker,
  durable-sync, and concurrency tests.
  Traceability: Group G3; Issue 28; AC 28.1 through AC 28.6; Issue 29;
  AC 29.1 through AC 29.5.
  Notes: Ran one jest invocation over the six focused suites: migration
  `2-16-instance-command-fast-1791000000000-mp-v2-sync-operations.spec.ts`,
  GraphQL `mercado-publico-v2-sync-control.resolver.spec.ts`, control service
  `mercado-publico-v2-sync-control.service.spec.ts` (includes the concurrent
  global-start case), queue worker
  `mercado-publico-v2-sync-command.job.spec.ts`, and durable sync
  `mercado-publico-v2-durable-sync.service.spec.ts` plus
  `mercado-publico-v2-durable-sync.service.existing-run.spec.ts`. 6 suites /
  39 tests pass. No cron-job spec exists in the module, so recovery is covered
  indirectly through the control-service `recoverDispatches` cases.

- [ ] 3.2 Run isolated operator and analyst Playwright checks for confirmation,
  safe state, denial, keyboard operation, and responsive rendering.
  Traceability: Group G3; Issue 28; AC 28.1, AC 28.2, AC 28.5, AC 28.6;
  Issue 29; AC 29.2, AC 29.5.

- [ ] 3.3 Run GraphQL codegen, changed-file lint, typechecks, formatting,
  `git diff --check`, and `openspec validate mercado-publico-v2-sync-operations`.
  Traceability: Group G3; Issue 28; Issue 29; quality gate.
  Notes: Partial gate evidence: `twenty-front` and `twenty-server`
  `lint:diff-with-main`, typechecks, changed-file `oxfmt`, `git diff --check`,
  and `openspec validate` pass; the sync-control resolver test passes 14/14.
  GraphQL codegen loads the Tim-authenticated schema at `localhost:3000` but
  rejects 59 stale-schema document errors, including the new sync-control
  fields. The source server could not become healthy on temporary port 3100
  within 180 seconds, so this task remains pending until codegen runs against
  the current source schema.
