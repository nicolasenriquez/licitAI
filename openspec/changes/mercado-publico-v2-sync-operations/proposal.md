## Why

Mercado Público V2 has a durable synchronization engine, but no safe product
control boundary. The CLI queue adapter is not an authenticated interface and
does not persist human commands, command replay, operator authorization, or a
safe audit trail.

## What Changes

- Add a human-operator-only Centro de control for global incremental start,
  resume, status, and cancel.
- Persist operator membership, commands, attempts, and immutable audit in
  `mp`. A confirmed start creates its `SyncRun` before queue dispatch.
- Use `sync_command` as a small durable outbox. The existing `cronQueue`
  re-dispatches pending commands and stale workers.
- Allow one global V2 run at a time with a partial unique index on
  `mp.sync_run`; do not add a lease table or an incompatible-scope queue.
- Keep GraphQL requests free of provider work. Only the queue worker calls
  `MercadoPublicoV2DurableSyncService`.

## Scope

The first control screen exposes only global incremental start, resume, and
cancel. It does not expose filters, backfills, API-key access, application
access, or a web page for operator management. An operational command assigns
or removes `mp.sync_operator` members.

An operator sees its workspace's latest run and complete safe timeline. If a
different workspace already owns the global run, a confirmed start records a
local `reused` command and returns only `global sync active`. It exposes no
foreign run ID, actor, progress, or audit.

## Decisions That Narrow the Source Issue

Issue 29 originally requested a visible queue for incompatible scopes. The
human decision for G3 removes operator-selectable scopes. The replacement is a
single global incremental run with active-run reuse and a partial unique index.
The durable outbox remains; it recovers dispatch failure and worker loss, not
alternative scopes.

## Non-Goals

- Provider calls from web requests, a second ingestion pipeline, a new queue
  system, a scheduler for provider ingestion, or automatic retry after a
  normal provider or process failure.
- Filters, backfills, re-discovery controls, global control history, audit
  search, API keys, applications, V1, CSV, and legacy changes.
- Deleting commands or audit data during rollback.

## Ownership and Proof

`MercadoPublicoV2SyncControlService` owns operator checks, commands, replay,
outbox dispatch, attempts, and audit. `MercadoPublicoV2DurableSyncService`
remains the worker-only engine. The highest proof seam is the guarded GraphQL
control boundary plus transactional command creation and queue recovery.

## Impact

- `packages/twenty-server`: `mp` command, control service, worker adapter,
  operator command, GraphQL guard, and existing cron queue.
- `packages/twenty-front`: Centro de control route and operator-only
  navigation.
- `packages/twenty-e2e-testing`: human operator and analyst sessions.

G3 remains limited to issues 28 and 29. It does not alter the separate G2 or
ingestion-backbone changes.
