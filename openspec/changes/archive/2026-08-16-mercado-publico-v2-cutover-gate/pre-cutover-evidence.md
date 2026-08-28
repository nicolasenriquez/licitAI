# G4 Pre-Cutover Evidence

## Record

- Captured: `2026-08-13T17:52:14-04:00`
- Source revision: `0d9426968cee32ff9632d95a478a80034888c0d7`
- Existing release tag: none
- Runtime: existing local Compose project `twenty`; server, worker, PostgreSQL,
  and Redis healthy.
- Scope: read-only baseline. No build, deployment, schema, data, flag, or queue
  state changed.

## Baseline Result

The current Compose database contains the V2 durable-evidence tables, but it
does not contain G3 control tables. Its `mp.sync_run` table has no V2 rows and
all retained V2 evidence counts are zero.

| Record | Result |
| --- | --- |
| Latest V2 SyncRun | None for `source = 'api-v2-compra-agil'` |
| G3 command | Table `mp.sync_command` absent |
| G3 attempt | Table `mp.sync_run_attempt` absent |
| G3 audit | Table `mp.sync_run_audit` absent |
| V2 observations | `0` |
| V2 child evidence | `0` |
| V2 history | `0` |
| V2 cohort | `0` |
| V2 source watermark | no row for `api-v2-compra-agil` / `global` |

This is valid zero-state evidence. It is not publication-window proof. Stop
task 2.6 until the existing backend publication-window runner produces terminal
V2 SyncRuns for both requested source-date windows.

## Task 2.6 Attempt

- Attempted at: `2026-08-13T23:50:58Z`
- Requested source window: `2026-08-12T00:00:00Z` through
  `2026-08-12T23:59:59Z`
- Requested page size: `50`
- Entry point: existing `mercado-publico:run` command with
  `api-v2-compra-agil-by-publication-window`
- Result: failed. The command retry policy produced four failed SyncRuns:
  `511b490f-15e3-4a0f-ac8a-6429bf626849`,
  `e1432033-3af8-4da0-9b3d-4a8701b13eb4`,
  `ca487b7e-c2f8-4adc-8e3a-52ebeb82eab6`, and
  `0a012902-182c-44c0-b3b3-3763cfda8563`.
- Observed before failure: each run discovered `45` records and checkpointed
  page `1`; the checkpoint reports `5200` total provider results. No run
  hydrated or projected a record, and no source watermark was written.
- Root cause: deployed worker called `UPDATE mp.sync_run SET heartbeat_at = now()`
  but this runtime lacked `mp.sync_run.heartbeat_at`.

## G3 Schema Patch

- Applied at: `2026-08-13T23:58Z`
- Entry point: existing `run-instance-commands --force` command in the active
  server container.
- Result: `MpV2SyncOperationsFastInstanceCommand` executed successfully.
- Verified: six `mp.sync_run` G3 columns, four G3 control tables, and three G3
  indexes now exist. No direct database schema write was used.

## Task 2.6 Retry

- Attempted 12 August window again at: `2026-08-14T00:00:03Z`
- Full discovery evidence: SyncRun `920d80c2-9cf1-4ccb-afc3-330310609175`
  checkpointed all `104` pages and discovered `2598` cohort records.
- Terminal result: failed in hydration. Five detail requests were soft misses;
  subsequent provider detail request returned `504`, recorded durably as
  `hard_fail: provider: provider_error`. Automatic retries ended with
  SyncRun `1e42093f-7b30-423e-9856-6a18f3a56d61`, also a provider `504` during
  discovery.
- No record projected and no watermark advanced. Do not enqueue the 13 August
  window or authorize G5 until the 12 August window reaches terminal success.

## Task 2.6 Full-Window Retry

- Attempted 12 August window at: `2026-08-14T00:40:02Z`
- Requested source window: `2026-08-12T00:00:00Z` through
  `2026-08-12T23:59:59Z`
- Requested page size: `50`
- SyncRun: `e510d181-3721-4e3f-b5cb-6f0025ee565b`
- Result: terminal failure during discovery after checkpointing `38` of `104`
  pages. It retained `2598` discovered cohort records, but no hydration,
  projection, or watermark occurred. Durable error summary:
  `hard_fail: durable discovering failed`.
- Stop condition remains active. The 13 August window was not enqueued.

## Hydration Recovery Patch

- Implemented in source only: `MpV2DurableHydrationRecoveryFastInstanceCommand`
  adds SyncRun execution identity and frozen hydration-decision metadata. It has
  not been applied to this runtime.
- The backend now persists every detail response before recording a soft miss,
  refreshes heartbeat after every provider attempt, makes retryable failures
  terminal-resumable, and stops a detail pass after a retryable provider result.
- New generic queue jobs receive a stable execution key. Their retries resume
  the existing durable SyncRun instead of creating another run that conflicts
  with the active-run index.
- Hydration skips only a list-confirmed unchanged current detail. Cohort items
  without fresh list evidence remain detail-hydrated. List data is not projected
  as a substitute for the detail contract.
- Validation: focused durable-sync, persistence, command, and instance-command
  Jest suites pass locally. No instance command, runtime image, queue, existing
  SyncRun, or provider request changed during this source patch.
- Required before another task 2.6 attempt: deploy the new instance command and
  source image, then run a small bounded publication window. Do not enqueue the
  13 August window until the 12 August window reaches terminal success.

## Bounded 12 August Attempt

- Submitted at: `2026-08-14T16:11:18.452Z`
- Requested source window: `2026-08-12T00:00:00Z` through
  `2026-08-12T23:59:59Z`
- Requested page size: `50`; bounded discovery budget: `3` pages.
- Entry point: existing `mercado-publico:run` command with
  `api-v2-compra-agil-by-publication-window`, `max_pages: 3`, and
  `bounded_window: true`.
- Runtime deployment: rebuilt local `twentycrm/twenty:mp-local` image, recreated
  canonical server and worker, and verified deployed bounded-runner code plus
  `execution_key`, `hydration_required`, and `hydration_reason` recovery schema
  columns.
- SyncRun: `ce9edf06-6fc1-4384-b5cf-9af6f216ba49`.
- Result: `partial_failed` at `2026-08-14T16:14:21.152Z` after retryable provider
  discovery failures. The run checkpointed pages 1 and 2 of the provider's 104
  pages, with `89` discovered pending items and `3` admitted cohort rows. No
  item hydrated or projected, no observation exists, and no source watermark was
  written.
- Stop condition: task 2.6 requires terminal success with all required evidence.
  Do not enqueue the 13 August bounded window or authorize G5.

## Bounded 12 August Attempt 2026-08-14 (Second)

- Submitted at: `2026-08-14T23:33:48Z` (enqueue)
- Authorized scope: 12 August bounded window only. The 13 August window was
  not submitted.
- Requested source window: `2026-08-12T00:00:00Z` through
  `2026-08-12T23:59:59Z`
- Requested page size: `50`; bounded discovery budget: `3` pages;
  `bounded_window: true`.
- Entry point: existing `mercado-publico:run` command with
  `api-v2-compra-agil-by-publication-window`.
- Preflight: `just runtime-check` healthy; pre-run durable state read-only:
  latest SyncRun `ce9edf06-6fc1-4384-b5cf-9af6f216ba49` (`partial_failed`),
  no active run, `156` observations, `2616` cohort rows, `0` global watermark
  rows.

### SyncRun evidence

- SyncRun: `8b024d10-f25f-4154-84ad-cde07703a0fa`
- Requested window, persisted verbatim in `mp.sync_run.request_params`:
  `{"max_pages": 3, "ordenar_por": "FechaUltimaModificacion", "numero_pagina": 1, "tamano_pagina": 50, "bounded_window": true, "publicado_desde": "2026-08-12T00:00:00Z", "publicado_hasta": "2026-08-12T23:59:59Z"}`
- Started `2026-08-14T23:33:49.027758Z`; finished `2026-08-15T00:02:27.490372Z`
- Result: `partial_failed`
- Counters: `records_discovered = 144`, `pages_discovered = 3`,
  `pages_checkpointed = 3` (budget fully consumed, normal bounded stop),
  `records_hydrated = 140`, `records_projected = 140`,
  `records_failed = 4`
- Item outcomes: `130` succeeded, `10` terminal without error summary
  (lifecycle-terminal), `4` terminal with `retryable_failed`
- Watermark: `watermark_before` and `watermark_after` both null; global
  `api-v2-compra-agil` watermark rows remain `0`
- Cohort: `3` rows admitted by this SyncRun
- Projection: `140` observations written by this SyncRun

### Decision

The cycle is terminal `partial_failed`, which is a failed cycle under task
2.6. The 13 August bounded window was not submitted. G5 authorization remains
rejected and task 2.6 remains unchecked.

## Targeted Detail Retry for the Four Failed Codigos

- Authorized scope: retry only the four `retryable_failed` codigos from
  SyncRun `8b024d10-f25f-4154-84ad-cde07703a0fa`, via the same
  `mercado-publico:run` entry point with `id`-filtered payloads
  (`tamano_pagina: 50`, `max_pages: 3`, `bounded_window: true`).
- The full bounded 12 August window was retried first as SyncRun
  `4691a855-1281-40eb-b284-68876f84c962`: `132` discovered, `129` hydrated
  and projected, `3` failed. `5251-747-COT26` succeeded in that run.
- Targeted results (one isolated run per codigo, sequential):

| Codigo | Result | attempts | error_summary |
| --- | --- | --- | --- |
| 2721-365-COT26 | partial_failed | 4 | retryable_failed |
| 1221016-161-COT26 | partial_failed | 4 | retryable_failed |
| 2281-1456-COT26 | partial_failed | 4 | retryable_failed |

- Each targeted run discovered `1` item (list endpoint healthy) and failed
  all `4` detail attempts with a retryable provider result. No observation or
  projection was written. This confirms provider-side per-record detail
  failure for these three codigos, not an empty response and not a local
  pipeline failure.
- G5 authorization remains rejected and task 2.6 remains unchecked.

## Bounded 13 August Attempt 2026-08-15

- Authorized scope: 13 August bounded window, same runner contract
  (`tamano_pagina: 50`, `max_pages: 3`, `bounded_window: true`).
- Submitted at: `2026-08-15T00:42:51Z`.
- SyncRun: `85e5dfff-a55f-4713-8975-d068594e934b`.
- Result: `succeeded` at `2026-08-15T00:44:37.808372Z`.
- Counters: `records_discovered = 12`, `pages_discovered = 3`,
  `pages_checkpointed = 3`, `records_hydrated = 12`,
  `records_projected = 12`, `records_failed = 0`.
- Items: `12` succeeded on first attempt; no terminal or soft-miss items.
- Cohort: `12` rows admitted by this SyncRun.
- Projection: `12` observations written by this SyncRun.
- Watermark: before null; after `2026-08-15T00:35:00+00`; global
  `api-v2-compra-agil` watermark rows went from `0` to `1`.
- Deviation: the deployed `mp-local` image (built `2026-08-14T16:11Z`)
  advances the watermark on a bounded run. Current source and the operator
  runbook forbid this: only a successful, exhaustive, unfiltered global
  change-window run may advance it. Do not start a global incremental run
  until the image is rebuilt from current source and the watermark state
  decision is recorded.
- Gate status: the 13 August cycle succeeded but the 12 August cycle remains
  failed (`partial_failed` with three provider-failed codigos). Task 2.6
  requires both windows correct, so task 2.6 remains unchecked and G5
  authorization remains rejected.

## Stable Evidence Locations

| Evidence | Canonical location |
| --- | --- |
| Baseline and before/after state | This file and `packages/twenty-e2e-testing/run_results/cutover-evidence/{before,after-disabled,after-reenabled}-state.json` |
| Route and browser proof | `packages/twenty-e2e-testing/run_results/cutover-evidence/<phase>/playwright/`; copy screenshot, trace, console, and network artifacts to `evidence/<run-id>/playwright/` before the next harness run |
| G3 durable records | Read-only PostgreSQL output in the three local state files and copied `evidence/<run-id>/state-*.json` files |
| Deployment identity | `packages/twenty-e2e-testing/run_results/cutover-evidence/<phase>-deployment.txt`; add operator identity when copying to `evidence/<run-id>/deployment.txt` |
| Human visual decision | `evidence/<run-id>/visual-review.md`, using the release-gate template |
| Final G4 decision and G5 rollback reference | G4 `proposal.md` `## Gate Status` section and this file's `## G5 Rollback Reference` section |

`<run-id>` is `YYYYMMDDTHHMMSS-<enabled|disabled|reenabled>`. Evidence files
are append-only once reviewed. Do not put tickets, credentials, raw provider
payloads, request headers, or user-session data in them.

## State Capture

Run this query before the enabled deployment, before the disabled deployment,
and after the re-enabled deployment. Run it only against the target deployment
database after migrations complete. Save stdout unchanged at the matching
stable evidence location.

```sql
BEGIN TRANSACTION READ ONLY;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'mp'
  AND table_name IN (
    'sync_run',
    'sync_command',
    'sync_run_attempt',
    'sync_run_audit',
    'v2_observation',
    'v2_child_evidence',
    'v2_history',
    'v2_cohort',
    'source_watermark'
  )
ORDER BY table_name;

SELECT id, intent, source, scope, status, records_discovered,
       records_hydrated, records_failed, records_projected,
       pages_checkpointed, watermark_before, watermark_after,
       control_workspace_id, created_at, updated_at, finished_at
FROM mp.sync_run
WHERE source = 'api-v2-compra-agil'
ORDER BY created_at DESC
LIMIT 1;

SELECT id, action, state, sync_run_id, dispatch_attempts,
       created_at, updated_at, finished_at
FROM mp.sync_command
ORDER BY created_at DESC
LIMIT 1;

SELECT id, state, attempt_number, sync_run_id, sync_command_id,
       started_at, heartbeat_at, finished_at
FROM mp.sync_run_attempt
ORDER BY started_at DESC
LIMIT 1;

SELECT id, event_type, sync_run_id, sync_command_id, sync_run_attempt_id,
       created_at
FROM mp.sync_run_audit
ORDER BY created_at DESC
LIMIT 10;

SELECT
  (SELECT COUNT(*) FROM mp.v2_observation) AS observations,
  (SELECT COUNT(*) FROM mp.v2_child_evidence) AS child_evidence,
  (SELECT COUNT(*) FROM mp.v2_history) AS history,
  (SELECT COUNT(*) FROM mp.v2_cohort) AS cohort,
  (SELECT COUNT(*) FROM mp.source_watermark
   WHERE source = 'api-v2-compra-agil' AND scope = 'global') AS watermark_rows;

SELECT source, scope, watermark_at, updated_at
FROM mp.source_watermark
WHERE source = 'api-v2-compra-agil' AND scope = 'global';

COMMIT;
```

The before/after comparison must show identical durable rows because the route
switch does not start a run or change data. Do not compare raw provider data or
V1/CSV fields.

## Enabled-To-Disabled-To-Enabled Runbook

1. Run `node scripts/run-mercado-publico-cutover.mjs --dry-run` from
   `packages/twenty-e2e-testing`. Stop unless it identifies the isolated
   `twenty-mp-e2e` Compose project. Do not use the normal `twenty` project.
2. Stop unless G3 schema exists, current source revision is recorded, no
    command is `pending` or `claimed`, and no V2 SyncRun is in `queued`,
    `discovering`, `hydrating`, `projecting`, or `reconciling`.
3. Run `npx nx run twenty-e2e-testing:test:mercado-publico:cutover` from the
   repository root. It provisions the existing G3 fixture once, then deploys
   complete frontend builds with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true`,
   `false`, and `true` in that order. It does not seed projections directly.
4. For a deployment outside the local harness, deploy complete build with
   `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true`.
    Record build flag, Git commit, image digest, deploy timestamp, and operator
    in `evidence/<run-id>/deployment.txt`.
5. Capture pre-cutover state. Run enabled canonical V2 smoke and private legacy
    alias smoke. Preserve browser evidence. Do not use browser provider calls.
6. Deploy complete build with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false`.
    Do not run migrations, alter `mp` data, transform V1/CSV, or delete evidence,
    SyncRuns, commands, attempts, or audit records.
7. Run disabled canonical legacy smoke and private alias smoke. Capture state
    again and diff it against the pre-disabled capture. Stop and escalate if any
    durable row differs.
8. Deploy complete build with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true`.
    Run canonical V2 and private alias smoke. Capture state a final time and
    diff it against the pre-cutover capture.
9. Stop release authorization on failed smoke, changed durable evidence, mixed
    route composition, active control state, missing browser artifact, missing
    human visual decision, or missing deployment identity.

Task 1.2 owns automated route-matrix coverage. This runbook owns the operator
procedure and evidence retention. G5 retirement is prohibited throughout G4,
including after a successful local cutover run.

## G5 Rollback Reference

The planned tag `mercado-publico-v2-g4-approved-<full-g4-commit-sha>` was never
created. On 2026-08-16 the operator decision recorded in `proposal.md`
`## Gate Status` closed the G4 gate and superseded both the standalone release
record and the rollback tag. G5 rollback reference: G4 gate-close commit
`49d115e7682268c45aba8d94da929ab3e37b2272` on
`feat/mercado-publico-v2-baseline`, the commit that marks G4 tasks complete.

When G5 begins, rollback deploys this revision. It must not restore a live
legacy alias or alter the retained G4 evidence.
