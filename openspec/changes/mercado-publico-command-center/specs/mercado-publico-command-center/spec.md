---
type: change-spec
title: "Spec: mercado-publico-command-center"
description: "Specification for the Mercado Publico command center read view."
okf_version: "0.1"
---
# Spec: mercado-publico-command-center
## ADDED Requirements

### Requirement: Expose Mercado Público reads through core GraphQL

The system MUST expose read-only Mercado Público queries on the core
`/graphql` endpoint by delegating to the existing read services and two new
read services over `mp.stg_job_run` and `mp.raw_api_payload`. The system MUST
NOT register `mp.*` tables as workspace standard objects and MUST NOT add a
write, trigger, scheduler, or retry path.

#### Scenario: Browse detected processes
- **WHEN** a client queries the detected-process list with filters
  (`processTypes`, `states`, `buyerCode`, `publishedFrom`/`To`, `changedSince`,
  `sort`) and pagination
- **THEN** the resolver returns paginated processes from the existing
  `MercadoPublicoDetectedProcessReadService`

#### Scenario: Process detail
- **WHEN** a client queries a process detail by type and code
- **THEN** the resolver returns items, adjudications, related OCs, source
  lineage, and reconciliation summary from the existing
  `MercadoPublicoProcessDetailReadService`

#### Scenario: No write surface
- **WHEN** a client attempts any mutation on Mercado Público
- **THEN** no Mercado Público mutation is offered and no ingestion is
  triggered

### Requirement: Expose ingestion job-run and API call log monitoring

The system MUST expose paginated, read-only queries over `mp.stg_job_run` and
`mp.raw_api_payload` computing live (without writing gold rows), with the
documented status union and indexed `limit/offset` ordering.

#### Scenario: Job-run list with status union
- **WHEN** a client queries job runs filtered by status and/or job name with
  pagination
- **THEN** the resolver returns runs including the statuses
  `success`, `failed`, `soft_miss`, `param_error`, `retryable_failed`, and
  `skipped`, with `error_summary` available for expandable row detail

#### Scenario: API call log
- **WHEN** a client queries API calls filtered by `source`, `endpoint`, and/or
  `http_status` with pagination
- **THEN** the resolver returns `raw_api_payload` rows with `source`,
  `endpoint`, `request_params`, `http_status`, `records_fetched`, `fetched_at`,
  `error_summary`, and the `ingestion_job_id` link

#### Scenario: Bounded reads
- **WHEN** either monitoring query runs
- **THEN** it uses `limit/offset` ordered by indexed
  `ingestion_job_id`/`started_at`/`fetched_at` and performs no unbounded scan
  or gold-row write

### Requirement: Render a top-level tabbed command center

The system MUST render a `/mercado-publico` top-level page inside
`MainAppLayoutWithSidePanel` with `PageCardLayout`, a `PageHeader`, and
URL-hash tabs **Licitaciones**, **Compra Ágil**, **Centro de Control**, using
the twenty-ui design system and Lingui-localized strings from day one.

#### Scenario: Page loads under main layout
- **WHEN** an authenticated user navigates to `/mercado-publico`
- **THEN** the page loads inside `MainAppLayoutWithSidePanel`, full-width,
  with the three tabs present

#### Scenario: Tab state in the URL
- **WHEN** the user switches tabs
- **THEN** the active tab is reflected in the URL hash and survives reload

### Requirement: Browse licitaciones and compra ágil

The **Licitaciones** tab MUST render a filterable, paginated detected-process
list filtered to licitaciones, with status `Tag` badges using the documented
color map. The **Compra Ágil** tab MUST render the same list shape filtered to
compra ágil, using the compra ágil estado enum
(`publicada|cerrada|desierta|cancelada|proveedor_seleccionado|oc_emitida`).
Selecting a row MUST open a detail side panel.

#### Scenario: Licitaciones filters and pagination
- **WHEN** the user applies estado/organismo/publicado filters and paginates
- **THEN** the list results update against the resolver with `limit/offset`
  and "Cargar más" until `hasMore` is false

#### Scenario: Estado badge colors
- **WHEN** licitaciones or compra ágil rows are rendered
- **THEN** statuses map to `TagColor` per the wireframe legend
  (`publicada=green`, `cerrada=gray`, `adjudicada=blue`, `desierta=red`,
  `suspendida=amber`, `revocada=red`; compra ágil:
  `proveedor_seleccionado=blue`, `oc_emitida=purple`, `cancelada=red`)

#### Scenario: Process detail side panel
- **WHEN** the user selects a process row
- **THEN** a side panel shows items, adjudications/ cotizaciones, related
  OCs, and the reconciliation summary from the process-detail query

### Requirement: Render the Centro de Control monitoring surface

The **Centro de Control** tab MUST render pipeline health cards per job,
quota usage bars with last 429 and reset time, a job-run log table, an API
call log table, and a CSV file health section, mirroring the
`SettingsAdminQueueJobsTable` interaction shape.

#### Scenario: Pipeline health cards
- **WHEN** the tab loads
- **THEN** cards show per job_name the latest status, last success, last
  failure, failure count (7d), and lag from `PipelineHealthRead`

#### Scenario: Job-run log table
- **WHEN** the user filters by status/job and paginates
- **THEN** the table shows job runs with status badges and expandable row
  detail exposing `error_summary` and the `raw_csv_file` link when present

#### Scenario: API call log table
- **WHEN** the user filters by source/endpoint/http_status and paginates
- **THEN** the table shows `raw_api_payload` rows with http_status badges
  and expandable row detail exposing `request_params` and `error_summary`

### Requirement: Provide loading, empty, and error states

Every tab and the detail panel MUST show design-system loading skeletons, an
empty placeholder when no rows are returned, and an inline error banner when a
query fails.

#### Scenario: Loading
- **WHEN** a query is in flight and no previous data exists
- **THEN** the section renders the matching skeleton placeholder

#### Scenario: Empty
- **WHEN** a query succeeds with zero rows
- **THEN** the section renders an empty placeholder with a localized message

#### Scenario: Error
- **WHEN** a query fails
- **THEN** the section renders an inline error banner and does not crash the
  page or other tabs

### Requirement: Navigation entry is data-driven

The view MUST appear in the main navigation drawer via a LINK
`NavigationMenuItem` targeting the new `AppPath`, optionally gated by a feature
flag, and MUST NOT rely on a hardcoded drawer row.

#### Scenario: Nav item present
- **WHEN** an authorized user opens the main drawer
- **THEN** a "Mercado Público" LINK item navigates to `/mercado-publico`

#### Scenario: Feature flag gating
- **WHEN** the view's feature flag is disabled
- **THEN** the nav item and route are hidden