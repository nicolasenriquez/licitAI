---
type: change-proposal
title: "Change Proposal: mercado-publico-command-center"
description: "Read-only front-end command center to browse and monitor Mercado Publico ingestion."
okf_version: "0.1"
---
# Change Proposal: mercado-publico-command-center

## Why

The Mercado Público ingestion backbone persists licitaciones, órdenes de
compra, compra ágil, and job-run/API-call observability in the instance-level
`mp` schema, but there is no way to see any of it from the product. Today the
only way to inspect recent API calls, run statuses, quotas, and ingested
processes is raw SQL against `mp.*`. Operators and business users need a
read-only command center inside the application to browse tender/process
records and observe ingestion health, mirroring the established front-end
design system and the BullMQ queue-jobs monitoring precedent.

## Investigation / Current State

- Backend read services already exist and are exported (`DetectedProcessRead`,
  `ProcessDetailRead`, `PipelineHealthRead`, `ApiQuotaUsageRead`,
  `CsvFileHealthRead`) but no resolver or controller exposes them — see
  `investigation.md`.
- `mp` schema lives on the core datasource (not per-workspace TypeORM
  objects), so a custom code-first GraphQL resolver is required; registry is
  not a metadata/standard-object path.
- Front-end has zero Mercado Público code today. Routing (`AppPath`), lazy
  routes, data-driven `NavigationMenuItem`, Apollo codegen, Jotai, Linaria, and
  Lingui seams are documented in `investigation.md`.
- The hardening change `mercado-publico-ingestion-cue-hardening` explicitly
  excluded a frontend surface; this change owns that surface without modifying
  backend ingestion.

## What Changes

- Add a code-first GraphQL resolver on core `/graphql` exposing read-only
  Mercado Público queries: detected-process list (paginated/filtered), process
  detail, job-run list, API call log, pipeline health, API quota usage, CSV
  file health. Add two small read services over `mp.stg_job_run` and
  `mp.raw_api_payload` (compute live, mirroring `PipelineHealthRead`; do not
  write gold rows).
- Add a new top-level route `/mercado-publico#compra-agil` with a tabbed page:
  **Compra Ágil**, **Licitaciones**, **Centro de Control**. Compra Ágil is the
  canonical entry because the provider's primary task is to find actionable
  opportunities; technical observability remains a supporting third-level
  concern. Page mirrors the
  design system (`PageCardLayout`, `SettingsTabBar` pattern, twenty-ui `Tag`,
  table primitives) and the `SettingsAdminQueueJobsTable` monitoring shape.
- Add a LINK `NavigationMenuItem` so the view appears in the main navigation
  drawer. Optional feature-flag gate via `useIsFeatureEnabled`.
- Bind UI controls and values strictly to existing DTOs: browse filters are
  process type, state, exact buyer code, publication/changed dates, and sort;
  browse paging is `page`/`limit`/`total`. Monitoring logs alone use
  `limit`/`offset`/`hasMore`.
- Preserve independent local browse state for each tab (applied filters, page,
  selected row, and scroll position) while switching tabs or opening/closing a
  detail panel. Do not add global Jotai state unless a later cross-surface
  consumer demonstrates the need.

## Change Profile

- Profile: `runtime-change`
- Why this profile fits: the change adds a new GraphQL read contract on the
  core API and a new top-level front-end route that renders it. Both are
  runtime behavior additions.

## Out Of Scope

- Any write/trigger path: no ingestion mutation, no scheduler, no cron UI, no
  run/retry/delete buttons. Ingestion remains CLI-only.
- Writers for the currently-unwritten `gold_pipeline_health` and
  `gold_csv_file_health` tables; monitoring reads compute live like
  `PipelineHealthRead` does today.
- Modifying the existing `mercado-publico-ingestion-cue-hardening` change or
  any backend ingestion adapter/persistence logic.
- Per-workspace standard-object registration of `mp.*` tables (they are
  instance-level).
- Workspace-level permission modeling beyond an optional feature flag. A
  proper permission gate can follow a later change if required.
- Free-text process search, Compra Ágil region filtering, or fields absent from
  current DTOs. The UI does not synthesize OC amounts, award dates, percentage
  confidence, approval states, quota, cadence, or metrics.

## Impact

- Affects `twenty-server`: a new module-internal resolver and two read
  services; no changes to ingestion services or canonical/gold persistence. Add
  one fast instance migration for bounded-read indexes.
- Affects `twenty-front`: a new `mercado-publico` module (graphql/hooks/states/
  components), a new top-level page and route, a seeded navigation item, and a
  codegen registration.
- Does not affect: workspace metadata object registry, the `mp` schema, BullMQ
  producers/consumers, the CLI command, or any existing API/CSV adapter.

## Ownership and Test Seam

- Highest existing Seam: authenticated read-only queries on core `/graphql`
  observed by the Mercado Público page.
- Owning Module: backend resolver/read services under
  `packages/twenty-server/src/engine/core-modules/mercado-publico/`; frontend
  page/module under `packages/twenty-front/src/{pages,modules}/mercado-publico/`.
- Interface: typed GraphQL reads matching existing service DTOs; callers do
  not know SQL tables or ingestion adapters.
- Highest test Seam: resolver integration tests against seeded `mp.*`
  fixtures, followed by focused page/component visible-behavior tests.
- Adapter: resolver is a thin transport adapter. No ingestion adapter,
  standard-object registration, or persistence adapter is added.
- Depth / Leverage / Locality: one resolver exposes all reads; one frontend
  domain module owns mapping/presentation; shared Twenty primitives stay reused.

## Prior Art and First Proof

- Prior art: `SettingsAdminQueueJobsTable`, `SettingsTabBar`,
  `PageCardLayout`, and existing Mercado Público integration suites.
- First failing behavior or contract proof: core `/graphql` lacks these
  queries, and the authenticated app lacks the route/navigation entry.
- UI proof: fixtures cover canonical `#compra-agil` fallback, exact buyer-code
  filtering, browse paging and context preservation, bounded log loading,
  keyboard detail flow, redaction, and independent states.

## Execution Order Decision

- Required: yes.
- Why: backend contract, frontend data, shell, browse, detail, monitoring, and
  verification are multiple dependent slices.

## Verification Policy

- Add fail-first resolver coverage at the `/graphql` seam before wiring the
  front-end: list filters/pagination, detail, job-run list, API call log,
  pipeline health, quota, CSV file health.
- Verify front-end directly with jest per hook/component and a manual
  walkthrough against all six frames, including responsive, keyboard, 200%
  zoom, reduced-motion, redaction, and partial-error behavior.
- Do not substitute full e2e breadth for contract proof at the resolver seam.

## Notes

- Context: this is the frontend companion to the completed/hardening
  ingestion work; backend reads already exist and are tested.
- Assumptions: `mp.*` rows are visible to the configured core DB user; the
  resolver runs authenticated in the same workspace context as other core
 GraphQL queries. Workspace isolation is not imposed on `mp.*` (instance
  data) — the view is read-only and surfaces instance-level ingestion state.
- Boundaries: read-only. No new dependency, scheduling, free-text
  search, region catalogue, synthetic metric, or implementation in this pass.
