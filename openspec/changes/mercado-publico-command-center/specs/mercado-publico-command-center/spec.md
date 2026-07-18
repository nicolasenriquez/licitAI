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
  (`processTypes`, `states`, exact `buyerCode`, `publishedFrom`/`To`,
  `changedSince`, `sort`) and `page`/`limit`
- **THEN** the resolver returns `items`, `page`, `limit`, and `total`
  from the existing `MercadoPublicoDetectedProcessReadService`

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
the twenty-ui design system and Lingui-localized strings from day one. The
canonical entry MUST be `/mercado-publico#licitaciones`; missing or unknown
hashes MUST fall back to `licitaciones`.

#### Scenario: Page loads under main layout
- **WHEN** an authenticated user navigates to `/mercado-publico` without a
  valid tab hash
- **THEN** the page loads inside `MainAppLayoutWithSidePanel`, full-width,
  with three tabs and Licitaciones selected

#### Scenario: Tab state in the URL
- **WHEN** the user switches tabs
- **THEN** the active tab is reflected in the URL hash and survives reload

### Requirement: Browse licitaciones and compra ágil

The **Licitaciones** tab MUST render a detected-process list fixed to
licitaciones and filtered only by contract-backed fields: state, exact buyer
code, publication range, changed-since, and sort. Browse pagination MUST use
`page`/`limit`/`total`. The **Compra Ágil** tab MUST reuse that shape,
fixed to compra ágil and its estado enum
(`publicada|cerrada|desierta|cancelada|proveedor_seleccionado|oc_emitida`).
This change MUST NOT add partial client-side search, a region filter, or fields
absent from the DTO. Selecting a row MUST open the detail side panel.

#### Scenario: Licitaciones filters and pagination
- **WHEN** the user applies state, exact buyer-code, publication, or
  changed-since filters, changes sort, or moves page
- **THEN** the list sends those exact inputs plus `page`/`limit` and renders
  the returned `total` through previous/next page controls

#### Scenario: Estado badge colors
- **WHEN** licitaciones or compra ágil rows are rendered
- **THEN** statuses map to `TagColor` per the wireframe legend
  (`publicada=green`, `cerrada=gray`, `adjudicada=blue`, `desierta=red`,
  `suspendida=amber`, `revocada=red`; compra ágil:
  `proveedor_seleccionado=blue`, `oc_emitida=purple`, `cancelada=red`)

#### Scenario: Process detail side panel
- **WHEN** the user selects a process row
- **THEN** the side panel renders only process identity/state, buyer, dates,
  items, adjudications, related OC code/state/match evidence, source lineage,
  reconciliation counts, source priority, and last-seen data supplied by the
  process-detail query
- **AND** null or empty sections say `Sin información` without inventing OC
  amount, award date, percentage confidence, or approval state

### Requirement: Render the Centro de Control monitoring surface

The **Centro de Control** tab MUST render one continuous monitoring surface:
a compact pipeline health matrix, quota usage rows with last 429/reset time,
a job-run log table, an API call log table, and CSV file health. It MUST reuse
the `SettingsAdminQueueJobsTable` interaction vocabulary without copying its
retry, delete, selection, or other write controls.

#### Scenario: Pipeline health matrix
- **WHEN** the tab loads
- **THEN** compact rows show per `jobName` latest status, last success,
  last failure, failure count, lag, freshness, and expected cadence from
  `PipelineHealthRead`

#### Scenario: Job-run log table
- **WHEN** the user filters by status/job and paginates
- **THEN** the table shows job runs with status badges and expandable row
  detail exposing `error_summary` and the `raw_csv_file` link when present

#### Scenario: API call log table
- **WHEN** the user filters by source/endpoint/http_status and loads a bounded
  page
- **THEN** the table shows `raw_api_payload` rows with HTTP status badges and
  expandable detail exposing redacted `request_params` and `error_summary`
- **AND** keys equivalent to ticket, authorization, cookie, token, password, or
  secret are masked before rendering

### Requirement: Provide loading, empty, and error states

Every tab, dashboard section, and detail panel MUST distinguish initial
loading, background refetch, first-run empty, filtered no-results, missing
optional data, and query error. Dashboard sections MUST fail independently.

#### Scenario: Loading and refetch
- **WHEN** a query is in flight and no previous data exists
- **THEN** the section renders a geometry-matched skeleton
- **WHEN** a refetch starts with previous data available
- **THEN** previous data remains visible and only the affected section is busy

#### Scenario: Empty and filtered no-results
- **WHEN** monitoring succeeds before any ingestion has run
- **THEN** the page explains that data appears after CLI ingestion and links to
  documentation
- **WHEN** an active filter returns zero rows
- **THEN** the section offers `Limpiar filtros` without presenting first-run copy

#### Scenario: Error
- **WHEN** a query fails
- **THEN** the section renders an inline error banner and does not crash the
  page or other tabs

### Requirement: Provide accessible responsive behavior

The page MUST preserve the existing drawer, tab, table, and side-panel
affordances across desktop, tablet, mobile, keyboard-only use, 200% zoom, and
reduced-motion preferences. Status meaning MUST never rely on color alone.

#### Scenario: Keyboard detail flow
- **WHEN** a keyboard user activates a process row
- **THEN** the detail panel opens, Escape closes it, and focus returns to the
  originating row

#### Scenario: Mobile and zoom
- **WHEN** the viewport is mobile-sized or content is zoomed to 200%
- **THEN** filters stack, tabs remain reachable, process rows use compact
  presentation, detail occupies the existing mobile panel, and the viewport
  has no horizontal overflow

### Requirement: Navigation entry is data-driven

The view MUST appear in the main navigation drawer via a LINK
`NavigationMenuItem` targeting the new `AppPath`, optionally gated by a feature
flag, and MUST NOT rely on a hardcoded drawer row.

#### Scenario: Nav item present
- **WHEN** an authorized user opens the main drawer
- **THEN** a "Mercado Público" LINK item navigates to
  `/mercado-publico#licitaciones`

#### Scenario: Feature flag gating
- **WHEN** the view's feature flag is disabled
- **THEN** the nav item and route are hidden
