---
type: change-spec
title: "Spec: mercado-publico-v2-sync-operations"
description: "Accepted specification for Mercado Publico V2 Sync Operations."
okf_version: "0.1"
---
# Spec: mercado-publico-v2-sync-operations

## Purpose

TBD

## Requirements

### Requirement: Only explicit human operators control V2 synchronization
The system SHALL authorize the control boundary only from an explicit
`mp.sync_operator` assignment for the authenticated workspace member. It SHALL
deny analysts, workspace administrators without assignment, API keys, and
applications. Control data SHALL be isolated by workspace.

#### Scenario: Administrator without assignment calls the control boundary
- **WHEN** an authenticated administrator has no operator assignment
- **THEN** the system returns the standard permission denial and no control data

#### Scenario: Foreign workspace owns the global run
- **WHEN** an assigned operator starts a sync while another workspace owns it
- **THEN** the system records local reuse and returns only `global_sync_active`

### Requirement: Start, resume, and cancel commands are durable and idempotent
The system SHALL accept only global incremental start, recoverable resume, and
cancel commands. Start and cancel SHALL require confirmation. Every command
SHALL have a UUID idempotency key, actor, workspace, intent, and durable result.
The same key and request SHALL return the saved result. A changed request for
the same key SHALL return `409 Conflict`.

#### Scenario: Redis is unavailable after a confirmed start
- **WHEN** the command transaction commits but enqueue fails
- **THEN** the response reports `queued` and the command remains dispatchable

#### Scenario: Operator retries a submitted start
- **WHEN** an operator submits the same confirmed start with the same key
- **THEN** the system returns the original result and creates no second run

### Requirement: One global V2 run is active
The system SHALL enforce at most one nonterminal global V2 run with a database
constraint. A same-workspace start during that run SHALL return its safe active
status. The system SHALL NOT implement filtered starts, an incompatible-scope
queue, or a separate write-lease table in G3.

#### Scenario: Concurrent global starts
- **WHEN** two operators confirm global starts concurrently
- **THEN** exactly one run is created and the other command is recorded as reuse

### Requirement: Provider execution is durable, asynchronous, and recoverable
The resolver SHALL persist the command and never call a provider or durable
engine. Only a queue worker SHALL execute an existing run. `sync_command` SHALL
act as the durable outbox. The existing cron queue SHALL recover pending
dispatches and workers with expired heartbeats, but SHALL NOT retry a normal
provider or process failure automatically.

#### Scenario: Worker receives a duplicate job
- **WHEN** a command is terminal or already claimed
- **THEN** the worker performs no provider work and changes no terminal state

### Requirement: Cancellation preserves evidence and recovery
The system SHALL cancel queued commands immediately without deleting their
BullMQ job. Active cancellation SHALL be cooperative: the worker SHALL stop
after its current atomic page or item operation, retain checkpoints and
evidence, and then record `cancelled`. Only discovery-complete `partial_failed`
and `cancelled` runs SHALL be resumable.

#### Scenario: Operator cancels an active run
- **WHEN** an assigned operator confirms cancellation during hydration
- **THEN** the worker completes at most the current item and preserves its
  checkpoints before recording `cancelled`

### Requirement: Latest-run audit is safe and visible
The system SHALL append immutable events for control and worker decisions. The
control UI SHALL show the latest workspace run with its full safe timeline,
visible operator name, timestamp, status, counts, retryability, and sanitized
summary. It SHALL NOT expose payloads, idempotency keys, internal IDs, foreign
workspace data, or technical causes.

#### Scenario: Operator opens Centro de control
- **WHEN** an assigned operator opens the route
- **THEN** it receives only its workspace's latest safe run and timeline