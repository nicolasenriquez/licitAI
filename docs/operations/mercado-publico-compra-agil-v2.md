---
type: operations-guide
title: Compra Agil V2 operator guide
description: Safe manual execution contract for the Mercado Publico Compra Agil V2 backbone.
---

# Compra Agil V2 Operator Guide

## Purpose

Run a bounded, auditable Compra Agil V2 ingestion without exposing tickets or
repeating a failing request.

## Evidence Labels

- **Official**: published by Mercado Publico or ChileCompra.
- **Implemented**: enforced by this repository today.
- **Policy**: conservative operating rule chosen by this repository.
- **Unknown**: do not assume it; obtain provider confirmation or a sanitized
  fixture first.

## Sources and Contract

- **Official**: [Mercado Publico API documentation](https://api.mercadopublico.cl/documentos/Documentaci%C3%B3n%20API%20Mercado%20Publico%20-%20Licitaciones.pdf)
  documents the official API host and ticket-based access pattern.
- **Official**: [ChileCompra Compra Agil FAQ](https://ayuda.mercadopublico.cl/preguntasfrecuentes/articulo/?id=KA-02013)
  confirms the Compra Agil operating domain.
- **Implemented**: V2 requests use `GET /v2/compra-agil` and send the secret
  in the `ticket` header. The ticket must come only from managed configuration.
- **Implemented**: `tamano_pagina` is at most 50, `numero_pagina` starts at 1,
  `id` and `q` are mutually exclusive, and `ordenar_por` is propagated.
- **Implemented**: `orden` is rejected. A supplied `cambio_*` or `publicado_*`
  window must include both UTC bounds.
- **Unknown**: a publicly stable V2 parameter schema and sort-direction
  vocabulary are not retained as evidence here. Do not add parameters based on
  an observed response alone.

## Safe Manual Recipe

Use UTC timestamps and a complete, small publication window. The internal
`mercado-publico:run` command accepts one job name and a JSON payload; invoke
it through the existing server command surface for the environment.

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

## Watermark and Pagination

- **Implemented**: when a durable sync has a watermark, it sets
  `cambio_desde` to five minutes before that watermark and freezes
  `cambio_hasta` to the UTC instant at run start. Every page therefore shares
  one complete change window.
- **Implemented**: a relative `ttl_cambio_ms` is used only when no watermark
  window is derived.
- **Policy**: resume or rediscover a failed durable run; do not recreate it
  with a subtly different partial window.

## Detail Hydration Recovery

- **Implemented**: every received detail response, including HTTP `200` with no
  Compra Agil record, is persisted as raw audited evidence before the item stays
  pending. Do not infer provider meaning from an empty response without that
  evidence.
- **Implemented**: detail hydration skips a request only when fresh list data
  matches a current detail observation by provider change time, state, and OC
  linkage. A frozen cohort item without fresh list evidence still requests
  detail.
- **Implemented**: each list and detail attempt refreshes the SyncRun heartbeat.
  A retryable detail response stops the current pass, stores a terminal
  resumable `partial_failed` run, and lets bounded queue retry resume it.
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
| 404 | Soft miss | Persist provider evidence and terminalize item. Do not retry transport. |
| 429 | Retryable | Respect `Retry-After`; retain item pending until its item retry limit. |
| 500 / 503 / 504 / timeout | Retryable | Retry item without aborting remaining hydration items. |

`Retry-After` delta-seconds and HTTP-date values are parsed without storing
headers. A provider response waits for this delay before next retry; otherwise
the configured fixed backoff applies.

## Hydration Completion

Hydration reads pending items in serial batches of 100. Provider retryable
responses affect only their item. Each item has
`MERCADO_PUBLICO_HTTP_MAX_RETRIES + 1` total attempts.

Soft misses, detail-code mismatches, and exhausted retryable requests become
terminal items with an error summary. Lifecycle-terminal provider records are
also terminal, but have no error summary. The run `records_failed` count
contains only terminal items with an error summary.

The worker completes after no pending hydration item remains. A run with one or
more terminal error items ends as `partial_failed` and does not advance its
watermark. Serial requests protect provider quota. Add bounded concurrency only
after a successful run exceeds its agreed duration SLO and quota telemetry
shows available capacity.

## Command Retries

V2 control commands use configured fixed BullMQ retry settings. On a retryable
failure, command state returns to `pending` before BullMQ retries it. The final
allowed attempt records `failed`; recovery does not retry it forever. Each
attempt resumes the same durable run and its saved checkpoints.
