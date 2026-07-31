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

The observed Compra Ágil view also exposes a material data-quality failure:
the provider response already contains title, buyer institution, state, and
dates, but the local pipeline drops or hard-codes those fields to `NULL` before
the read model. The local snapshot is additionally stale and page-one-only.
This amendment corrects that source-to-read contract without turning the
command center into an ingestion control surface.

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
- The retained successful V2 Compra Ágil payload contains `nombre`, nested
  `estado.{codigo,glosa}`, `fechas.{fecha_publicacion,fecha_cierre,
  fecha_ultimo_cambio}`, and `institucion.{rut,organismo_comprador,
  unidad_compra,region}`. These values are provider evidence, not a missing
  local organism lookup.
- The live V2 staging and canonical tables have no title or buyer columns, and
  the Compra Ágil branch of gold materialization explicitly emits `NULL` for
  title, buyer, publication, and closing fields. The shipped UI faithfully
  renders those nulls.
- The latest retained list response declares 200 pages / 10,000 results, while
  every successful local call requested page 1. The latest successful Compra
  Ágil job completed on 2026-07-18; current freshness is therefore not a
  provider-total claim.
- A registered date migration is present in the runtime but unapplied in the
  local database. Its schema precondition must be satisfied through the
  supported instance-command workflow before another V2 ingestion run.
- Licitaciones are a related but distinct gap: their V1 list supplies title,
  state, and closing date, while retained detail responses supply buyer and
  publication fields that are not currently normalized.

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
- Correct the Compra Ágil browse contract with the smallest normalized field
  set: title, buyer name, normalized state, publication date, and closing date.
  Apply the existing pending date command through the supported upgrade
  workflow, add only the immutable schema fields that this list needs, repair
  retained raw evidence idempotently, and materialize those fields through
  gold and GraphQL. `institucion.rut` MUST NOT be repurposed as the V1-style
  `buyer_code`.
- Reuse the existing process-detail panel for the rest of the currently
  observed V2 list record. The backend maps the latest retained raw record for
  the requested code into a typed GraphQL detail object; the browser neither
  receives raw JSON nor calls the provider when a user opens detail. Documents
  expose only their observed ID and name, and `links.detalle` remains a
  non-clickable technical reference.
- Make V2 list discovery complete for every provider-declared page up to
  `MP_COMPRA_AGIL_MAX_PAGES=250`. The CLI runs daily by documented deployment
  operation, retains one raw request/response per page, and records partial
  completion if the provider declares more pages than that cap. No scheduler
  or UI control is added.

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
- Modifying the existing `mercado-publico-ingestion-cue-hardening` change.
- A public API or UI control for paging, backfill, retry, migration, or
  scheduling; these remain deployment/operator actions through documented
  backend commands.
- Per-workspace standard-object registration of `mp.*` tables (they are
  instance-level).
- Workspace-level permission modeling beyond an optional feature flag. A
  proper permission gate can follow a later change if required.
- Free-text process search, Compra Ágil region filtering, an authoritative
  buyer-reference join, V1 Licitaciones normalization, or a bulk
  detail-hydration policy. The UI does not synthesize OC amounts, award dates,
  percentage confidence, approval states, quota, cadence, or metrics.
- A generic raw-JSON viewer, automatic GraphQL/UI exposure of future provider
  fields, document downloads, or an external link built from `links.detalle`.
- Any unbounded or browser-initiated detail hydration. A complete CLI list run
  MAY enqueue one existing detail job per deduplicated `publicada` code when
  no detail snapshot exists or the provider change timestamp differs.

## Impact

- Affects `twenty-server`: the resolver/read services plus the minimal V2
  browse extraction, persistence, canonical refresh, gold materialization,
  immutable instance commands, raw-evidence backfill, complete bounded list
  orchestration, and a typed detail adapter over retained raw evidence. Add no
  public write transport.
- Affects `twenty-front`: a new `mercado-publico` module (graphql/hooks/states/
  components), a new top-level page and route, a seeded navigation item, and
  codegen updates for the typed Compra Ágil detail object shown in the existing
  side panel.
- Does not affect: workspace metadata object registry, public mutations, the
  command-center's read-only interaction boundary, or CSV source semantics.

## Ownership and Test Seam

- Highest existing Seam: raw provider evidence materialized into
  `mercadoPublicoDetectedProcesses` and observed by the Mercado Público page.
- Owning Module: backend API adapters, persistence/canonical/reconciliation
  services, and resolver/read services under
  `packages/twenty-server/src/engine/core-modules/mercado-publico/`; frontend
  page/module under `packages/twenty-front/src/{pages,modules}/mercado-publico/`.
- Interface: browse fields normalize into explicit staging/canonical fields;
  detail-only fields map from the latest retained raw evidence into a typed
  detail object. Callers do not know SQL tables, raw JSON, or ingestion
  adapters.
- Highest test Seam: one integration fixture crosses raw V2 payload, staging,
  canonical, gold, and the browse resolver; a second resolves the latest raw
  record into the typed detail object. Focused page tests remain presentation
  proof, not pipeline proof.
- Adapter: the V2 API extractor is the source-shape adapter; the resolver
  remains the thin read transport adapter.
- Depth / Leverage / Locality: one field mapping fixes every read consumer,
  preserves raw provenance, and keeps UI fallbacks truthful rather than hiding
  a pipeline defect.

## Prior Art and First Proof

- Prior art: `SettingsAdminQueueJobsTable`, `SettingsTabBar`,
  `PageCardLayout`, the existing Mercado Público integration suites, and the
  registered Compra Ágil date/backfill commands.
- First failing behavior or contract proof: a real-shaped V2 payload with
  `nombre`, nested state, dates, and institution reaches GraphQL with browse
  fields null; its detail-only fields cannot be displayed without raw JSON;
  and a payload declaring page 2 is not requested.
- UI proof: fixtures cover canonical `#compra-agil` fallback, exact buyer-code
  filtering, browse paging and context preservation, bounded log loading,
  keyboard detail flow, redaction, and independent states.

## Execution Order Decision

- Required: yes.
- Why: schema readiness, minimal browse mapping, typed raw-detail adaptation,
  raw backfill, full bounded pagination, read contract, and UI verification
  are dependent slices. The existing date migration is a hard operational
  precondition for safe V2 ingestion.

## Verification Policy

- Add fail-first resolver coverage at the `/graphql` seam before wiring the
  front-end: list filters/pagination, detail, job-run list, API call log,
  pipeline health, quota, CSV file health.
- Add a fail-first end-to-end data-contract fixture proving that provider title,
  buyer name, nested state, publication, and closing survive raw -> staging ->
  canonical -> gold -> GraphQL. Assert separately that buyer RUT is never
  treated as buyer code.
- Add a detail fixture proving that the latest retained raw record is mapped
  server-side into typed V2 detail fields (documents as ID/name only and source
  detail path as a non-clickable reference), with no provider call or raw JSON
  in the browser.
- Add a bounded-pagination fixture proving every provider-declared page up to
  `MP_COMPRA_AGIL_MAX_PAGES=250` is requested and retained; verify that the
  job reports partial completion beyond that cap.
- Verify the idempotent raw backfill repairs the 60 historical state-less rows
  when their retained payload contains a nested state, without overwriting a
  non-null canonical value with null.
- Verify front-end directly with jest per hook/component and a manual
  walkthrough against all six frames, including responsive, keyboard, 200%
  zoom, reduced-motion, redaction, and partial-error behavior.
- Do not substitute full e2e breadth for contract proof at the resolver seam.

## Notes

- Context: this began as the frontend companion to completed ingestion work.
  Retained provider evidence and the live read model now demonstrate that the
  missing browse information is a backend data-contract defect, not a UI or
  source-availability defect.
- Assumptions: `mp.*` rows are visible to the configured core DB user; the
  resolver runs authenticated in the same workspace context as other core
 GraphQL queries. Workspace isolation is not imposed on `mp.*` (instance
  data) — the view is read-only and surfaces instance-level ingestion state.
- Boundaries: the command center remains read-only. No new dependency, public
  scheduling, free-text search, region catalogue, synthetic metric, or
  authority to run migrations/backfills from the UI is introduced.
