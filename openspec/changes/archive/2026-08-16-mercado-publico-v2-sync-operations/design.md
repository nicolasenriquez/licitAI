## Context

`MercadoPublicoV2DurableSyncService.start()` creates a run and immediately
calls the provider. G3 must create the run before dispatch, then let only a
queue worker execute that existing run. The current settings-permission model
also grants all settings permissions to `canUpdateAllSettings` roles, so a
standard permission flag cannot meet the requirement that administrators do
not receive implicit sync control.

## Chosen Design

### Authorization and visibility

`mp.sync_operator` is the sole control authorization source. It contains
`workspace_id`, `user_workspace_id`, assignment metadata, and a unique pair.
The new control guard accepts only a human session whose pair exists in this
table. It rejects API keys and applications. A documented operational command
adds or removes members; G3 has no management page.

Each command has `workspace_id` and actor identity. Each newly created run has
`control_workspace_id`. Control reads filter by workspace. Another workspace's
active run is represented only as the safe result `global_sync_active`.

### Command and outbox state

`mp.sync_command` persists UUID `idempotency_key`, action (`start`, `resume`,
or `cancel`), request fingerprint, actor, workspace, linked run when visible,
state, and timestamps. The unique key is `(workspace_id, idempotency_key)` and
never expires. The same key and fingerprint returns the saved result; a
different intent returns `409 Conflict`.

The command is the outbox. After the command transaction commits, the resolver
tries to enqueue its ID. Redis failure still returns `queued`; the existing
`cronQueue` runs a one-minute recovery job that dispatches pending commands
and commands whose worker heartbeat expired. Normal provider and process
failures are terminal and are never automatically retried.

Workers claim a command with a conditional state update. Duplicate BullMQ
messages and jobs for terminal commands are no-ops.

### One active run

The only start option is `scope = global` and `intent = incremental`. A
partial unique index on `mp.sync_run(source, scope)` covers nonterminal V2
states. A transaction attempts to create the run; on unique conflict it loads
the active run.

- Same workspace: record `reused` and return its safe run status.
- Different workspace: record `reused` and return only `global_sync_active`.

No `sync_write_lease`, FIFO queue, filtered scope, or backfill exists in G3.

### Execution, recovery, and cancellation

The worker calls new existing-run entry points in the durable service. It does
not call `start()`, which creates a second run. It writes a heartbeat to
`mp.sync_run.updated_at` before and after each atomic page or item boundary.
A stale heartbeat is older than the worst configured HTTP attempt plus a small
fixed safety margin. Recovery claims the same command and continues only from
durable checkpoints.

Queued cancellation sets command and run to `cancelled`; the queued BullMQ job
then does nothing. Active cancellation records `cancellation_requested_at` and
actor fields. The durable service checks it before the next discovery page and
before the next hydration or projection item. It finishes the current atomic
operation, retains evidence and checkpoints, then records `cancelled`.

Only a `partial_failed` or `cancelled` run whose discovery completed is
recoverable. Resume uses a new idempotent command but requires no confirmation.
Cancelling terminal runs returns `409 Conflict`.

### Audit and UI

`mp.sync_run_attempt` stores worker attempts. `mp.sync_run_audit` is
append-only and stores command creation, reuse, dispatch, claim, heartbeat
recovery, cancel request, cancellation completion, and outcome. It retains the
full actor and command references. The UI shows only the latest workspace run
and its complete timeline: visible operator name, timestamp, safe state,
counts, retryability, and sanitized summary. It never shows internal IDs,
payloads, idempotency keys, foreign data, or technical causes.

Start and cancel require a confirmation dialog and `confirmed: true`. Resume
does not. The route may hide navigation for non-operators, but the server guard
is authoritative for every direct query and mutation.

## Migration and rollback

Generate one additive fast instance command. It creates `sync_operator`,
`sync_command`, `sync_run_attempt`, and `sync_run_audit`; adds control owner,
cancellation, and heartbeat fields to `sync_run`; and creates the partial
unique index. It must handle existing unowned V2 runs as foreign safe state.

`down` fails if any G3 command, attempt, audit, operator assignment, or control
run data exists. Route and resolver removal disables the feature without data
deletion.

## Verification

- Direct GraphQL tests prove human-operator access, analyst/API-key/application
  denial, confirmation, key replay, conflict, and no provider in the request.
- Transactional tests prove one active global run, same- and foreign-workspace
  reuse, outbox recovery, stale-worker claim, terminal no-op, cancellation, and
  immutable audit.
- Durable-service tests prove existing-run execution, atomic cancellation
  checks, checkpoints, and permitted resume.
- Playwright proves confirmation, safe latest-run timeline, denial, keyboard
  operation, and responsive rendering.
