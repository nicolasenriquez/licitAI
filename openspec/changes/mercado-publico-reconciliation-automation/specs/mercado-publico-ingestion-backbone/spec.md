## MODIFIED Requirements

### Requirement: Traceable Job Execution

The system SHALL record every Mercado Publico ingestion or reconciliation job
with traceability fields required for audit and debugging.

#### Scenario: API job metadata is persisted

- **WHEN** an API ingestion job runs
- **THEN** the system stores `job_id`, `source`, `endpoint`, `request_params`,
  `http_status`, `fetched_at`, `checksum`, `schema_fingerprint`, record
  counters, and `error_summary`

#### Scenario: CSV job metadata is persisted

- **WHEN** a CSV ingestion job runs
- **THEN** the system stores source file metadata, profiling outcomes,
  quotechar, column count, row counters, parse counters, checksum, schema
  fingerprint, and error summary

#### Scenario: Reconciliation job metadata is persisted

- **WHEN** `reconciliation-refresh` runs from a command or schedule
- **THEN** the system creates and finalizes an `mp.stg_job_run` record
- **AND** the record stores success or failed status, timestamps, and a
  classified error summary when failed
- **AND** counters remain null unless real reconciliation metrics exist

### Requirement: Manual Execution And Run Observability

The system SHALL support manual phase-1 execution and scheduled reconciliation
while exposing run observability without requiring scheduled ingestion.

#### Scenario: Supported processes are manually triggerable in phase 1

- **WHEN** an operator manually triggers a supported Mercado Publico process
- **THEN** the system executes it through the existing backend job
  infrastructure
- **AND** it records a traceable job run outcome

#### Scenario: Reconciliation is scheduled internally

- **WHEN** the daily Mercado Público scheduler fires
- **THEN** it enqueues `reconciliation-refresh` through the existing domain
  queue
- **AND** API, CSV, and ingestion jobs remain manually triggerable only

#### Scenario: Phase-1 execution surface remains internal

- **WHEN** manual or scheduled phase-1 execution is implemented
- **THEN** the change does not add a new public GraphQL, REST, or MCP execution
  surface
- **AND** the execution model remains internal to `twenty-server`

#### Scenario: Pipeline health reflects real run history

- **WHEN** the system reports pipeline health
- **THEN** it reports latest run status, last success timestamp, last failure
  timestamp, and lag since last success
- **AND** reconciliation run history is available without fabricated counters

### Requirement: Minimum Job Surface

The system SHALL include API V1 date/state/detail jobs, API V2 Compra Agil
jobs, CSV jobs, and reconciliation refresh in this phase as manually
invocable processes, with reconciliation refresh also available through the
internal daily scheduler.

#### Scenario: Minimum operational job surface is present

- **WHEN** this backbone is implemented in this phase
- **THEN** it includes:
  - `api-v1-licitaciones-by-date`
  - `api-v1-licitaciones-by-state`
  - `api-v1-licitacion-detail-by-codigo`
  - `api-v1-oc-by-date`
  - `api-v1-oc-by-state`
  - `api-v1-oc-detail-by-codigo`
  - `api-v2-compra-agil-incremental`
  - `api-v2-compra-agil-by-publication-window`
  - `api-v2-compra-agil-detail-by-codigo`
  - `csv-licitaciones-download`
  - `csv-oc-download`
  - `csv-file-profile`
  - `csv-raw-load`
  - `csv-canonical-refresh`
  - `reconciliation-refresh`
- **AND** `reconciliation-refresh` is registered as a daily internal cron
