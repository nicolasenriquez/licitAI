---
type: change-design
title: "Design: mercado-publico-command-center"
description: "Design for the Mercado Publico command center read view."
okf_version: "0.1"
---
# Design: mercado-publico-command-center

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`,
`openspec/AGENTS.md`, `openspec/CONTEXT.md`,
`openspec/changes/mercado-publico-ingestion-cue-hardening/{proposal,design,tasks,specs/.../spec}.md`,
`packages/twenty-server/AGENTS.md`, `packages/twenty-front/AGENTS.md`,
`packages/twenty-ui/AGENTS.md`. Research captured in `investigation.md`.

## Context

The Mercado Público ingestion backbone persists raw API payloads, raw CSV
files/rows, staging rows, canonical processes, job-run counters, and
reconciliation evidence in the instance-level `mp` schema, with five read
services already exported. None of it is visible from the application; operators
fall back to raw SQL. This change adds a read-only command center: browse
licitaciones and compra ágil processes, and monitor ingestion job runs and
upstream API calls. The design preserves the existing backend untouched and
mirrors established front-end patterns (tabbed page, data-driven nav, BullMQ
queue-jobs monitoring table).

## Goals / Non-Goals

**Goals**

- Expose the existing backend read services through a code-first GraphQL
  resolver on core `/graphql`.
- Render a top-level, full-width, tabbed command center following the design
  system and the queue-jobs monitoring precedent.
- Show process list with filters, process detail side panel, ingestion job-run
  log, upstream API call log, pipeline health, API quota usage, and CSV file
  health.

**Non-Goals**

- Ingestion triggers, scheduling, retry/delete mutations, gold-table writers,
  per-workspace projection of `mp.*`, and any backend adapter/persistence
  change.

## Boundary and Ownership

### Backend resolver boundary

A new `@Resolver` under `packages/twenty-server/src/engine/core-modules/mercado-publico/`
delegates to the existing read services plus two new read services
(`job-run-read`, `api-call-log-read`) that run raw SQL against `mp.stg_job_run`
and `mp.raw_api_payload`. The resolver is the only entry point the front-end
calls; it owns transport mapping and authentication wiring.

### Front-end module boundary

`packages/twenty-front/src/modules/mercado-publico/` owns graphql documents,
hooks, jotai states, and components. `pages/mercado-publico/` owns the page.
The module is self-contained; it does not touch other front-end modules beyond
shared UI primitives and the route/nav registration seams.

### Registration seams

- `AppPath` member (twenty-shared).
- Route in `useCreateAppRouter.tsx` inside `MainAppLayoutWithSidePanel`.
- LINK `NavigationMenuItem` seed (data-driven nav).
- `codegen.cjs` `documents` glob for the new module graphql docs.
- Optional `useIsFeatureEnabled` flag.

## Decisions

### Read-only view, no ingestion trigger UI

The first version exposes reads only; ingestion stays on the CLI. A trigger
mutation would add a permission model, queue-write blast radius, and payload
validation UI that are not needed to satisfy the monitoring need.

Rationale: smallest safe runtime slice; matches the prior change's explicit
frontend exclusion (observer surface first).

Alternatives considered:
- Include a "Run ingestion" button — rejected: widens permission/queue-write
  surface and hides the read-seam behind a write concern.
- Add scheduling config — rejected: scheduling is a missing backend
  capability and out of scope.

### Core `/graphql` resolver, not metadata or admin-panel

`mp.*` is business data (tenders, OC, compra ágil) consumed by workspace
users, not instance config or server administration.

Rationale: semantically correct; workspace auth context applies naturally.

Alternatives considered:
- `/metadata` — rejected: MP is operational domain data, not workspace
  metadata.
- `/admin-panel` — rejected: audience is business operators, not sysadmins,
  and the endpoint is server-admin gated.

### Thin resolver wrapping existing read services

The resolver maps the five existing read service DTOs to GraphQL ObjectTypes
and adds two read services for job runs and API call logs that compute live
from `mp.stg_job_run` and `mp.raw_api_payload`. Gold writers are not added;
pipeline/XML health mirrors the live-compute pattern.

Rationale: reuses tested services; no schema migration; no gold-row
write/refresh lifecycle to maintain.

Alternatives considered:
- Write `gold_pipeline_health`/`gold_csv_file_health` rows — rejected: adds
  a write lifecycle entangled with ingestion for a read-only view.
- Materialize a dedicated view-read model — rejected: YAGNI until a query
  performance profile demands it.

### Top-level route, full-width layout

A new `/mercado-publico` route with `PageCardLayout` gives the wide surface a
multi-panel monitoring dashboard needs. The settings `SettingsPageContainer`
max-width of 760px would truncate wide log tables.

Rationale: matches `StandalonePageLayoutPage`/`RecordIndexPage` precedent for
operational data; keeps settings for configuration.

Alternatives considered:
- Settings sub-page — rejected: narrow container and wrong audience nesting.
- Split browse (top-level) + monitoring (settings/admin) — rejected: splits
  one domain across two seams and two registrations.

### Data-driven nav via LINK NavigationMenuItem

Add a LINK `NavigationMenuItem` pointing at the new `AppPath` rather than a
hardcoded drawer row, to keep upstream merge surface small and follow the
idiomatic data-driven drawer.

Rationale: precedent for OBJECT/VIEW items is automatic; LINK is the
intended static-route escape hatch that still flows through the data model.

Alternatives considered:
- Hardcoded `NavigationDrawerItem` in `NavigationDrawerOtherSection` —
  rejected: bypasses the data-driven drawer and increases divergence.

### Monitoring tables mirror `SettingsAdminQueueJobsTable`

The job-run and API-call-log tables reuse the shape of the existing BullMQ
queue-jobs table: filter select, status `Tag` badge, expandable row detail,
`limit/offset + hasMore` pagination, `network-only` fetch.

Rationale: proven interaction shape, design tokens, and a11y already exist.

Alternatives considered:
- Build a bespoke table — rejected: reinvents existing primitives.

### I18n from day one

All user-visible strings use Lingui macros; the oxlint
`lingui/no-unlocalized-strings` rule runs during lint.

Rationale: repo standard; avoids retrofit cost.

## Risks / Trade-offs

- **[Instance data, no workspace isolation]** → The view surfaces instance-
  level ingestion state. Acceptable for read-only internal operator use; a
  later change can add scoping/permissions. Documented in proposal Notes.
- **[Large `raw_api_payload` reads]** → Job-run and call-log queries use
  `limit/offset` with indexed `ingestion_job_id`/`started_at`/`fetched_at`
  ordering; no unbounded scans. If hot, add alater index/gold materialization.
- **[Wireframe-vs-build drift]** → ASCII wireframes in this file are the
  contract; implementation review compares rendered UI against them.

## Wireframes

ASCII wireframes per tab. Tokens follow twenty-ui: `PageCardLayout` +
`PageHeader` (Icon + title + action slot) and `SettingsTabBar` (URL-hash
tabs). Status badges use `Tag`/`TagColor`.

### Page shell (shared)

```
+--------------------------------------------------------------------------+
| [IconWorld]  Mercado Público                          [refresh] [filter]  |
| [ Licitaciones ][ Compra Ágil ][ Centro de Control ]  <- SettingsTabBar   |
+--------------------------------------------------------------------------+
|                                                                          |
|  < active tab content >                                                  |
|                                                                          |
+--------------------------------------------------------------------------+
   MainNavigationDrawer (LINK "Mercado Público" selected)
```

### Tab 1 — Licitaciones

```
+--------------------------------------------------------------------------+
| Filtros: estado [todos v]  organismo [todos v]  publicada [desde|hasta]  |
|          buscar [______]                              [Limpiar] [Aplicar] |
+--------------------------------------------------------------------------+
| Código externo | Estado | Nombre             | Organismo | Publ. | Cierra |
|---------------|--------|--------------------|-----------|-------|--------|
| ML1-23-...    | [pub]  | Suministro de...    | SSS       | 12-01 | 01-15  |
| ML1-23-...    | [cerr] | Arriendo de...      | MINSAL    | 11-20 | 12-20  |
| ... (limit/offset + hasMore, [Cargar más])                               |
+--------------------------------------------------------------------------+
   Estado badge colors: publicada=green cerrada=gray adjudicada=blue
                        desierta=red suspendida=amber revocada=red
   Row click -> detail side panel (below).
```

### Process detail (side panel)

```
                                      +----------------------------------+
                                      | ML1-23-...            [x close]  |
                                      | Suministro de material médico    |
                                      +----------------------------------+
                                      | Estado     [publicada]           |
                                      | Organismo  Servicio de Salud ... |
                                      | Publicada  2024-12-01            |
                                      | Cierra     2025-01-15            |
                                      | Código tipo  LP                 |
                                      +----------------------------------+
                                      | Items                           |
                                      |  - codigoitem / descripción      |
                                      +----------------------------------+
                                      | Adjudicaciones                  |
                                      |  - rut / monto / fecha           |
                                      +----------------------------------+
                                      | Órdenes de compra relacionadas  |
                                      |  - codigo / monto_total          |
                                      +----------------------------------+
                                      | Reconciliación                  |
                                      |  match_type | confidence | review |
                                      +----------------------------------+
```

### Tab 2 — Compra Ágil

```
+--------------------------------------------------------------------------+
| Filtros: estado [todos v]  región [todas v]  publicado [desde|hasta]    |
|          buscar [______]                              [Limpiar] [Aplicar] |
+--------------------------------------------------------------------------+
| Código | Estado           | OC vinculada | Región | Publ.   | Últ. cambio |
|--------|------------------|--------------|--------|--------|-------------|
| CA-... | [proveedor_sel]  | OC-1234      | RM     | 12-01  | 12-10       |
| CA-... | [publicada]      | —            | V      | 12-05  | 12-05       |
| ... (limit/offset + hasMore)                                            |
+--------------------------------------------------------------------------+
   Estado colors: publicada=green cerrada=gray desierta=red cancelada=red
                  proveedor_seleccionado=blue oc_emitida=purple
   Row click -> detail side panel (compra ágil shape: productos solicitados,
   cotizaciones con monto_cotizado, OC vinculada).
```

### Tab 3 — Centro de Control

```
+--------------------------------------------------------------------------+
| Salud del pipeline                                                        |
| +----------------+ +----------------+ +----------------+ +-------------+ |
| | Última ejecución| | Estado jobs(7d)| | Retraso         | | Failures 7d| |
| | api-v2 ... 03:12| | 42 ok / 3 fail | | 2h atrás         | | 3          | |
| +----------------+ +----------------+ +----------------+ +-------------+ |
| (Tarjetas por job_name: último éxito, último fallo, lag, conteo fallos)  |
+--------------------------------------------------------------------------+
| Cuota API                                                                 |
| +------------------------+ +------------------------+ +------------------+|
| | api-v1-licitaciones    | | api-v2-compra-agil    | | reset: 00:00 UTC ||
| | 1.234 / 10.000 (12%)   | | 456 / 2.000 (22%)      | | last 429: 11-30  ||
| | [====..............]   | | [=====..............]  | +------------------+|
| +------------------------+ +------------------------+                     |
+--------------------------------------------------------------------------+
| Ejecuciones de jobs (mp.stg_job_run)          [estado v][job v][buscar] |
| +---------------------------------------------------------------------+ |
| | job_name | status | started | finished | fetched | staged | canon |err| |
| |---------|--------|---------|----------|---------|--------|-------|---| |
| | v2-list  |[succ]  | 03:10   | 03:12    | 120     | 120    | 120   | - | |
| | csv-oc   |[fail]  | 03:00   | 03:05    | 0       | 0      | 0     |!! | |
| | csv-lic  |[skip]  | 03:00   | 03:00    | 0       | 0      | 0     | - | |
| | ... [Cargar más]   row expand -> error_summary + raw_csv_file link    | |
| +---------------------------------------------------------------------+ |
| status: success=green failed=red retryable_failed=amber                 |
|         soft_miss=gray param_error=amber skipped=blue                   |
+--------------------------------------------------------------------------+
| Llamadas a la API (mp.raw_api_payload)        [source v][endpoint v]    |
| +---------------------------------------------------------------------+ |
| | source          | endpoint          | http | fetched | fetched_at    | |
| |-----------------|-------------------|------|--------|---------------| |
| | api-v2-compra.. | list              | 200  | 120    | 03:11         | |
| | api-v1-licitac.. | detail-by-codigo | 404  | 0      | 03:09         | |
| | ... row expand -> request_params + error_summary + ingestion_job link | |
| +---------------------------------------------------------------------+ |
| http<400=green 4xx=amber 5xx=red                                        |
+--------------------------------------------------------------------------+
| Salud archivos CSV                                                        |
| +---------------------------------------------------------------------+ |
| | source_dataset | file | rows | encoding | delim | parse ok | freshness| |
| | oc             | ...  | 12k  | latin1  | ;     | 99.9%    | ok       | |
| | licitaciones   | ...  | 48k  | latin1  | ;     | 100%     | ok       | |
| +---------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

## Verification Strategy

- Resolver fail-first: integration tests at `/graphql` seeding `mp.*` fixtures
  assert list filters/pagination, detail, job-run list, API call log, health
  cards, quota, and CSV file health before the front-end consumes them.
- Front-end: jest per hook/component (list filter state, pagination,
  expandable row, badge color mapping, empty/loading/error states).
- Manual: walkthrough each tab and detail panel against the wireframes; confirm
  nav item appears and route loads under `MainAppLayoutWithSidePanel`.
- Lint/typecheck: `npx nx lint:diff-with-main twenty-server`,
  `npx nx lint:diff-with-main twenty-front`, `npx nx typecheck twenty-server`,
  `npx nx typecheck twenty-front`.