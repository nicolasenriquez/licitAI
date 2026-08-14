---
type: reference
title: Pipeline Checkpoint and Resume Open-Source Reference
description: Primary-source reference for durable checkpoint and resume behavior in paginated pipelines.
okf_version: "0.1"
---

# Pipeline Checkpoint and Resume Open-Source Reference

## Purpose

Define a source-backed reference for checkpoint and resume behavior in a
paginated pipeline. The target case is a two-stage pipeline. A fast stage
discovers source records. A slow stage hydrates and persists them.

This document does not describe the current licitAI implementation. It gives
facts from two open-source projects and bounded inferences for a NestJS,
BullMQ, and PostgreSQL design.

## Source Scope

The review used only official documentation and source code from these two
repositories:

1. [Airbyte Python CDK](https://github.com/airbytehq/airbyte-python-cdk), with
   Airbyte's official protocol and connector documentation as first-party
   contract evidence.
2. [Temporal TypeScript samples](https://github.com/temporalio/samples-typescript),
   with Temporal's official TypeScript and retry documentation as first-party
   contract evidence.

The review was made on 2026-08-14. GitHub source links below use the current
default branch. They are direct source links, but they are not immutable
commit permalinks.

## Executive Summary

The two projects use the same core rule: save progress only at a boundary that
the system can safely repeat.

Airbyte models this boundary as state that travels from the source through the
destination. The destination returns the state only after it commits all prior
records. Temporal models activity progress as heartbeat details. A retry reads
the last heartbeat and continues from it. Temporal also passes workflow state
explicitly when it starts a new execution with Continue-As-New.

For licitAI, a page number alone is not enough. A durable checkpoint needs a
stable run identity, stage identity, source query identity, cursor or page,
and completion status. The data write and checkpoint advance must share one
PostgreSQL transaction. If they cannot share one transaction, record writes
must be idempotent and a retry must repeat the last unconfirmed unit.

## Reference 1: Airbyte

### Facts

1. The Airbyte source `read` operation accepts a state object. Airbyte defines
   this object as a checkpoint that records how much source data was read. The
   source emits record and state messages during the same read operation.
   See [Airbyte Protocol: Read](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol#read).

2. Airbyte states that a destination must return a state message only after it
   has written all records that came before that message. Airbyte passes only
   a state confirmed by both source and destination into the next run. This is
   the commit boundary for a completed checkpoint.
   See [Airbyte Protocol: Destination Write](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol#write)
   and [State and the Whole Sync](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol#state--the-whole-sync).

3. Airbyte supports stream-scoped state. Stream state permits isolated reset
   and progress for one stream. Global state couples the streams and reduces
   that isolation.
   See [Airbyte Protocol: State Types](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol#state-types).

4. Airbyte recommends state emission whenever it is useful to resume a failed
   sync. It also requires ordered state return from destinations. A skipped or
   out-of-order state is an error.
   See [Airbyte Protocol: State Principles](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol#state-principles).

5. The Python CDK supports two checkpoint forms. An ordered stream can emit a
   checkpoint after a configured record interval. A stream slice can define the
   smallest unit that the connector must repeat. If slice N fails, the retry
   starts at slice N and does not repeat slices 1 through N-1.
   See [Airbyte incremental stream checkpointing](https://docs.airbyte.com/platform/connector-development/cdk-python/incremental-stream#checkpointing-state).

6. The CDK `ResumableFullRefreshCheckpointReader` uses stream state to iterate
   over an unknown number of pages. Its `ResumableFullRefreshCursor` uses a
   synthetic pagination cursor. It updates that cursor when it closes a slice,
   not when it observes each record.
   See [Airbyte Python CDK checkpoint source](https://airbytehq.github.io/airbyte-python-cdk/airbyte_cdk/sources/streams/checkpoint.html#ResumableFullRefreshCheckpointReader)
   and [ResumableFullRefreshCursor](https://airbytehq.github.io/airbyte-python-cdk/airbyte_cdk/sources/streams/checkpoint.html#ResumableFullRefreshCursor).

7. Airbyte limits resumable full-refresh state to attempts of the same job. The
   platform removes that state after the job boundary. This behavior does not
   provide a general checkpoint across unrelated jobs.
   See the `ResumableFullRefreshCursor` source in the
   [Airbyte Python CDK checkpoint module](https://airbytehq.github.io/airbyte-python-cdk/airbyte_cdk/sources/streams/checkpoint.html#ResumableFullRefreshCursor).

### Inferences for licitAI

These points are design inferences. They are not claims about current licitAI
code.

- Treat each fast or slow work unit as a stream slice. A practical fast slice
  can be one API page. A practical slow slice can be one bounded hydration
  batch.
- Keep separate checkpoints for discovery and hydration. A completed discovery
  page does not prove that its records were hydrated.
- Advance a stage checkpoint only after the stage output is durable. For an
  end-to-end checkpoint, do not advance it until all required downstream writes
  are durable.
- Store the last confirmed cursor, not the last requested cursor. A failed page
  must be eligible for repeat.
- Keep the state ordered by stage and source partition. Do not let a later page
  overwrite an earlier incomplete page without an explicit rule.
- Define whether a manual restart continues the same logical run or creates a
  new run. Airbyte shows that this identity decision changes whether state is
  retained.

## Reference 2: Temporal TypeScript

### Facts

1. Temporal Activities retry automatically by default. The retry policy uses
   exponential backoff. Activity retries continue until success, cancellation,
   or an applicable limit. Workflow executions do not have a retry policy by
   default.
   See [Temporal Retry Policies](https://docs.temporal.io/encyclopedia/retry-policies#default-behavior).

2. The official TypeScript sample reads `activityInfo().heartbeatDetails` at
   Activity start. It uses that value as the resumed progress point. The same
   Activity calls `heartbeat(progress)` after each work interval.
   See [activities.ts](https://github.com/temporalio/samples-typescript/blob/main/activities-cancellation-heartbeating/src/activities.ts).

3. The sample configures both `startToCloseTimeout` and `heartbeatTimeout`. It
   waits for Activity cancellation to complete before it reports cancellation
   to the Workflow.
   See [workflows.ts](https://github.com/temporalio/samples-typescript/blob/main/activities-cancellation-heartbeating/src/workflows.ts).

4. A non-immediate Activity must send heartbeats and set a heartbeat timeout to
   receive cancellation. Cancellation becomes visible to the Activity at an
   available cancellation point. Cleanup can run before the Activity rethrows
   the cancellation error.
   See [Temporal TypeScript cancellation](https://docs.temporal.io/develop/typescript/workflows/cancellation#cancel-an-activity-from-a-workflow).

5. Continue-As-New closes one Workflow execution and creates another execution
   in the same chain. It keeps the Workflow ID, creates a new Run ID, and starts
   with fresh event history. The Workflow must pass its current state as input
   to the new execution.
   See [Temporal TypeScript Continue-As-New](https://docs.temporal.io/develop/typescript/workflows/continue-as-new)
   and the official [state handoff sample](https://github.com/temporalio/samples-typescript/blob/main/message-passing/safe-message-handlers/src/workflows.ts).

### Inferences for licitAI

These points are design inferences. They are not claims about current licitAI
code.

- Model a BullMQ retry like an Activity retry. The job must receive the same
  stable run identity. It must then load the last durable checkpoint before it
  calls the source API.
- A BullMQ progress percentage is not a sufficient checkpoint unless it also
  identifies the exact source query, stage, and next repeatable work unit.
- Persist progress after each committed page or hydration batch. Do not wait for
  a full day to finish before the first durable checkpoint.
- Make cancellation cooperative. Stop at a page or batch boundary. Persist the
  last completed boundary. Mark the run as canceled without marking the current
  uncommitted unit as complete.
- Treat a new logical run like Continue-As-New only when the prior state is
  passed explicitly. A new queue job without the same run identity can restart
  from zero even when prior data still exists.
- Do not assume that heartbeats or queue retries provide database atomicity.
  They record orchestration progress. PostgreSQL must still protect the data
  and checkpoint boundary.

## Required Commit Boundary

The safe unit is one repeatable page or one repeatable hydration batch.

```text
fetch page or batch
  -> validate stable source identity
  -> begin PostgreSQL transaction
  -> insert or upsert stage output
  -> update checkpoint to the next work unit
  -> commit transaction
  -> report queue progress
```

If the process fails before commit, the retry repeats the same unit. If the
process fails after commit, the retry loads the advanced checkpoint. This order
prevents a checkpoint from moving ahead of durable data.

If a data write and checkpoint cannot share one transaction, use an idempotent
write key and accept at-least-once processing. The write key must come from the
source contract or from a verified stable composite key. Do not derive it from
queue attempt number or row order.

## Minimum Durable Checkpoint Shape

This is a proposed shape, not a claim about the current schema.

| Field | Purpose |
| --- | --- |
| `runId` | Stable identity across retries and manual resume. |
| `pipeline` | Identifies the Mercado Publico pipeline contract. |
| `stage` | Separates discovery from hydration. |
| `partition` | Identifies the date window or another source partition. |
| `queryFingerprint` | Prevents resume with different source parameters. |
| `cursor` | Stores an opaque API token when available. |
| `page` | Stores the confirmed page when only numeric pagination exists. |
| `nextUnit` | Identifies the first unit that must run after resume. |
| `status` | Distinguishes running, partial, completed, failed, and canceled. |
| `updatedAt` | Supports diagnosis and stale-run policy. |

Prefer an opaque API cursor when the source provides one. A page number can
become unstable when source records change during a run. If numeric pages are
the only option, bind the checkpoint to an immutable query window and stable
sort contract. Verify those properties in the Mercado Publico API contract
before implementation.

## Page Budget and Smoke Tests

A page budget and a resume cursor solve different problems.

- The resume cursor answers: where must this logical run continue?
- The page budget answers: how much work may this invocation perform?

Use an optional `maxPages` input. When the caller omits it, preserve the current
production default of 50 pages. Permit a value of 1 or 2 for smoke tests. Reject
zero, negative values, non-integers, and values above the approved operational
limit.

A smoke test must use the production code path. It can change only the work
budget and test inputs. It must run both fast and slow stages. It must verify
that each stage wrote durable output and a durable checkpoint.

When `maxPages` stops a run before source exhaustion, mark the result as
`partial` or `budget_reached`. Do not mark it as `completed`. Otherwise a later
resume can skip unprocessed pages.

Recommended smoke checks:

1. Start a two-page run.
2. Stop it after page one commits.
3. Resume with the same `runId` and query fingerprint.
4. Verify that discovery begins at page two.
5. Verify that slow hydration does not repeat committed work, or that its
   idempotent upsert makes the repeat harmless.
6. Cancel during page two. Verify that the checkpoint remains at page one.
7. Change a query parameter. Verify that the old checkpoint is rejected.

## Limits of the References

- Airbyte's resumable full refresh state is scoped to attempts of one job. It
  does not prove that a new manual job should inherit old state.
- Temporal heartbeat details are scoped to Activity execution and retry. They
  do not create a PostgreSQL transaction and do not define source record
  identity.
- Continue-As-New transfers only the state that the Workflow passes to the new
  execution.
- Neither project can define the correct stable key, sort order, or pagination
  semantics for Mercado Publico. Those properties must come from its official
  API contract and verified licitAI code.
- Exactly-once processing must not be claimed from queue retry or checkpoint
  storage alone. The database transaction and idempotent record identity decide
  the effective delivery guarantee.

## Minimal Decision Set for licitAI

Before implementation, verify and decide these items:

1. What creates a logical `runId`, and which actions reuse it?
2. What source fields make a discovery record stable and unique?
3. Does the API provide an opaque next-page token or only a page number?
4. Is the query window immutable and ordered during one run?
5. What is the smallest safe fast-stage transaction?
6. What is the smallest safe slow-stage transaction?
7. Does a manual cancel keep the run resumable?
8. Does `maxPages` limit each invocation or the full logical run?
9. How does the system report `partial` without reporting false completion?
10. Which errors are retryable, and which input errors must fail at once?

## Primary Sources

### Airbyte

- [Airbyte Protocol](https://docs.airbyte.com/platform/understanding-airbyte/airbyte-protocol)
- [Incremental stream checkpointing](https://docs.airbyte.com/platform/connector-development/cdk-python/incremental-stream#checkpointing-state)
- [Python CDK checkpoint source](https://airbytehq.github.io/airbyte-python-cdk/airbyte_cdk/sources/streams/checkpoint.html)
- [Airbyte Python CDK repository](https://github.com/airbytehq/airbyte-python-cdk)

### Temporal

- [Retry Policies](https://docs.temporal.io/encyclopedia/retry-policies)
- [Activity cancellation and heartbeat sample](https://github.com/temporalio/samples-typescript/tree/main/activities-cancellation-heartbeating)
- [TypeScript cancellation](https://docs.temporal.io/develop/typescript/workflows/cancellation)
- [TypeScript Continue-As-New](https://docs.temporal.io/develop/typescript/workflows/continue-as-new)
- [Continue-As-New state handoff sample](https://github.com/temporalio/samples-typescript/blob/main/message-passing/safe-message-handlers/src/workflows.ts)
- [Temporal TypeScript samples repository](https://github.com/temporalio/samples-typescript)
