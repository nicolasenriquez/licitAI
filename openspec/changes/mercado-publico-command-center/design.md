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
upstream API calls. The design uses established front-end patterns (tabbed
page, data-driven nav, BullMQ queue-jobs monitoring table).

The retained provider evidence now establishes that Compra Ágil is not a
source-availability or presentation-only problem: V2 list records contain the
values needed by the browse view, but the current persistence and gold
materialization paths discard them. This change therefore also owns the
smallest source-to-read repair needed for truthful browse results, while
preserving the command center as a read-only UI.

## Goals / Non-Goals

**Goals**

- Expose the existing backend read services through a code-first GraphQL
  resolver on core `/graphql`.
- Render a top-level, full-width, tabbed command center following the design
  system and the queue-jobs monitoring precedent.
- Show process list with filters, process detail side panel, ingestion job-run
  log, upstream API call log, pipeline health, API quota usage, and CSV file
  health.
- Preserve only the V2 Compra Ágil fields needed by the compact browse table
  (title, buyer name, state, publication, and closing) through staging,
  canonical, gold, and the typed read contract; repair retained raw evidence
  idempotently.
- Render all other currently observed V2 list fields in the existing detail
  panel through a server-side typed projection of the latest retained raw
  record, not a browser raw-JSON viewer or a provider call.
- Discover every provider-declared V2 list page up to
  `MP_COMPRA_AGIL_MAX_PAGES=250`, retaining page-level evidence and reporting
  partial completion if the cap is reached.

**Non-Goals**

- Ingestion triggers, scheduling, retry/delete mutations, public controls for
  paging/backfill/migration, per-workspace projection of `mp.*`, and a change
  to the command center's read-only interaction boundary.
- An authoritative buyer-reference join, V1 Licitaciones normalization, or a
  bulk detail-hydration policy.

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

Rationale: reuses tested services; one schema-only index migration; no gold-row
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

### Monitoring investigation mirrors `SettingsAdminQueueJobsTable`

The job-run and API-call-log views reuse the shape of the existing BullMQ
queue-jobs table: filter select, status `Tag` badge, expandable row detail,
`limit/offset + hasMore` pagination, `network-only` fetch. A local selector
shows one heavy investigation table at a time; it does not mount both tables
simultaneously.

Rationale: proven interaction shape, design tokens, and a11y already exist.

Alternatives considered:
- Build a bespoke table — rejected: reinvents existing primitives.

### I18n from day one

All user-visible strings use Lingui macros; the oxlint
`lingui/no-unlocalized-strings` rule runs during lint.

Rationale: repo standard; avoids retrofit cost.

### Provider-to-read remediation is explicit and provenance-preserving

The V2 Compra Ágil provider is the authority for the fields observed in its
list record. The browse model persists only the values needed by the existing
six-column composition. The remaining observed fields stay in retained raw
evidence and are mapped server-side into a typed detail object when a user
opens the existing panel. The browser MUST NOT receive `raw_api_payload`, and
opening detail MUST NOT issue a provider request.

| Provider field | Browse persistence | Read meaning |
| --- | --- | --- |
| `nombre` | `title` | Process object/title |
| `institucion.organismo_comprador` | `buyer_name` | Buyer/organism display name |
| `estado.codigo`, `estado.glosa` | normalized state | Textual state in browse; source values in detail |
| `fechas.fecha_publicacion`, `fecha_cierre` | normalized timestamp fields | Browse/detail dates |
| all other observed V2 fields | retained raw evidence only | Typed detail-panel projection |

`institucion.rut` remains a technical buyer RUT in detail and MUST NOT be
treated as a V1-style `buyer_code`. `links.detalle` remains a non-clickable
technical reference; documents expose their observed ID and name only. Future
provider fields remain raw evidence until an explicit contract change adds
them.

The registered V2 date command is a deployment precondition and MUST be run
through the supported instance-command upgrade workflow before a new V2
ingestion run. New browse fields require a separate immutable instance command
with both `up` and `down`. Retained raw payloads are then reprocessed
idempotently: a backfill may fill missing normalized values but MUST NOT
replace a non-null canonical value with null.

Gold materialization reads explicit canonical fields; it MUST NOT hard-code
`NULL` for values now represented in the Compra Ágil canonical row. The
resolver maps the latest retained raw record for the code into the typed detail
object, choosing the greatest `fecha_ultimo_cambio` and falling back to the
greatest `fetched_at`. The UI continues to render only typed read data.

Alternatives considered:
- A buyer-reference join for V2 institutions — rejected: the provider already
  sends the display name; an extra local reference table is not needed to
  render it and would create an unproven authority dependency.
- A UI-side raw-JSON viewer — rejected: it leaks storage shape and would make
  every provider change a presentation change.
- Persisting every detail-only field in canonical tables — rejected: the raw
  evidence already exists, and the existing panel is the only consumer.

### Bounded V2 pagination is an ingestion concern, not a UI control

The V2 list runner MUST request pages sequentially from page one through the
provider-declared end, subject to `MP_COMPRA_AGIL_MAX_PAGES=250`, retain one
raw request/response evidence record per page, and record whether it reached
the provider end or stopped at the cap. The CLI remains the only ingestion
entry point. Deployment documentation defines a daily operator run; it does
not add a scheduler.

## Risks / Trade-offs

- **[Instance data, no workspace isolation]** → The view surfaces instance-
  level ingestion state. Acceptable for read-only internal operator use; a
  later change can add scoping/permissions. Documented in proposal Notes.
- **[Large `raw_api_payload` reads]** → Job-run and call-log queries use
  `limit/offset` with indexed `ingestion_job_id`/`started_at`/`fetched_at`
  ordering; no unbounded scans. Indexes are created by the fast instance
  migration; Compra Ágil gold changes remain limited to the explicit provider
  fields mapped above.
- **[Provider page count exceeds 250]** → The ingestion job records partial
  completion separately from reaching the provider-declared end; the UI must
  not translate a capped run into a completeness claim.
- **[Schema deployment drift]** → The existing date command is an operational
  prerequisite and new fields require a new immutable command. Ingestion and
  backfill do not run until the intended environment satisfies that precondition.
- **[Wireframe-vs-build drift]** → ASCII wireframes in this file are the
  contract; implementation review compares rendered UI against them.

## Existing Data Contract

The view MUST render only fields supplied by the read DTOs, the explicit V2
provider-to-read extension above, or the two planned monitoring list queries.
It MUST NOT imply unavailable search, region filtering, adjudication-date,
percentage-confidence, or manual approval data. Observed provider monetary
fields are detail-only values, not derived totals or purchase-order amounts.

| Surface | Existing source | Binding fields and paging |
| --- | --- | --- |
| Process list | `MercadoPublicoDetectedProcessReadService` | Process identity/title/state, buyer code/name, published/closing dates, source priority, reconciliation status, `lastSeenAt`; filters `processTypes`, `states`, exact `buyerCode`, publication range, `changedSince`, sort; `page`, `limit`, `total` |
| Process detail | `MercadoPublicoProcessDetailReadService` plus typed retained-raw adapter | Existing process detail plus current V2 source details (additional dates, amounts, reasons, offers, document ID/name pairs, institution, convocatoria, non-clickable source path); no provider call |
| Pipeline health | `MercadoPublicoPipelineHealthReadService` | Per-job latest status, last success/failure, lag, failure count, freshness, expected cadence |
| API quota | `MercadoPublicoApiQuotaUsageReadService` | Per-source daily limit, used, remaining, reset, last 429 |
| CSV health | `MercadoPublicoCsvFileHealthReadService` | Dataset/modality/period/file, encoding/delimiter/fingerprint, row and parse counts/status, last load, optional freshness |
| Job runs | New bounded read query | Status/job filters, counters, timestamps, `error_summary`, optional raw CSV link; `limit`, `offset`, `hasMore` |
| API calls | New bounded read query | Source/endpoint/http-status filters, request params, records, timestamps, error, job link; `limit`, `offset`, `hasMore` |

Consequences:

- **Código de organismo** is an exact `buyerCode` input, not a fabricated
  organism option catalogue.
- No free-text process search or Compra Ágil region filter exists in this
  change. Adding either requires a later read-contract change.
- Browse lists use `page`/`limit`/`total`; monitoring logs use
  `limit`/`offset`/`hasMore`.
- Related OCs show code, canonical state, match type, and confidence category.
  They do not show an amount because the detail DTO does not supply one.
- Reconciliation shows summary counts and categorical evidence, never an
  invented percentage or approval state.

## Visual and Interaction Contract

- Register: product UI. Visual strategy: restrained and token-driven.
- Reuse `PageCardLayout`, `PageHeader`, `SettingsTabBar`, table primitives,
  `Tag`, `AnimatedPlaceholder`, `SettingsSkeletonLoader`, `InlineBanner`,
  and the existing side-panel shell. Do not create parallel primitives.
- Reference desktop viewport: 1440 x 900. Navigation drawer default width is
  220 px, user-resizable from 180 to 350 px; designs MUST not assume a fixed
  drawer width. Desktop detail width uses `--t-side-panel-width` (500 px).
- `PageCardLayout` owns the white content surface and 16 px top-left radius.
  Do not wrap every dashboard section in another card or create nested cards.
- Header has `IconWorld` and localized title. First version has no run, retry,
  delete, scheduling, or other write action.
- Tabs are URL-hash backed. Canonical entry and drawer destination are
  `/mercado-publico#compra-agil`; missing/unknown hashes are replaced with
  `compra-agil`. Hash changes preserve the current page without full reload.
- Filter state is local to each browse-tab instance and survives tab switches
  and detail-panel open/close: applied filters, page, selected row, and scroll
  position are not shared across Compra Ágil and Licitaciones. `Limpiar
  filtros` appears only when at least one filter is active.
- Browse controls show state, publication range, and sort first. Exact buyer
  code and changed-since live under `Más filtros`; active-filter chips reflect
  applied values, not unsubmitted drafts. Every filter application resets only
  that tab to page 1.
- Browse table hierarchy is title/object, buyer, textual state, closing date,
  publication date, process code. Closing is primary; a missing value says
  `Cierre no informado`. Tablet hides code and publication before primary
  columns, while mobile uses a compact representation that keeps object, state,
  and closing date visible.
- Row selection is keyboard reachable. `Enter`/`Space` opens detail; close
  restores focus to the originating row. `Escape` closes the modal panel; the
  panel owns internal scroll and background content is not keyboard reachable.
- The sticky detail header contains title, code, textual status, and an
  accessible close control. Detail order is identity, buyer, browse dates,
  typed **Datos de Compra Ágil** from retained evidence (additional dates,
  amounts, offers, reasons, documents, institution, convocatoria, and source
  path), items, adjudications, related OCs, reconciliation, sources, and a
  collapsed technical-information disclosure. The source path is text, not an
  external link; documents show ID and name only.
- Color never carries status alone: every status uses localized text plus a
  `Tag`. Unknown or null status renders `No informado` with neutral styling.
- Dates, times, counts, and CLP amounts use workspace locale/timezone. Raw API
  identifiers remain only in secondary technical detail.
- Motion is limited to existing drawer/panel/tab state transitions and respects
  `prefers-reduced-motion`. No decorative page-load choreography.

## Status Presentation

| Domain value | Spanish label | `TagColor` intent |
| --- | --- | --- |
| `success` | Correcta | green |
| `failed` | Fallida | red |
| `retryable_failed` | Reintentable | yellow/amber |
| `param_error` | Parámetros inválidos | yellow/amber |
| `soft_miss` | Sin resultados | gray |
| `skipped` | Omitida | blue |
| HTTP 200-399 | Correcta | green |
| HTTP 400-499 | Error de solicitud | yellow/amber |
| HTTP 500-599 | Error del proveedor | red |
| null/unknown | No informado | gray |

Process states keep their source label when present. Known canonical states map
as follows: `publicada=green`, `cerrada=gray`, `adjudicada=blue`,
`desierta=red`, `suspendida=yellow/amber`, `revocada=red`,
`cancelada=red`, `proveedor_seleccionado=blue`, `oc_emitida=purple`.


## Wireframes

Values below are illustrative fixtures, never production metrics. Dimensions
are reference values; implementation uses existing tokens.

### Frame 1 — Home before navigation

```text
┌─ navigation drawer, 220 px default / resizable ─┬─ RecordIndexPage ──────┐
│ licitAI                                         │ PageHeader: Companies  │
│ Search                                          │ TopBar / view controls │
│                                                 │                        │
│ Workspace                                       │ Record table           │
│   People                                        │                        │
│   Companies  ← current                          │                        │
│   Opportunities                                 │                        │
│   Tasks                                         │                        │
│   Notes                                         │                        │
│   Workflows                                     │                        │
│   🌐 Mercado Público  ← LINK entry              │                        │
│ Other                                           │                        │
│   Settings                                      │                        │
│   Ayuda                                         │                        │
└─────────────────────────────────────────────────┴────────────────────────┘
```

Acceptance focus: new entry joins the existing data-driven workspace list. It
does not replace the home route or add a hardcoded row to “Other”.

### Frame 2 — Navigation selected

```text
┌─ navigation drawer ─────────────────────────────┐
│ Workspace                                      │
│   …                                            │
│   🌐 Mercado Público                 SELECTED  │
│      28 px item, existing selected background  │
└────────────────────────────────────────────────┘
                         → /mercado-publico#compra-agil
```

Acceptance focus: route match supplies selected state; label and icon are not
duplicated in page-local navigation.

### Frame 3 — Compra Ágil browse view

```text
┌─ PageCardLayout, white surface / shell remains gray ─────────────────────┐
│ [🌐] Mercado Público                                      PageHeader     │
├─────────────────────────────────────────────────────────────────────────┤
│  Compra Ágil   Licitaciones   Centro de Control           URL-hash tabs │
│  ━━━━━━━━━━━                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ Estado [Todos ▾]  Publicada [Desde] [Hasta]  Orden [Cierre ▾]           │
│ [Más filtros ▾]   [Estado: Publicada ×]          [Limpiar filtros]      │
├─────────────────────────────────────────────────────────────────────────┤
│ Objeto       Organismo    Estado       Cierre       Publicada  Código   │
│ Insumos…     MINSAL       [Publicada]  15 ene 17:00 01 dic    CA-123    │
│ Arriendo…    SSS          [Cerrada]    Cierre no informado   CA-124    │
│                                                                         │
│             1–25 de 847                [Anterior] Página 1 [Siguiente]   │
└─────────────────────────────────────────────────────────────────────────┘
```

Acceptance focus:

- list fixed to process type `compra_agil`
- filters map one-to-one to existing service inputs
- title truncates with accessible full-text tooltip
- pagination uses `page`/`limit`/`total`
- selected row opens Frame 4

Licitaciones reuses this list with process type `licitacion` and its known
state values. Neither tab adds unsupported region, free-text, or related-OC
columns.

### Frame 4 — Browse view with process detail

```text
┌─ browse content shrinks, selection remains visible ─────┬─ 500 px panel ─┐
│ [🌐] Mercado Público                                    │ [×] ML1-23-LP24│
│ Compra Ágil | Licitaciones | Centro de Control          │ Suministro de… │
│                                                        ├────────────────┤
│ Estado [Todos ▾]  Publicada [Desde] [Hasta]            │ CA-123 [Publicada]│
│                                                        │ Comprador: MINSAL│
│ Insumos… [Publicada] Cierra 15 ene ← selected           │ Fechas          │
│ Arriendo… [Cerrada] Cierre no informado                 │ 01 dic → 15 ene│
│                                                        │ Ítems (3)      │
│                                                        │ código, nombre │
│                                                        │ cantidad, monto│
│                                                        ├────────────────┤
│                                                        │ Adjudicaciones │
│                                                        │ proveedor, cant│
│                                                        │ monto          │
│                                                        ├────────────────┤
│                                                        │ OC relacionadas│
│                                                        │ código, estado │
│                                                        │ match, confianza│
│                                                        ├────────────────┤
│                                                        │ Reconciliación │
│                                                        │ exactas 1      │
│                                                        │ candidatas 0   │
│                                                        │ sin match 0    │
│                                                        │ revisión 0     │
│                                                        ├────────────────┤
│                                                        │ Fuentes        │
│                                                        │ fuente, filas, │
│                                                        │ última vista   │
│                                                        │ [Información técnica ▸]│
└────────────────────────────────────────────────────────┴────────────────┘
```

Acceptance focus: null/empty subsections say `Sin información`; they do not
disappear silently. Panel never invents OC amount, award date, percentage
confidence, or approval state. On mobile existing side-panel behavior occupies
the viewport and returns focus/context on close.

### Frame 5 — Centro de Control

```text
┌─ PageCardLayout ─────────────────────────────────────────────────────────┐
│ [🌐] Mercado Público                                                    │
│ Compra Ágil   Licitaciones   Centro de Control                          │
│                                 ━━━━━━━━━━━━━━━━━                        │
├─ Salud del pipeline, compact health matrix ─────────────────────────────┤
│ Job                            Estado       Últ. éxito  Últ. fallo  Lag  │
│ api-v2-compra-agil-incremental [Correcta]   03:12       —           2 h  │
│ csv-oc-download                [Fallida]    ayer        03:05       1 d  │
│ csv-licitaciones-download      [Omitida]    —           —           —    │
├─ Cuota API ──────────────────────────────────────────────────────────────┤
│ api-v1-licitaciones  1.234 / 10.000  [████░░░░░░]  reset 00:00          │
│ api-v2-compra-agil     456 /  2.000  [██░░░░░░░░]  último 429: 03:11    │
├─ Investigación: [Ejecuciones] [Llamadas API] ───────────────────────────┤
│ Estado [Todos ▾] Job [Todos ▾]                                          │
│ Job                     Estado       Inicio  Fin    Obten. Canon. Error  │
│ v2-compra-agil-list     [Correcta]   03:10   03:12  120    120    0     │
│ csv-ordenes-compra      [Fallida]    03:00   03:05    0      0    1     │
│   expanded → resumen del error + vínculo de archivo CSV, si existe      │
│                         [Anterior]  Página 1  [Siguiente]                  │
│ (Al elegir Llamadas API, esta tabla se sustituye — no se monta a la vez.)│
├─ Integridad de fuentes: Salud de archivos CSV ───────────────────────────┤
│ Dataset       Archivo       Filas  Parse correcto  Carga       Frescura │
│ oc            oc_junio.csv  12,4k  99,92 %         hoy 03:00  No config.│
│ licitaciones  lic_julio.csv 48,1k  100 %           hoy 03:01  No config.│
└─────────────────────────────────────────────────────────────────────────┘
```

Acceptance focus:

- one continuous monitoring surface, not nested identical card grids
- Diagnóstico, Investigación e Integridad de fuentes ordenan la lectura; el
  selector de Investigación mantiene una sola tabla pesada visible
- sections load and fail independently
- request parameters redact ticket, authorization, cookie, token, password,
  secret, and equivalent keys before rendering
- percentages derive from actual counts
- missing cadence/quota config renders `No disponible`, never synthetic data

### Frame 6 — Loading, empty, no-results, and error

```text
┌─ initial loading ─────────────────────┬─ first-run empty ────────────────┐
│ Header and tabs remain stable         │ [AnimatedPlaceholder]           │
│ [skeleton filters]                    │ Sin ejecuciones registradas     │
│ [skeleton row]                        │ Los datos aparecerán después de │
│ [skeleton row]                        │ la primera ingesta por CLI.     │
│ [skeleton row]                        │ [Consultar documentación]       │
└───────────────────────────────────────┴─────────────────────────────────┘

┌─ filtered no-results ─────────────────┬─ section error ─────────────────┐
│ Sin resultados para estos filtros     │ No pudimos cargar llamadas API  │
│ [Limpiar filtros]                     │ [Reintentar]                    │
│ Existing content in other tabs stays  │ Other dashboard sections stay  │
└───────────────────────────────────────┴─────────────────────────────────┘
```

State rules:

- skeleton geometry mirrors replaced content; no centered spinner
- first-run empty, filtered no-results, missing optional data, and transport
  error use distinct localized copy/actions
- refetch keeps previous data visible and marks only affected section busy
- error/loading updates use appropriate live-region semantics without
  announcing every skeleton row

### Frames 7–12 — Progressive disclosure and responsive states

```text
7. More filters (desktop)
Estado [Publicada ▾] Publicada [Desde] [Hasta] Orden [Cierre ▾]
[Más filtros ▴]
  Código exacto de organismo [____________]
  Último cambio desde        [____________]       [Aplicar]

8. Filtered no-results (desktop/tablet)
[Estado: Cerrada ×] [Organismo: 1234 ×] [Limpiar filtros]
                 No encontramos resultados con estos filtros.
                              [Limpiar filtros]

9. Detail technical disclosure (side panel)
Identidad / Comprador / Fechas / Ítems
Adjudicaciones                         Sin información
Órdenes de compra relacionadas / Conciliación / Fuentes
[Información técnica ▸] prioridad · última observación · evidencia

10. Investigation: API calls, partial refetch error
INVESTIGACIÓN  [Ejecuciones] [Llamadas API]
Fuente [Todas] Endpoint [Todos] HTTP [Todos]
! No pudimos actualizar esta sección. [Reintentar]
Datos anteriores visibles; parámetros redactados en el detalle expandido.

11. Tablet
[Compra Ágil] [Licitaciones] [Centro]
Estado [Todas] Publicada [Desde] [Hasta] [Filtros 1]
Objeto                         Estado        Cierre
Insumos hospitalarios          Publicada     Hoy 17:00

12. Mobile list and full-screen detail
Mercado Público                 Compra de insumos          [Cerrar]
Compra Ágil | Licitaciones      CA-123 · Publicada
[Filtros 2] [Cierre]           Comprador: Hospital X
Insumos clínicos                Cierre: Hoy, 17:00
Hospital X · Publicada          Ítems … [Información técnica ▸]
```

The responsive frames are contract examples, not visual-compliance evidence.
Tablet hides code, publication, then technical columns before primary browse
data. Mobile uses stacked filters or a full-screen disclosure, horizontally
reachable tabs, a full-screen detail panel with sticky close action, and no
viewport-level horizontal overflow.

## State and Accessibility Matrix

| State | Presentation and localized action |
| --- | --- |
| Initial loading | Geometry-matched skeleton; do not repeatedly announce rows. |
| Background refetch | Keep prior data visible and identify only the affected section as updating. |
| First ingestion | `Aún no hay datos. Aparecerán después de la primera ingesta por CLI.` plus documentation link. |
| Filtered no-results | `No encontramos resultados con estos filtros.` plus `Limpiar filtros`. |
| Optional absence | Neutral value or subsection: `Sin información`. |
| Partial error | Section-local `InlineBanner` with `Reintentar`; other sections remain usable. |
| Total error | Content-level retry banner while shell and tabs stay stable. |
| Stale data | Informational banner with last update; retain the data. |
| Unknown state | Neutral `Tag` with `No informado`. |
| Missing configuration | `No configurado` or `No disponible`; never synthesize a score or percentage. |

Accessibility requirements are implementation and test obligations: one `h1`;
named selected tabs; visible focus; semantically actionable rows; Enter/Space
open; Escape closes; focus returns to the activating row; text accompanies
color; decorative icons are hidden from assistive technology; date ranges have
complete labels; `Más filtros` exposes `aria-expanded`; and reduced motion,
keyboard traversal, reflow, screen-reader behavior, and 200% zoom require
real verification. These wireframes do not claim WCAG conformance.

## Responsive Behavior

- **Desktop (> 1024 px):** full column set, resizable drawer, 500 px detail
  panel, dashboard uses full content width.
- **Tablet (769–1024 px):** drawer may collapse; tables horizontally scroll
  inside their section; secondary columns hide before identity/status.
- **Mobile (≤ `MOBILE_VIEWPORT`):** existing full-width drawer; stacked
  filters; horizontally scrollable tabs; process rows become compact list;
  detail uses existing full-viewport side-panel behavior. No viewport-level
  horizontal overflow.
- At 200% zoom, controls remain reachable and status meaning remains visible.


## Verification Strategy

- Resolver fail-first: integration tests at `/graphql` seeding `mp.*` fixtures
  assert list filters/pagination, detail, job-run list, API call log, health
  cards, quota, and CSV file health before the front-end consumes them.
- Front-end: jest per hook/component (exact contract-backed filters, browse
  page pagination, monitoring previous/next pagination, expandable row, badge mapping,
  redaction, focus restoration, and all state variants).
- Manual: Frames 1–6 at desktop/tablet/mobile, keyboard-only, 200% zoom, and
  reduced motion; confirm nav/hash/route, focus return, and partial errors.
- Lint/typecheck: `npx nx lint:diff-with-main twenty-server`,
  `npx nx lint:diff-with-main twenty-front`, `npx nx typecheck twenty-server`,
  `npx nx typecheck twenty-front`.
- Source-to-read: a real-shaped V2 fixture proves title, buyer name, state,
  publication, and closing from raw evidence through canonical/gold to browse
  GraphQL; another proves the latest retained raw record maps to typed detail
  fields without a browser raw payload or provider call. A pagination fixture
  proves every declared page up to 250 is retained and a capped run is marked
  partial; retained-payload backfill never replaces a non-null canonical field
  with null.
- Operational: verify the registered date command is applied via the supported
  upgrade workflow before V2 ingestion/backfill, then record the applied
  version and job evidence. Do not exercise that write path as part of this
  documentation-only alignment.
