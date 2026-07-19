# Investigation: mercado-publico-command-center

## Purpose

Phase 0 scope lock. Captures the repo investigation that pins the ownership
boundary, the available backend read surface, the front-end mounting seams, and
the existing precedent components this change mirrors. Non-implementing by
design. The active change contract lives in `proposal.md`, `design.md`,
`tasks.md`, and `specs/mercado-publico-command-center/spec.md`.

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`,
`openspec/AGENTS.md`, `openspec/CONTEXT.md`,
`openspec/changes/mercado-publico-ingestion-cue-hardening/{proposal,design,tasks,specs/.../spec,schema-catalog}.md`,
`packages/twenty-server/AGENTS.md`, `packages/twenty-front/AGENTS.md`,
`packages/twenty-ui/AGENTS.md`, `packages/twenty-shared/AGENTS.md`.

## Backend surface (exists)

Module: `packages/twenty-server/src/engine/core-modules/mercado-publico/`.

- Persistence: `mp` schema on the **core** (instance-level) datasource, raw
  SQL only (no TypeORM entities). DDL in
  `src/database/commands/upgrade-version-command/2-16/`.
- Tables: `raw_api_payload`, `raw_csv_file`, `raw_csv_row`, `stg_job_run`,
  `stg_api_v1_licitacion`, `stg_api_v1_orden_compra`, `stg_api_v2_compra_agil`,
  `stg_csv_licitacion`, `stg_csv_orden_compra`, `licitacion` (+`_item`,
  `_oferta`, `_adjudicacion`), `orden_compra` (+`_item`), `compra_agil`
  (+`_producto_solicitado`, `_cotizacion`), `gold_detected_process`,
  `gold_pipeline_health`, `gold_api_quota_usage`, `gold_csv_file_health`,
  `gold_conciliacion_licitacion_oc`, `reconciliation_public_market_entities`,
  `reconciliation_event`.
- Read services (exported from `mercado-publico.module.ts`, no resolver today):
  `MercadoPublicoDetectedProcessReadService` (paginated list + detail with
  filters), `MercadoPublicoProcessDetailReadService`,
  `MercadoPublicoPipelineHealthReadService`, `MercadoPublicoApiQuotaUsageReadService`,
  `MercadoPublicoCsvFileHealthReadService`. Return shapes in
  `types/{detected-process,process-detail,pipeline-health,api-quota-usage,csv-file-health}-read.types.ts`.
- Observability rows: `mp.stg_job_run` (per run status, counters,
  `error_summary`, `started_at`/`finished_at`, `raw_csv_file_id`) and
  `mp.raw_api_payload` (per HTTP call: `source`, `endpoint`,
  `request_params jsonb`, `http_status`, `fetched_at`, `error_summary`,
  `records_fetched`, `ingestion_job_id`). Status union in
  `mercado-publico.constants.ts`:
  `success|failed|soft_miss|param_error|retryable_failed|skipped`.
- Trigger: CLI only (`mercado-publico:run --job-name --payload`) → BullMQ. No
  cron, no scheduler, no GraphQL/REST trigger.

## Backend surface (missing — in scope of this change)

- GraphQL resolver + ObjectTypes/Args on core `/graphql` wrapping the read
  services for: detected-process list + detail, job-run list, API call log,
  pipeline health, quota usage, CSV file health.
- Two small read services over `mp.stg_job_run` and `mp.raw_api_payload` (the
  gold writers for `gold_pipeline_health`/`gold_csv_file_health` are absent;
  pipeline health is computed live today, this change mirrors that for the
  call-log/job-run views rather than writing gold rows — see design decisions).

Out of scope: ingestion trigger mutation, scheduler, gold-table writers,
changes to `mercado-publico-ingestion-cue-hardening`.

## Front-end surface (exists, zero MP code)

- Routing: react-router `createBrowserRouter` single hook
  `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`. Path
  constants `AppPath` in `packages/twenty-shared/src/types/AppPath.ts`. Lazy
  via `LazyRoute` wrapper. New route inside
  `<Route element={<MainAppLayoutWithSidePanel />}>`.
- Nav: data-driven `NavigationMenuItem` (LINK/OBJECT/VIEW/...). Static escape
  hatch `NavigationDrawerOtherSection.tsx`. For first version we seed a LINK
  nav item (data-driven, idiomatic) — see design.
- Page skeleton mirror: `SettingsAI.tsx` (tabbed page, URL-hash tabs),
  `SettingsAdminQueueDetail.tsx` (minimal table page),
  `StandalonePageLayoutPage.tsx` (full-width non-settings layout). Building
  blocks: `PageContainer`, `PageHeader`, `PageBody`, `PageCardLayout`,
  `SettingsPageLayout`, `SettingsTabBar`, `SettingsPageContainer`.
- Design system: `twenty-ui/*` subpath exports. Status badges via `Tag` +
  `TagColor` (mirror `SettingsAdminJobStateBadge.tsx`). Tables via
  `SettingsTableListSection.tsx` + `SettingsAdminQueueJobsTable.tsx` (filters,
  status badge, expandable row detail, pagination). Charts via
  `settings/usage/components/*` sections.
- GraphQL codegen: three configs (`codegen.cjs` core `/graphql`,
  `codegen-metadata.cjs` `/metadata`, `codegen-admin.cjs` `/admin-panel`).
  Documents are `gql` tags in `*.ts` under
  `src/modules/<domain>/graphql/{queries,mutations,fragments}/`. No generated
  React hooks — consume `useQuery` + generated `DocumentNode`. New domain must
  be registered in the matching codegen `documents` glob; for this change,
  core `/graphql`, so `codegen.cjs`.
- State: Jotai via `createAtomState`/factory utils under
  `src/modules/<module>/states/`. `useState` for ephemeral UI (filters,
  pagination, selected row).
- Loading/empty/error: `SettingsSkeletonLoader`, `SettingsEmptyPlaceholder`,
  `AnimatedPlaceholder*` (twenty-ui/feedback), `InlineBanner`, `Banner`.
- i18n: Lingui macros (`t` / `Trans` / `plural`). Commands
  `npx nx run twenty-front:lingui:{extract,compile}`. Oxlint enforces
  `lingui/no-unlocalized-strings`.
- Closest monitoring precedent: `SettingsAdminQueueJobsTable.tsx`
  (BullMQ queue jobs table — filter select, status badge, expandable row,
  pagination `limit/offset + hasMore`, network-only fetch). Backed by
  `/admin-panel`. This change mirrors its interaction shape but on core
  `/graphql` with MP job-run rows.

## Design contract corrections confirmed

- Detected-process browse supports only process type, state, exact buyer code,
  publication range, changed-since, sort, and `page`/`limit` with `total`.
  There is no contract-backed free-text search or region filter.
- Process detail exposes identity, buyer, dates, items, adjudications, related
  purchase orders, source lineage, source priority, last-seen time, and a
  reconciliation summary. It does not expose purchase-order amount, award
  date, percentage confidence, or approval state.
- Reconciliation evidence is represented by exact/candidate/unmatched counts
  and `manualReviewRequired`; the UI must not synthesize stronger evidence.
- Navigation drawer width is constrained to 180–350 px with 220 px default;
  desktop detail uses `--t-side-panel-width` (500 px), while mobile follows the
  existing full-viewport side-panel behavior.
- `PageCardLayout` supplies the white application surface and 16 px top-left
  radius. `SettingsTabBar` supplies the URL-hash tab precedent.
- `SettingsAdminQueueJobsTable` supplies filter, status-tag, expandable-row,
  and previous/next pagination vocabulary. Retry, delete, and selection
  controls are intentionally excluded from this read-only surface.
- Root `PRODUCT.md` and `DESIGN.md` describe the marketing website, not the
  authenticated application; application source and Twenty UI primitives are
  therefore the binding visual authority for this change.

## Verification seam

- Resolver: integration test at the `/graphql` seam against `mp.*` tables with
  seeded fixtures (proc/runner lives in existing
  `packages/twenty-server/test/integration/mercado-publico/suites/`).
- Front: jest per hook/component following `SettingsAdminQueueJobsTable`
  precedent; oxlint `lingui/no-unlocalized-strings`; `npx nx typecheck
  twenty-front`; `npx nx lint:diff-with-main twenty-front`.

## Confirmed out-of-scope (from prior change)

The hardening change
`openspec/changes/mercado-publico-ingestion-cue-hardening/` explicitly excludes
"frontend workflow" and "frontend surface" (proposal.md:49, :89). This change is
the separate frontend read view; it consumes the read models produced by the
backbone/hardening work without modifying them.

## Phase 0 execution evidence

- `0.1` PASS: DTOs expose only design-backed fields; unsupported search and
  synthetic metrics are absent.
- `0.2` PASS: authenticated normal routes fall through the navigation hook;
  route belongs inside `MainAppLayoutWithSidePanel`.
- `0.3` PASS: fast migration adds stable `started_at` and `fetched_at` indexes
  plus partial `(ingestion_job_id, fetched_at, id)` index. Future read queries
  remain bounded by `limit/offset`; no gold writes added.
