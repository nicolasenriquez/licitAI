---
type: change-spec
title: "Spec: mercado-publico-command-center"
description: "Specification for the Mercado Publico command center and complete Compra Agil V2 read view."
okf_version: "0.1"
---
# Spec: mercado-publico-command-center

## Implementation Readiness Contract

This spec is the normative behavior contract for the first release. The
wireframes in `../../design.md` illustrate this contract but MUST NOT widen the
DTO, GraphQL, navigation, or write boundaries defined here. When fixture text
or a wireframe conflicts with a requirement or scenario, this file wins.

The first release is an additive, read-only product surface plus the minimal
backend source-to-read remediation required to make its browse values truthful.
It MUST reuse Twenty navigation, page, tab, table, tag, banner, skeleton,
empty-state, and side-panel patterns before introducing local UI. It MUST NOT
add a dependency, parallel design system, nested card dashboard, global state
for page-local behavior, a mutation path, or an in-product control for
ingestion, migration, backfill, paging, or scheduling.

## ADDED Requirements

### Requirement: Preserve the minimal V2 Compra Ágil browse contract

The system MUST preserve `nombre`, `institucion.organismo_comprador`, nested
state, `fechas.fecha_publicacion`, and `fechas.fecha_cierre` from V2 provider
evidence through staging, canonical, Compra Ágil gold materialization, and the
typed browse GraphQL contract. Compra Ágil gold materialization MUST NOT
hard-code `NULL` for one of those represented values.

#### Scenario: Browse fields reach GraphQL
- **WHEN** a retained or newly fetched V2 list record contains title, buyer
  name, nested state, publication, and closing values
- **THEN** the corresponding non-null normalized values survive raw evidence,
  staging, canonical, and gold materialization into the detected-process list
- **AND** a backfill never replaces a non-null canonical value with null

#### Scenario: Schema recovery is safe
- **WHEN** the V2 browse persistence schema is extended
- **THEN** the existing registered date command is applied through the
  supported instance-command workflow before a new V2 ingestion run
- **AND** new browse fields are added through a separate immutable instance
  command with both `up` and `down`

### Requirement: Expose typed current V2 fields through process detail

The Compra Ágil process-detail query MUST map the latest retained raw list
record for the requested code into a typed detail object. It MUST expose the
currently observed V2 fields not needed by browse: source state code/label/ID,
additional dates, source monetary values, reasons, offer count, document ID/
name pairs, institution fields, convocatoria, and the relative source-detail
path. The browser MUST NOT receive `raw_api_payload`, and opening detail MUST
NOT call the provider.

The latest retained record is the one with greatest `fecha_ultimo_cambio`; if
that value is absent or tied, the system MUST use greatest `fetched_at`.
`institucion.rut` remains a detail-only buyer RUT and MUST NOT be stored or
exposed as a V1-style `buyer_code`. `links.detalle` is a non-clickable text
reference, and documents expose only their observed ID and name. Provider
fields introduced after this contract remain raw evidence until a later change
explicitly types them.

#### Scenario: Detail uses retained evidence
- **WHEN** a user opens a Compra Ágil process detail and a retained list record
  exists for that code
- **THEN** GraphQL returns the typed current V2 detail object selected by the
  documented recency rule
- **AND** the provider is not called and raw JSON is not returned to the
  browser

#### Scenario: Detail-only null values
- **WHEN** an observed detail-only provider field is null or absent
- **THEN** the typed field is null and the UI renders `No informado`
- **AND** the system does not synthesize a replacement value

### Requirement: Discover all declared V2 Compra Ágil pages within the cap

The V2 Compra Ágil list runner MUST request pages sequentially through the
provider-declared final page, subject to
`MP_COMPRA_AGIL_MAX_PAGES=250`. It MUST retain one raw request/response
evidence record per requested page. Ingestion remains CLI-only and deployment
documentation defines a daily operator run; no scheduler, GraphQL operation,
or UI control is added.

#### Scenario: Declared pages are retained
- **WHEN** the provider declares and serves no more than 250 pages
- **THEN** the runner requests every declared page sequentially and retains
  each page's raw evidence and normalized browse records

#### Scenario: Cap-reached run is partial
- **WHEN** the provider declares more than 250 pages
- **THEN** the runner stops after page 250 and job evidence marks the run
  partial rather than provider-complete
- **AND** no health, browse, or job result claims provider-total completeness

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
  from the `MercadoPublicoDetectedProcessReadService`
- **AND** each Compra Ágil item exposes only the compact browse fields defined
  by this specification

#### Scenario: Process detail
- **WHEN** a client queries a process detail by type and code
- **THEN** the resolver returns items, adjudications, related OCs, source
  lineage, and reconciliation summary from the existing
  `MercadoPublicoProcessDetailReadService`
- **AND** a Compra Ágil detail also includes the typed retained-raw detail
  object when evidence exists

#### Scenario: No write surface
- **WHEN** a client attempts any mutation on Mercado Público
- **THEN** no Mercado Público mutation is offered and no ingestion is
  triggered

### Requirement: Expose ingestion job-run and API call log monitoring

The system MUST expose paginated, read-only queries over `mp.stg_job_run` and
`mp.raw_api_payload` computing live (without writing gold rows), with the
documented status union and indexed `limit/offset` ordering. Required read
indexes MUST be installed by a fast instance migration.

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
- **AND** sensitive keys equivalent to ticket, authorization, cookie, token,
  password, or secret are matched case-insensitively at every nested object or
  array level and masked before the GraphQL response leaves the server boundary
- **AND** the browser never receives an unredacted value for those keys

#### Scenario: Bounded reads
- **WHEN** either monitoring query runs
- **THEN** it uses `limit/offset` ordered by indexed
  `ingestion_job_id`/`started_at`/`fetched_at` and performs no unbounded scan
  or gold-row write

### Requirement: Render a top-level tabbed command center

The system MUST render a `/mercado-publico` top-level page inside
`MainAppLayoutWithSidePanel` with `PageCardLayout`, a `PageHeader`, and
URL-hash tabs **Compra Ágil**, **Licitaciones**, **Centro de Control**, using
the twenty-ui design system and Lingui-localized strings from day one. The
canonical entry and drawer destination MUST be `/mercado-publico#compra-agil`;
missing or unknown hashes MUST be replaced with `compra-agil`.

#### Scenario: Page loads under main layout
- **WHEN** an authenticated user navigates to `/mercado-publico` without a
  valid tab hash
- **THEN** the page loads inside `MainAppLayoutWithSidePanel`, full-width,
  with three tabs and Compra Ágil selected

#### Scenario: Tab state in the URL
- **WHEN** the user switches tabs
- **THEN** the active tab is reflected in the URL hash and survives reload
- **AND** each tab preserves its own applied filters, page, selected row, and
  scroll position without resetting the other tabs

#### Scenario: Canonical hash replacement and browser history
- **WHEN** the route loads with no hash or an unknown hash
- **THEN** the URL is replaced, not appended, with
  `/mercado-publico#compra-agil`
- **AND** the user does not need an extra Back action to leave the module
- **WHEN** browser Back or Forward selects a valid Mercado Público hash
- **THEN** the matching tab becomes active without a full page reload

### Requirement: Browse compra ágil and licitaciones

The primary **Compra Ágil** tab MUST render a detected-process list fixed to
compra ágil. The **Licitaciones** tab MUST reuse the same browse composition,
fixed to licitaciones. Both lists are filtered only by contract-backed fields:
state, exact buyer code, publication range, changed-since, and sort. Browse
pagination MUST use `page`/`limit`/`total`. Compra Ágil supports its estado enum
(`publicada|cerrada|desierta|cancelada|proveedor_seleccionado|oc_emitida`).
This change MUST NOT add partial client-side search or a region filter.
Compra Ágil detail-only V2 fields remain in the existing detail panel, not the
list. Selecting a row MUST open that panel without unmounting or resetting the
list.

Visible controls MUST be **Estado**, **Publicada desde**, **Publicada hasta**,
and **Orden**. **Más filtros** MUST contain **Código exacto de organismo** and
**Último cambio desde**. The sort control MUST map only to the existing
`lastSeenAt`, `publishedAt`, `closingAt`, `processCode`, and `canonicalState`
keys and `asc|desc` directions. It MUST NOT imply relevance sorting.

For Compra Ágil, the desktop table MUST render **Objeto**, **Organismo**,
**Estado**, **Cierre**, **Publicada**, and **Código**, in that order. All other
currently observed V2 fields are visible only after the user opens the
existing detail side panel; no dense table, row-expansion component, or
raw-JSON viewer is added.

#### Scenario: Compra Ágil filters and pagination
- **WHEN** the user applies state, publication range, or sort from the visible
  controls, or applies exact buyer code or changed-since through `Más filtros`
- **THEN** the list sends those exact inputs plus `page`/`limit` and renders
  the returned `total` through previous/next page controls
- **AND** an applied filter change resets only that tab to page 1
- **AND** removable active-filter chips reflect applied values only, while
  `Limpiar filtros` appears only when at least one filter is active

#### Scenario: Draft and applied filters
- **WHEN** the user edits a value inside `Más filtros`
- **THEN** the value remains a local draft until the user chooses `Aplicar`
- **AND** closing the disclosure without applying does not refetch or change
  the active-filter chips
- **WHEN** the user removes an active-filter chip
- **THEN** only that applied filter is cleared and that tab returns to page 1
- **WHEN** the user chooses `Limpiar filtros`
- **THEN** all applied filters and matching drafts for that tab are cleared,
  the tab returns to page 1, and `lastSeenAt desc` is restored

#### Scenario: Exact buyer-code filter
- **WHEN** the user applies `Código exacto de organismo`
- **THEN** the client sends one trimmed exact `buyerCode` value
- **AND** the control is a text input, not a fabricated organism catalogue or
  partial-name search

#### Scenario: Publication-range validation
- **WHEN** both publication dates are present and the start is after the end
- **THEN** the range is not applied, the invalid fields are identified in text,
  and focus can move to the first invalid field

#### Scenario: Opportunity hierarchy
- **WHEN** a Compra Ágil result is rendered
- **THEN** desktop presentation prioritizes object/title, buyer, textual
  state, closing date, publication date, and process code in that order
- **AND** an absent closing date renders `Cierre no informado`, not an empty
  or ambiguous cell
- **AND** compact tablet/mobile presentation never hides object, state, and
  closing date at the same time and retains access to all other observed V2
  fields through the detail panel
- **AND** `sourcePriority`, reconciliation state, and `lastSeenAt` remain
  secondary technical information rather than competing primary columns

#### Scenario: Long and missing row values
- **WHEN** title or buyer text exceeds available width
- **THEN** the row truncates visually without changing its accessible name and
  exposes the full value through the existing accessible overflow pattern
- **WHEN** title is absent
- **THEN** process code becomes the row's primary identity
- **WHEN** any provider-backed Compra Ágil field is absent or unknown
- **THEN** the corresponding value renders `No informado`

#### Scenario: Row affordance and selection
- **WHEN** a pointer or keyboard user reaches a result
- **THEN** one consistent row affordance exposes an accessible name equivalent
  to `Abrir detalle de <title-or-code>` and visible focus
- **AND** Enter or Space opens the same detail as pointer activation
- **AND** the selected row remains visually identifiable while the panel is open

#### Scenario: Estado badge colors
- **WHEN** licitaciones or compra ágil rows are rendered
- **THEN** statuses map to `TagColor` per the wireframe legend
  (`publicada=green`, `cerrada=gray`, `adjudicada=blue`, `desierta=red`,
  `suspendida=amber`, `revocada=red`; compra ágil:
  `proveedor_seleccionado=blue`, `oc_emitida=purple`, `cancelada=red`)

#### Scenario: Process detail side panel
- **WHEN** the user selects a process row
- **THEN** the side panel renders supplied content in this order: identity and
  textual state; buyer; publication and closing dates; items; adjudications;
  related OC code/state/match evidence; reconciliation counts; source lineage;
  for Compra Ágil, typed **Datos de Compra Ágil** from retained evidence;
  technical source priority and last-seen data
- **AND** null or empty sections say `Sin información` without inventing OC
  amount, award date, percentage confidence, or approval state
- **AND** **Datos de Compra Ágil** renders the observed additional dates,
  source monetary values, reasons, offer count, document ID/name pairs,
  institution values, convocatoria, and non-clickable source-detail path when
  the typed detail object exists
- **AND** the sticky panel header exposes the title, code, textual state, and
  an accessible close control; Escape closes the panel, focus returns to
  the activating row, and the list's filters, page, selection, and scroll
  remain intact

#### Scenario: Detail amounts and technical disclosure
- **WHEN** item or adjudication `amount` exists
- **THEN** it is formatted with the workspace locale and currency convention
  without deriving a process total
- **WHEN** item or adjudication `amount` is null
- **THEN** the field renders `Sin información`
- **AND** related purchase orders never show an amount because the current DTO
  does not supply one
- **WHEN** Compra Ágil retained evidence supplies `montos`
- **THEN** its source currency and values are formatted as source values in
  **Datos de Compra Ágil** without deriving a process total
- **AND** the panel does not provide a document download or clickable external
  source-detail link when the provider did not supply one
- **AND** reconciliation, lineage, source priority, raw source state, and
  last-seen values are grouped under a collapsed `Información técnica`
  disclosure after operational sections

#### Scenario: Detail query failure or missing record
- **WHEN** detail fails while the source list remains available
- **THEN** the panel shows `No pudimos cargar el detalle` with `Reintentar` and
  an accessible close control without replacing the list
- **WHEN** detail resolves without a process
- **THEN** the panel shows `Este proceso ya no está disponible`, allows close,
  and preserves list context

#### Scenario: Record-to-record navigation boundary
- **WHEN** the user wants to inspect another process in the first release
- **THEN** the user closes the panel or activates another visible row from the
  preserved list
- **AND** the first release does not add previous/next record controls or
  prefetch beyond the current result page

### Requirement: Render the Centro de Control monitoring surface

The **Centro de Control** tab MUST render one continuous monitoring surface
with three hierarchic sections: **Diagnóstico** (pipeline health and API quota),
**Investigación** (a selector for job runs or API call logs), and **Integridad
de fuentes** (CSV file health). Only one heavy investigation table MAY be
visible at a time. It MUST reuse the `SettingsAdminQueueJobsTable` interaction
vocabulary without copying its retry, delete, selection, or other write
controls.

#### Scenario: Pipeline health matrix
- **WHEN** the tab loads
- **THEN** compact rows show per `jobName` latest status, last success,
  last failure, failure count, lag, freshness, and expected cadence from
  `PipelineHealthRead`
- **AND** rows needing attention (`failed`, `retryable_failed`, `param_error`,
  degraded, stale, or unknown) appear before healthy rows while retaining
  their textual status
- **AND** the section does not derive a health score or decorative KPI

#### Scenario: Quota diagnosis
- **WHEN** quota entries are available
- **THEN** each source row shows only `dailyLimit`, `used`, `remaining`,
  `resetAt`, and `last429At` values returned by `ApiQuotaUsageRead`
- **AND** any progress representation has an equivalent text value and is
  derived from `used` and `dailyLimit`
- **WHEN** the quota source list is empty
- **THEN** the section renders `No configurado` without assuming a limit

#### Scenario: Job-run log table
- **WHEN** the user selects Ejecuciones and filters by status/job and paginates
- **THEN** the table shows job runs with status badges and expandable row
  detail exposing `error_summary` and the `raw_csv_file` link when present

#### Scenario: API call log table
- **WHEN** the user selects Llamadas API and filters by source/endpoint/http_status
  and loads a bounded page
- **THEN** the table shows `raw_api_payload` rows with HTTP status badges and
  expandable detail exposing redacted `request_params` and `error_summary`
- **AND** keys equivalent to ticket, authorization, cookie, token, password, or
  secret are already masked by the GraphQL boundary before rendering

#### Scenario: Independent investigation views
- **WHEN** the user switches between `Ejecuciones` and `Llamadas API`
- **THEN** only the selected heavy table is mounted and queried
- **AND** each view preserves its own filters and bounded pagination while the
  user remains in Centro de Control

#### Scenario: CSV source integrity
- **WHEN** CSV health entries are available
- **THEN** rows prioritize dataset, source file, parse status, error count, row
  count, last load, and freshness supplied by `CsvFileHealthRead`
- **AND** encoding, delimiter, checksum, and schema fingerprint remain in an
  expandable technical disclosure
- **WHEN** freshness is null because cadence is not configured
- **THEN** the row renders `No configurado`, not a synthetic health state

### Requirement: Provide loading, empty, and error states

Every tab, dashboard section, and detail panel MUST distinguish initial
loading, background refetch, first-run empty, filtered no-results, missing
optional data, partial query error, total query error, stale data, unknown
state, and unavailable configuration. Dashboard sections MUST fail
independently. Important result/error updates MAY use live regions, but MUST
NOT announce each visual loading change or skeleton row.

#### Scenario: Loading and refetch
- **WHEN** a query is in flight and no previous data exists
- **THEN** the section renders a geometry-matched skeleton
- **WHEN** a refetch starts with previous data available
- **THEN** previous data remains visible, only the affected section is marked
  busy, and controls that would duplicate the same request are temporarily
  unavailable

#### Scenario: Empty and filtered no-results
- **WHEN** a browse query succeeds with zero rows and no active filters
- **THEN** the list renders `Aún no hay oportunidades disponibles` without a
  `Limpiar filtros` action
- **WHEN** monitoring succeeds before any ingestion has run
- **THEN** the page renders `Aún no hay ejecuciones registradas. Los datos
  aparecerán después de la primera ingesta por CLI.`
- **AND** it does not render a dead documentation or run action; a documentation
  link MAY appear only when a stable product-visible URL is configured
- **WHEN** an active filter returns zero rows
- **THEN** the section renders `No encontramos resultados con estos filtros`
  and offers `Limpiar filtros` without presenting first-run copy

#### Scenario: Error
- **WHEN** an initial query fails with no usable data
- **THEN** the affected section renders `No pudimos cargar esta sección` with
  `Reintentar` and does not crash the page or other tabs
- **WHEN** a background refetch fails while previous data exists
- **THEN** previous data stays visible with `No pudimos actualizar esta
  sección` and `Reintentar`

#### Scenario: Stale and unavailable data
- **WHEN** data is stale but still available
- **THEN** the affected section keeps the data visible and renders `Datos
  desactualizados` with the last supplied update time
- **WHEN** cadence configuration is absent or the quota source list is empty
- **THEN** the relevant value renders `No configurado`
  without a synthetic score, percentage, or health summary

#### Scenario: Missing optional and unknown values
- **WHEN** an optional detail subsection is empty
- **THEN** its heading remains present with `Sin información`
- **WHEN** a single nullable value is absent
- **THEN** it renders `No informado`, except absent configuration which renders
  `No configurado` and absent `closingAt` which renders `Cierre no informado`
- **WHEN** a backend state is unknown
- **THEN** its raw value MAY appear only in technical detail while the primary
  status renders `No informado` with a neutral tag

### Requirement: Provide accessible responsive behavior

The page MUST preserve the existing drawer, tab, table, and side-panel
affordances across desktop, tablet, mobile, keyboard-only use, 200% zoom, and
reduced-motion preferences. Status meaning MUST never rely on color alone.
The page MUST have one `h1`; tabs, filters, rows, disclosures, and panel
controls MUST have visible focus and accessible names.

#### Scenario: Keyboard detail flow
- **WHEN** a keyboard user activates a process row
- **THEN** the detail panel opens, Escape closes it, and focus returns to the
  originating row

#### Scenario: Side-panel semantics
- **WHEN** the detail side panel is open
- **THEN** its initial focus, close behavior, and focus containment follow the
  existing side-panel shell for the active desktop or mobile mode
- **AND** mobile overlay content behind the full-screen panel is not reachable
  by keyboard
- **AND** the panel owns internal scroll rather than moving the underlying page

#### Scenario: Mobile and zoom
- **WHEN** the viewport is mobile-sized or content is zoomed to 200%
- **THEN** filters stack, tabs remain reachable, process rows use compact
  presentation, detail occupies the existing full-screen mobile panel, and
  the viewport has no horizontal overflow
- **AND** dense monitoring tables MAY scroll inside a labelled horizontal
  scroll region without causing page-level overflow

#### Scenario: Responsive information priority
- **WHEN** available width decreases from desktop to tablet
- **THEN** process code and publication date collapse before buyer, textual
  state, and closing date
- **WHEN** available width requires mobile presentation
- **THEN** each opportunity becomes one compact list item with title-or-code,
  buyer, textual state, and closing date in reading order
- **AND** technical fields remain in detail rather than being duplicated below
  every mobile item

#### Scenario: State announcements and reduced motion
- **WHEN** a result count, no-results message, or actionable error changes
- **THEN** one concise update is exposed through an appropriate live region
- **AND** skeleton rows and every intermediate loading frame are not announced
- **WHEN** reduced motion is requested
- **THEN** existing non-essential panel or tab transition motion is removed
  without delaying state changes

### Requirement: Navigation entry is data-driven

The view MUST appear in the main navigation drawer via a LINK
`NavigationMenuItem` targeting the new `AppPath`, optionally gated by a feature
flag, and MUST NOT rely on a hardcoded drawer row.

#### Scenario: Nav item present
- **WHEN** an authorized user opens the main drawer
- **THEN** a "Mercado Público" LINK item navigates to
  `/mercado-publico#compra-agil`

#### Scenario: Feature flag gating
- **WHEN** the view's feature flag is disabled
- **THEN** the nav item and route are hidden

### Requirement: Reuse existing frontend seams without parallel architecture

The implementation MUST stop at the first existing Twenty seam that satisfies
the behavior. Page-local browse state MUST remain local to each tab instance.
Shared extraction is allowed only after Compra Ágil and Licitaciones prove the
same stable composition. GraphQL transport types MUST be mapped at the data
boundary rather than leaking raw API field names through presentation
components.

| UX need | Existing pattern or component | Reuse type | New-code risk |
| --- | --- | --- | --- |
| App shell and content surface | `MainAppLayoutWithSidePanel`, `PageCardLayout`, `PageHeader` | Direct reuse | Low |
| URL-backed primary navigation | `SettingsTabBar` pattern | Localized composition | Low |
| Opportunity rows and pagination | Existing table/list primitives and previous/next controls | Composition | Medium |
| Status meaning | `Tag` plus `TagColor` and localized text | Direct reuse | Low |
| Filters and active values | Existing select/date/input/popover/chip primitives | Composition | Medium |
| Detail inspection | Existing side-panel shell, header, scroll, and mobile behavior | Localized extension | Medium |
| Loading, empty, and errors | Existing skeleton, empty placeholder, and inline banner patterns | Direct reuse | Low |
| Monitoring investigation | `SettingsAdminQueueJobsTable` interaction vocabulary | Localized extension without write controls | Medium |
| Compra Ágil and Licitaciones composition | One local browse composition with independent state instances | Composition after first tracer slice | Medium |
| Free-text or region discovery | No current read contract | Future backend expansion | High, out of scope |

#### Scenario: No speculative shared state or abstraction
- **WHEN** Compra Ágil, Licitaciones, filters, selection, or scroll need state
- **THEN** state remains inside the owning page/tab composition
- **AND** no global Jotai atom, generic procurement framework, or new design
  primitive is added without a demonstrated cross-surface consumer

#### Scenario: Wireframe acceptance mapping
- **WHEN** implementation is reviewed against `../../design.md`
- **THEN** Frames 2-4 prove navigation, Compra Ágil, filters, and detail;
  Frame 5 proves Centro de Control; Frame 6 proves loading, initial empty,
  no-results, and section error; Frames 7-12 prove progressive disclosure,
  tablet, mobile list, and mobile detail
- **AND** visual review treats fixture values as illustrative only and verifies
  all visible values against DTO-backed data
