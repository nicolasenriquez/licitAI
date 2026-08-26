---
type: operations-guide
title: Compra Agil V2 operator guide
description: Safe manual execution contract for the Mercado Publico Compra Agil V2 backbone.
---

# Compra Agil V2 Operator Guide

## Purpose

Run an auditable Compra Agil V2 ingestion without exposing tickets or
repeating a failed run from page one.

## Evidence Labels

- **Official**: published by Mercado Publico or ChileCompra.
- **Implemented**: enforced by this repository today.
- **Policy**: conservative operating rule chosen by this repository.
- **Unknown**: do not assume it; obtain provider confirmation or a sanitized
  fixture first.

## Sources and Contract

- **Official**: [ChileCompra API](https://www.chilecompra.cl/api/) documents
  ticket-based API access.
- **Official**: [API Compra Agil V2 guide](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
  defines the V2 endpoint, request parameters, response envelope, pagination,
  daily quota, and error contract.
- **Official**: [Compra Agil API examples](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-3-1.pdf)
  is the official examples guide. It is not a V3 API version.
- **Implemented**: V2 requests use `GET /v2/compra-agil` and send the secret
  in the `ticket` header. The ticket must come only from managed configuration.
- **Implemented**: `tamano_pagina` is at most 50,
  `numero_pagina` is a positive integer, `region` is an integer from 1 through
  16, `id` and `q` are mutually exclusive, and `ordenar_por` is propagated.
- **Implemented**: `orden` is rejected. A supplied `cambio_*` or `publicado_*`
  window must include both UTC bounds.
- **Implemented**: successful V2 envelopes use `payload.items` for lists and
  `payload` for a detail record. Raw responses remain retained for audit.

## Safe Manual Recipe

Use UTC timestamps and a complete, small publication window. Manual V2 runs
dispatch through the retained sync control surface: an assigned operator
starts, resumes, or cancels the global incremental run from Centro de control,
and the retained `MercadoPublicoV2SyncCommandJob` executes the dispatch name
below. The retired `mercado-publico:run` CLI is no longer available; the
retained `mercado-publico:sync-operator` command manages operator assignments
only.

```text
job: api-v2-compra-agil-by-publication-window
payload: {"publicado_desde":"2026-08-10T00:00:00Z","publicado_hasta":"2026-08-10T01:00:00Z","tamano_pagina":50,"ordenar_por":"FechaPublicacion"}
```

- **Policy**: make one request sequence for a new window, with no more than 50
  results requested per page.
- **Policy**: do not retry an identical HTTP 400. Correct the local payload
  from its safe error classification, then use a new run.
- **Policy**: do not paste response bodies, full headers, or tickets into logs,
  issues, fixtures, or chat. Persisted raw evidence stays in the audited store.
- **Implemented**: a command-enqueued V2 run has one durable execution key.
  Bounded queue retries resume that run from its checkpoint instead of creating
  another SyncRun. Existing queued jobs without an execution key resume only a
  matching active run with the same request parameters.

### Three-page smoke only

Use `max_pages: 3` only for a smoke test. It is a local pipeline budget and is
never sent to ChileCompra.

```text
payload: {"publicado_desde":"2026-08-12T00:00:00Z","publicado_hasta":"2026-08-12T23:59:59Z","tamano_pagina":50,"max_pages":3,"ordenar_por":"FechaUltimaModificacion"}
```

- **Implemented**: `max_pages` deliberately limits a bounded run to that many
  pages per discovery pass. A bounded run checkpoints and hydrates what it
  discovered, then finishes. Reaching the budget is normal completion, not a
  failure.
- **Implemented**: a bounded run never advances the global source watermark.
  Only a successful, exhaustive, unfiltered global change-window run can
  advance it.
- **Policy**: do not treat a bounded run as one-day coverage.
- Omit `max_pages` for the final full-day run. Without `max_pages`, discovery
  paginates exhaustively.

## Watermark and Pagination

- **Implemented**: when a durable sync has a watermark, it sets
  `cambio_desde` to five minutes before that watermark and freezes
  `cambio_hasta` to the UTC instant at run start. Every page therefore shares
  one complete change window.
- **Implemented**: a successful, exhaustive, unfiltered global change-window
  run advances the watermark when discovery completes, independently of later
  hydration failures. A bounded run never advances the watermark.
- **Implemented**: a relative `ttl_cambio_ms` is used only when no watermark
  window is derived.
- **Implemented**: a retryable discovery failure resumes from the first page
  without a checkpoint. Hydration resumes pending items after resetting any
  interrupted `processing` item.
- **Policy**: resume a failed durable run; do not recreate it with a subtly
  different partial window.

```text
payload: {"sync_run_id":"<failed-sync-run-id>"}
```

## Detail Hydration Recovery

- **Implemented**: every received detail response, including HTTP `200` with no
  Compra Agil record, is persisted as raw audited evidence before the item
  terminalizes as a soft miss. Do not infer provider meaning from an empty
  response without that evidence.
- **Implemented**: detail hydration skips a request only when fresh list data
  matches a current detail observation by provider change time and state. A
  frozen cohort item without fresh list evidence still requests detail.
- **Implemented**: each list and detail attempt refreshes the SyncRun heartbeat.
  A retryable detail response affects only its item while attempts remain;
  remaining items continue. A systemic retryable failure leaves the same
  SyncRun resumable through the queue or the authorized resume path.
- **Policy**: do not cancel a retryable run to make room for another run. Apply
  the required instance command, then let the existing command retry or use the
  authorized resume path.

## Sync Operator Deployment

The V2 sync control boundary accepts only explicit human operators. An
operator assignment is a row in `mp.sync_operator` with a `workspace_id` and a
`user_workspace_id`. The schema ships through the additive fast instance
command `MpV2SyncOperationsFastInstanceCommand`; standard deployment applies
it with `npx nx run twenty-server:database:migrate:prod`.

The durable hydration-recovery schema ships through the additive fast instance
command `MpV2DurableHydrationRecoveryFastInstanceCommand`. It adds only
execution and hydration-decision metadata. Deploy it before enqueuing a new V2
manual run that must resume through the generic queue.

The item lifecycle statuses (`failed`, `deferred`, `lifecycle_terminal`) and
the `records_deferred` counter ship through the slow instance command
`MpV2ItemLifecycleStatusSlowInstanceCommand`. Its data migration backfills
legacy `terminal` rows before restoring the status check. Deploy it before
starting the debt recovery cron.

Manage assignments with the `mercado-publico:sync-operator` command through
the existing server command surface.

```text
# assign (idempotent, refreshes assignment metadata)
mercado-publico:sync-operator -w <workspace_id> -u <user_workspace_id> -a <assigned_by_user_workspace_id>

# remove
mercado-publico:sync-operator -w <workspace_id> -u <user_workspace_id> --remove
```

- **Policy**: assign only workspace members who operate the sync.
- **Policy**: no workspace administrator receives implicit sync control.
- **Policy**: remove the assignment when an operator leaves the workspace.

## Sync Control

An assigned operator uses Centro de control to start, resume, or cancel the
global incremental V2 sync. Start and cancel require confirmation. Resume does
not require confirmation and continues only an eligible run from its saved
checkpoints.

The latest-run view shows status, stored discovered, hydrated, and failed
counts, plus a safe summary. It does not show internal IDs, idempotency keys,
payloads, or technical error causes.

## Error Matrix

| Signal | Classification | Operator action |
| --- | --- | --- |
| 400 | Parameter error | Stop; correct the local payload once. |
| 401 / 403 | Hard failure | Verify managed ticket configuration without printing it. |
| 404 | Soft miss | Persist provider evidence and fail the item. Do not retry transport. |
| 429 | Retryable | Respect `Retry-After`; retain item pending until its item retry limit. |
| 500 / 503 / 504 / timeout | Retryable | Retry item without aborting remaining hydration items. |

`Retry-After` delta-seconds and HTTP-date values are parsed without storing
headers. A provider response waits for this delay before next retry; otherwise
the configured fixed backoff applies.

## Hydration Completion

Hydration reads pending items in serial batches of 100. Provider retryable
responses affect only their item. Each item has
`MERCADO_PUBLICO_HTTP_MAX_RETRIES + 1` total attempts.

Item terminal states are split:

- `failed`: soft misses, detail-code mismatches, and hard provider failures.
  Counted in `records_failed`. Never retried automatically.
- `deferred`: retryable requests whose attempts were exhausted. Counted in
  `records_deferred`. Retried by the debt recovery cron, not by resume.
- `lifecycle_terminal`: the provider record reached a verified terminal
  business state. Has an observation, no error summary, and is not a failure.

The worker completes after no pending hydration item remains. A run with one or
more failed or deferred items ends as `partial_failed`. Deferred items no longer
block the discovery watermark. Serial requests protect provider quota. Add
bounded concurrency only after a successful run exceeds its agreed duration SLO
and quota telemetry shows available capacity.

## Deferred Hydration Debt Recovery

- **Implemented**: the one-minute `MercadoPublicoV2DebtRecoveryCronJob`
  selects due `deferred` items with exponential backoff derived from their
  attempt count and dispatches a focused `id`-scoped recovery run per item.
- **Implemented**: an item is skipped once a fresher detail observation exists
  for its code. Dispatch is claimed atomically per item, so concurrent cron
  ticks cannot double-dispatch.
- **Policy**: do not resume an old run to clear deferred debt; let the debt
  recovery cron or the authorized resume path handle it.

## Command Retries

V2 control commands use configured fixed BullMQ retry settings. On a retryable
failure, command state returns to `pending` while queue attempts remain. The
final allowed attempt records `failed`; recovery does not retry it forever. Each
attempt resumes the same durable run and its saved checkpoints.

**Official**: ChileCompra directs clients to respect `Retry-After` for 429.
**Policy**: when 429 has no usable `Retry-After`, the run stays resumable and
the command retries only after the provider quota reset. The reset comes from
`mp.gold_api_quota_usage.reset_at` when recorded; otherwise it is computed from
the configured quota timezone. Do not burn fixed-delay retries against a daily
quota.

**Policy**: 504 is retryable because the provider has returned endpoint timeout
responses in retained runtime evidence. It is not listed in the published error
matrix.

## Retired Legacy Surface

The `mercado-publico-v2-legacy-retirement` change (G5, 2026-08-16) removed the
displaced legacy surface after the G4 cutover gate closed:

- Legacy UI routes, pages, and the private legacy alias.
- Legacy internal GraphQL queries, fragments, resolver, and read closure.
- API V1 and Datos Abiertos CSV ingestion: drivers, services, jobs,
  orchestrator, canonical-refresh, reconciliation, and the `mercado-publico:run`
  CLI.
- Displaced V2-named backbone services (`api-v2-*` incremental,
  publication-window, detail-by-codigo) and their orchestration consumers.

Retained: Compra Agil V2 durable sync, evidence replay, projections, sync
control, cron jobs (sync-recovery, debt-recovery), operator assignment CLI,
shared persistence/raw-layer evidence branches, and all committed `2-16-*mp*`
instance commands.

## Rollback and Recovery

Rollback is deploying the G4 gate-close revision `49d115e768` on
`feat/mercado-publico-v2-baseline`. That revision carries the legacy route, CLI,
and V1/CSV runtime; the verified procedure is the G4 runbook in
`openspec/changes/archive/2026-08-16-mercado-publico-v2-cutover-gate/pre-cutover-evidence.md`.

Data recovery needs no removed component: all `mp` schema rows and committed
migrations are untouched by G5, and historical V1/CSV rows remain queryable.
New V1/CSV ingestion requires the rollback deployment by design.

## Evidence and Execution Authorities

- Evidence: `openspec/changes/mercado-publico-v2-legacy-retirement/retirement-evidence.md`
  is the certification record (candidate manifest, zero-consumer proof, smoke,
  visual evidence, rollback reference).
- PRD: `.scratch/mercado-publico-v2-reconstruction/PRD.md`.
- Source issues: 32-35 under `.scratch/mercado-publico-v2-reconstruction/issues/`.
- OpenSpec decisions: `mercado-publico-v2-cutover-gate` (G4, archived),
  `mercado-publico-v2-sync-operations` (G3, archived),
  `mercado-publico-v2-legacy-retirement` (G5, active).
