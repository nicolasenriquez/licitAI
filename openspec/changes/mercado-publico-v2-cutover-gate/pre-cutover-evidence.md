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

This is valid zero-state evidence. It is not G3 operational proof. Stop any
cutover attempt until deployment has applied G3 schema and an assigned operator
has produced a terminal V2 SyncRun with its command, attempt, and audit rows.

## Stable Evidence Locations

| Evidence | Canonical location |
| --- | --- |
| Baseline and before/after state | This file and `evidence/<run-id>/state-before.txt`, `state-after.txt`, and `state-diff.txt` |
| Route and browser proof | `evidence/<run-id>/playwright/`; copy screenshots, traces, console, and network output from `packages/twenty-e2e-testing/run_results/` before cleanup |
| G3 durable records | Read-only PostgreSQL query output in `evidence/<run-id>/state-before.txt` and `state-after.txt` |
| Deployment identity | `evidence/<run-id>/deployment.txt`, containing Git commit, image digest, build flag, deploy time, and operator |
| Human visual decision | `evidence/<run-id>/visual-review.md` |
| Final G4 decision and G5 rollback reference | G4 task 4.2 release record in this change directory |

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

1. Stop unless G3 schema exists, current source revision is recorded, no
   command is `pending` or `claimed`, and no V2 SyncRun is in `queued`,
   `discovering`, `hydrating`, `projecting`, or `reconciling`.
2. Deploy complete build with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true`.
   Record build flag, Git commit, image digest, deploy timestamp, and operator
   in `evidence/<run-id>/deployment.txt`.
3. Capture pre-cutover state. Run enabled canonical V2 smoke and private legacy
   alias smoke. Preserve browser evidence. Do not use browser provider calls.
4. Deploy complete build with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=false`.
   Do not run migrations, alter `mp` data, transform V1/CSV, or delete evidence,
   SyncRuns, commands, attempts, or audit records.
5. Run disabled canonical legacy smoke and private alias smoke. Capture state
   again and diff it against the pre-disabled capture. Stop and escalate if any
   durable row differs.
6. Deploy complete build with `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true`.
   Run canonical V2 and private alias smoke. Capture state a final time and
   diff it against the pre-cutover capture.
7. Stop release authorization on failed smoke, changed durable evidence, mixed
   route composition, active control state, missing browser artifact, missing
   human visual decision, or missing deployment identity.

Task 1.2 owns automated route-matrix coverage. Task 2.4 owns operator-facing
documentation. This runbook defines their immutable evidence and deployment
boundary only.

## G5 Rollback Release Tag

G5 must deploy one annotated, protected Git tag named
`mercado-publico-v2-g4-approved-<full-g4-commit-sha>`. G4 task 4.2 creates the
final release record only after all G4 gates pass, substitutes the full approved
commit SHA, and records the tag and immutable image digest. The tag must not be
force-moved or recreated. Until that final record exists, G5 is prohibited and
no G4 approval tag exists for current revision.
