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
- Add a new top-level route `/mercado-publico` with a tabbed page:
  **Licitaciones**, **Compra Ágil**, **Centro de Control**. Page mirrors the
  design system (`PageCardLayout`, `SettingsTabBar` pattern, twenty-ui `Tag`,
  table primitives) and the `SettingsAdminQueueJobsTable` monitoring shape.
- Add a LINK `NavigationMenuItem` so the view appears in the main navigation
  drawer. Optional feature-flag gate via `useIsFeatureEnabled`.

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

## Impact

- Affects `twenty-server`: a new module-internal resolver and two read
  services; no changes to ingestion services, persistence, or migrations.
- Affects `twenty-front`: a new `mercado-publico` module (graphql/hooks/states/
  components), a new top-level page and route, a seeded navigation item, and a
  codegen registration.
- Does not affect: workspace metadata object registry, the `mp` schema, BullMQ
  producers/consumers, the CLI command, or any existing API/CSV adapter.

## Ownership and Test Seam

- Owning module (backend): new resolver under
  `packages/twenty-server/src/engine/core-modules/mercado-publico/`
  consuming the module's existing read services.
- Owning module (frontend):
  `packages/twenty-front/src/modules/mercado-publico/` plus
  `packages/twenty-front/src/pages/mercado-publico/`.
- Interface: read-only GraphQL queries on core `/graphql` over `mp.*`.
- Test seam: resolver integration tests against `mp.*` with seeded fixtures
  (co-located with
  `packages/twenty-server/test/integration/mercado-publico/suites/`), plus
  focused front-end jest for hooks/components.
- Adapter: none new. The resolver is a thin wrapper over existing read
  services; the only new data access is two read-only SQL queries over
  existing `mp.stg_job_run` and `mp.raw_api_payload` rows.

## Verification Policy

- Add fail-first resolver coverage at the `/graphql` seam before wiring the
  front-end: list filters/pagination, detail, job-run list, API call log,
  pipeline health, quota, CSV file health.
- Verify front-end directly with jest per hook/component and a manual
  walkthrough against the design wireframes.
- Do not substitute full e2e breadth for contract proof at the resolver seam.

## Notes

- Context: this is the frontend companion to the completed/hardening
  ingestion work; backend reads already exist and are tested.
- Assumptions: `mp.*` rows are visible to the configured core DB user; the
  resolver runs authenticated in the same workspace context as other core
 GraphQL queries. Workspace isolation is not imposed on `mp.*` (instance
  data) — the view is read-only and surfaces instance-level ingestion state.
- Boundaries: read-only. No new dependency, no migration, no scheduling.