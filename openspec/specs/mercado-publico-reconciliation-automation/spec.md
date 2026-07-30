# Mercado Público Reconciliation Automation

## Purpose

This capability defines the automated daily reconciliation refresh for Mercado Público procurement data. The system runs reconciliation on a daily schedule through the existing BullMQ cron registry, materializing canonical procurement processes into a gold read layer for downstream consumers.

(TBD: Expand purpose with additional context once the change is complete.)

## Requirements

### Requirement: Scheduled Reconciliation Refresh

The system SHALL register an idempotent daily Mercado Público reconciliation cron through the existing BullMQ cron registry.

#### Scenario: Cron registration uses a stable identity

- **WHEN** the cron registry bootstraps or restarts
- **THEN** it registers one scheduler with job ID
  `mercado-publico-reconciliation-refresh`
- **AND** the schedule repeats every 86,400,000 milliseconds
- **AND** registration does not create duplicate schedulers

#### Scenario: Cron delegates to the domain executor

- **WHEN** the daily Mercado Público cron fires
- **THEN** it enqueues the existing `MercadoPublicoJob` with
  `jobName = reconciliation-refresh`
- **AND** it sets `requestedBy = schedule`
- **AND** it does not execute reconciliation inline

### Requirement: Reconciliation Run Observability

The system SHALL persist the outcome of every reconciliation refresh in the existing `mp.stg_job_run` contract.

#### Scenario: Successful refresh is finalized

- **WHEN** exact and heuristic reconciliation complete successfully
- **THEN** the system creates a `reconciliation-refresh` job run
- **AND** finalizes it with status `success` and a completion timestamp
- **AND** leaves counters null when the refresh did not produce those metrics

#### Scenario: Failed refresh is finalized and propagated

- **WHEN** reconciliation throws an error
- **THEN** the system finalizes the job run with status `failed`, completion timestamp, and the existing classified error summary
- **AND** it rethrows the original error to preserve worker failure handling

### Requirement: Complete Gold Process Materialization

The system SHALL upsert canonical licitacion, orden de compra, and Compra Agil entities into `mp.gold_detected_process` after reconciliation refresh.

#### Scenario: All canonical process types are materialized

- **WHEN** a gold materialization runs
- **THEN** it includes every valid natural key from `mp.licitacion`, `mp.orden_compra`, and `mp.compra_agil`
- **AND** Compra Agil uses `codigo` as `process_code` and `estado` as `canonical_state`
- **AND** unavailable title, buyer, priority, and date fields remain null

#### Scenario: Reconciliation status has explicit precedence

- **WHEN** an entity has multiple reconciliation evidence states
- **THEN** the materialized status is `exact` over `candidate`, `candidate` over `unmatched`, and `unmatched` over null
- **AND** candidate evidence is never promoted to exact

#### Scenario: Materialization is idempotent and non-destructive

- **WHEN** the same refresh runs more than once
- **THEN** natural-key conflicts update the existing gold row
- **AND** the operation does not create duplicate rows
- **AND** existing gold rows are not deleted
- **AND** `last_seen_at` does not move backwards