## 0. Scope and schema

- [ ] 0.1 Record the G3 decision that replaces Issue 29's incompatible-scope
  queue with one global run and durable outbox recovery.
  Traceability: Group G3; Issue 29; AC 29.1 superseded by confirmed G3 scope.

- [ ] 0.2 Generate one additive fast instance command for operator, command,
  attempt, audit, owner, cancellation, heartbeat, and one-active-run state.
  Define the guarded `down` before runtime work.
  Traceability: Group G3; Issue 28; Issue 29; durable schema and rollback.

## 1. Failing proof

- [ ] 1.1 Add failing tests for explicit human operator access and denial of
  analyst, unassigned administrator, API key, and application.
  Traceability: Group G3; Issue 28; AC 28.1.

- [ ] 1.2 Add failing transactional tests for idempotency replay/conflict,
  same- and foreign-workspace reuse, one global run, outbox recovery, and
  immutable audit.
  Traceability: Group G3; Issue 28; AC 28.2, AC 28.3; Issue 29; AC 29.1,
  AC 29.4, AC 29.5.

- [ ] 1.3 Add failing worker tests for no synchronous provider call, duplicate
  no-op, stale heartbeat recovery, queued cancellation, active cooperative
  cancellation, checkpoints, and permitted resume.
  Traceability: Group G3; Issue 28; AC 28.4, AC 28.6; Issue 29; AC 29.2,
  AC 29.3, AC 29.5.

## 2. Implementation

- [ ] 2.1 Apply the generated instance command. Add the explicit operator
  management command and document its deployment use.
  Traceability: Group G3; Issue 28; AC 28.1.

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
