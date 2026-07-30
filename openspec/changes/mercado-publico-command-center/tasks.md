---
type: change-tasks
title: "Tasks: mercado-publico-command-center"
description: "Tasks for the Mercado Publico command center and source-to-read remediation."
okf_version: "0.1"
---
# Tasks: mercado-publico-command-center

## 0. Investigation and Scope Lock

- [x] 0.1 Confirm the five existing read DTOs against the binding matrix in
  `design.md`; reject unsupported search, region, OC amount, award date,
  percentage confidence, approval state, cadence, quota, or synthetic metric
  fields before freezing resolver outputs.
  Traceability: locks the real backend read surface before resolver planning
  begins.

- [x] 0.2 Confirm `usePageChangeEffectNavigateLocation` redirect fallthrough
  for a new `AppPath` member (verify against its test table) and confirm
  `MainAppLayoutWithSidePanel` route group placement.
  Traceability: de-risks the new top-level route + onboarding redirect
  interaction before wiring.

- [x] 0.3 Establish indexed bounded-read contract for the two new read queries
  (`stg_job_run` list, `raw_api_payload` list): indexes cover
  `ingestion_job_id`/`started_at`/`fetched_at` ordering and future queries MUST
  use `limit/offset`; no unbounded scans, no gold writes.
  Traceability: locks the only new backend data access at the read-only seam.

- [x] 0.4 Capture the V2 Compra Ágil provider-to-read diagnosis in
  `runtime-diagnosis-2026-07-29.md`: retained V2 records contain title,
  institution, nested state, dates, and region; staging/canonical/gold drop
  those values; all successful list calls requested page 1; and the registered
  date command remains unapplied locally.
  Traceability: establishes the source-of-truth evidence and separates a
  persistence defect from UI rendering or a missing buyer-reference join.

## 1. Contract Coverage (Failing First)

- [x] 1.1 Add fail-first resolver integration coverage at the `/graphql` seam
  for detected-process list (filters: processTypes, states, buyerCode,
  publishedFrom/To, changedSince, sort; pagination) and process detail.
  Traceability: proves the browse contract before the resolver ships.

- [x] 1.2 Add fail-first resolver integration coverage for job-run list
  (`stg_job_run` filters, status union incl. `skipped`, pagination,
  expandable error_summary) and API call log (`raw_api_payload` filters by
  source/endpoint/http_status, pagination).
  Traceability: proves the monitoring contract at the new read services.

- [x] 1.3 Add fail-first resolver integration coverage for pipeline health,
  API quota usage, and CSV file health wrapper outputs.
  Traceability: proves the wrapper shapes over the existing read services.

- [x] 1.4 Add fail-first frontend behavior coverage for the canonical
  `#compra-agil` fallback, exact filter mapping, `page`/`limit`/`total`
  browse pagination, per-tab context preservation, bounded monitoring
  previous/next pagination, keyboard detail focus, request-parameter
  redaction, and independent state handling.
  Traceability: proves reviewer-visible contracts before page components ship.

- [x] 1.5 Add a fail-first end-to-end V2 data-contract fixture that carries
  `nombre`, institution buyer name, nested state, publication, and closing
  through raw evidence, staging, canonical, gold, and the browse GraphQL
  contract. Assert that a known value is never replaced with null.
  Traceability: proves the smallest normalized repair rather than a UI-only
  fallback.

- [x] 1.6 Add a fail-first detail fixture that selects the latest retained V2
  raw record for a code (`fecha_ultimo_cambio`, then `fetched_at`) and maps its
  observed fields into a typed GraphQL object. Assert no provider call, no
  browser raw JSON, non-clickable source path, and document ID/name only.
  Traceability: proves complete detail without persisting every field.

- [x] 1.7 Add a fail-first pagination fixture with at least two V2 provider
  pages and a provider-declared page count over 250. Assert every declared page
  through `MP_COMPRA_AGIL_MAX_PAGES=250` is requested and retained, and the
  job marks the capped run partial rather than complete.
  Traceability: proves complete daily discovery within the operational guard.

## 2. Implementation

### Backend read services and resolver

- [x] 2.1 Add `MercadoPublicoJobRunReadService` (raw SQL over
  `mp.stg_job_run`: list with status/job/started filters, pagination,
  error_summary) and `MercadoPublicoApiCallLogReadService` (raw SQL over
  `mp.raw_api_payload`: list with source/endpoint/http_status filters,
  pagination), each with focused unit tests.
  Traceability: isolates the only new data access before transport mapping.

- [x] 2.2 Add GraphQL ObjectTypes/Args + a `MercadoPublicoQueryResolver`
  on core `/graphql` delegating to the five existing read services plus the
  two new read services; wire auth the same as other core resolvers.
  Traceability: keeps transport adaptation separate from read logic.

- [x] 2.3 Export the resolver from the module and ensure it is picked up by
  the core schema without registering `mp.*` as workspace standard objects.
  Traceability: preserves the instance-level schema boundary.

### Front-end data layer

- [x] 2.4 Add `src/modules/mercado-publico/graphql/{queries,fragments}/`
  documents (gql tags) for every resolver query; register the module glob in
  `codegen.cjs`; run
  `npx nx run twenty-front:graphql:generate` and commit the generated
  DocumentNodes.
  Traceability: isolates client transport adaptation before UI rendering.

- [x] 2.5 Add hook wrappers under `src/modules/mercado-publico/hooks/`
  (list-with-filters, detail, job-run list, call-log, health/quota)
  using `useQuery` + `previousData` for smooth reloads, mirroring
  `useUsageAnalyticsData`; keep browse filters, pagination, selection, and
  scroll local to each tab instance rather than creating global Jotai atoms.
  Traceability: gives components a stable data API while preventing cross-tab
  resets and unnecessary global state.

### Front-end route and nav

- [x] 2.6 Add the `AppPath` member for `/mercado-publico` (twenty-shared)
  and the lazy route block in `useCreateAppRouter.tsx` inside
  `MainAppLayoutWithSidePanel` (with `LazyRoute` + skeleton fallback).
  Traceability: mounts the view without touching other routes.

- [x] 2.7 Add the LINK `NavigationMenuItem` seed (and optional feature flag
  wiring via `useIsFeatureEnabled`) so the view appears in the main drawer.
  Traceability: keeps nav data-driven and merge-stable.

- [x] 2.8 Create `pages/mercado-publico/MercadoPublicoCommandCenterPage.tsx`
  on `PageCardLayout` with `PageHeader` + `SettingsTabBar`: Compra Ágil,
  Licitaciones, Centro de Control. Canonical entry and drawer destination are
  `/mercado-publico#compra-agil`; missing or invalid hashes are replaced with
  that fallback safely.
  Traceability: establishes the provider-first page shell and deterministic
  URL-backed tab contract.

### Front-end tabs and detail panel

- [x] 2.9 Implement **Compra Ágil** as the primary browse composition with
  contract-backed state, publication-range and sort controls visible, exact
  buyer code and changed-since under `Más filtros`, applied-filter chips,
  `page`/`limit`/`total` pagination, and the DTO-backed estado mapping.
  Keep title, buyer, state, closing date, publication date, and code in the
  specified hierarchy; do not add partial client-side search.
  Traceability: delivers the provider-first browse surface without widening
  the read contract.

- [x] 2.10 Implement the process **detail side panel** using only DTO-backed
  identity/state, buyer, dates, items, adjudications, related OC evidence,
  lineage, reconciliation counts, source priority, and last-seen fields;
  include null-section copy, sticky accessible header, keyboard open/close,
  focus restoration, internal scrolling, and preservation of source-list
  context.
  Traceability: delivers detail inspection without invented business evidence
  or loss of browse context.

- [x] 2.11 Implement **Licitaciones** by reusing the Compra Ágil browse/detail
  composition with an independent local state instance and its contract-backed
  estado mapping. Do not add unsupported region, free-text, or related-OC
  list columns.
  Traceability: delivers the secondary browse view without duplicating filters
  or coupling its context to Compra Ágil.

- [x] 2.12 Implement **Centro de Control** as a continuous surface:
  Diagnóstico with compact health matrix and real quota rows, Investigación
  with a selector that mounts one bounded job/API log table at a time and
  preserves its own state, and Integridad de fuentes with CSV health. Redact
  request parameters and reuse queue-table vocabulary without
  retry/delete/selection controls.
  Traceability: delivers progressive monitoring without nested card grids,
  simultaneous heavy tables, or write paths.

### i18n and quality

- [x] 2.13 Localize all visible strings with Lingui macros and format dates,
  times, counts, percentages, and CLP through workspace locale/timezone; run
  Lingui extract/compile.
  Traceability: satisfies localization and truthful-formatting contracts.

- [x] 2.14 Harden the documented desktop/tablet/mobile states for 200% zoom,
  keyboard-only use, one `h1`, visible focus, modal side-panel focus handling,
  moderate live-region behavior, reduced motion, contained table overflow,
  long text, null/unknown values, stale data, unavailable configuration, and
  partial or total errors.
  Traceability: makes the specified product surface production-ready without
  asserting wireframe-only WCAG conformance.

### Source-to-read remediation

- [x] 2.15 Verify and apply the already-registered V2 date instance command
  through the supported upgrade workflow in the intended environment before a
  new V2 ingestion run; record the applied version and do not run it from the
  UI.
  Traceability: satisfies the live schema precondition without adding a public
  migration surface.

- [x] 2.16 Add an immutable instance command with `up` and `down` for the V2
  browse fields missing from staging/canonical: title and buyer name, plus any
  necessary canonical support for normalized state and browse dates. Preserve
  the existing date command rather than editing it.
  Traceability: creates an auditable, reversible schema path for the provider
  contract.

- [x] 2.17 Extend V2 extraction and persistence only for browse title, buyer
  name, normalized state, publication, and closing; extend Compra Ágil gold
  materialization and typed browse reads so represented values are no longer
  hard-coded to `NULL`.
  Traceability: repairs the exact loss point for browse data.

- [x] 2.18 Add a typed server-side Compra Ágil detail adapter over the latest
  retained raw list record for the selected code. Return the observed current
  V2 fields, with source path as text and documents as ID/name pairs only; do
  not add a generic JSON response or a provider call on panel open.
  Traceability: reuses retained evidence and the existing side-panel seam.

- [x] 2.19 Reprocess retained V2 raw payloads through an idempotent backfill.
  Fill missing normalized values, including the known historical nested-state
  rows, without overwriting a non-null canonical value with null; retain raw
  provenance and job evidence.
  Traceability: repairs existing rows safely rather than only future ingests.

- [x] 2.20 Extend V2 list orchestration to fetch every provider-declared page
  sequentially through `MP_COMPRA_AGIL_MAX_PAGES=250`, retain one raw evidence
  record per page, and mark a cap-reached run partial. Document the daily
  deployment-operated CLI run; add no scheduler or UI control.
  Traceability: makes the observed page-one-only snapshot recoverable while
  preserving the CLI-only boundary.

- [x] 2.21 Extend the existing Compra Ágil detail side panel and GraphQL
  documents/codegen to render the typed raw-detail object: additional dates,
  amounts, offers, reasons, documents, institution, convocatoria, and source
  reference. Keep the compact browse table unchanged.
  Traceability: makes all observed current V2 fields visible without a dense
  grid or a new component family.

## 3. Verification

- [x] 3.0 Apply the 2026-07-29 review remediation: establish `partial` as a
  persisted job-run status; repair slow-upgrade ordering and hard-auth queue
  disposition; complete browse/control-center filters and CSV evidence link;
  and harden design-token legacy parity and Nx inputs with focused regression
  coverage.
  Traceability: closes the review findings without widening the command-center
  authority boundary or editing generated artifacts by hand.

- [ ] 3.1 Run focused resolver integration tests at the `/graphql` seam
  against seeded `mp.*` fixtures for every query.
  Traceability: proves the transport contract directly.
  Note (2026-07-29): blocked on Windows test harness setup. The repository
  seed aborts on a backslash file-storage path before test token membership is
  complete; resolver requests fail authorization and fixture hooks time out.

- [x] 3.2 Run frontend jest for canonical routing, exact filter mapping,
  per-tab preserved context, both pagination models, expandable rows, status
  maps, redaction, focus restoration, long/null data, and independent
  loading/refetch/empty/no-results/stale/error states.
  Traceability: proves UI seams instead of relying on manual breadth.

- [ ] 3.3 Walk through the documented browse, detail, monitoring, and state
  frames at desktop/tablet/mobile, keyboard-only, 200% zoom, and reduced
  motion; confirm route/hash/nav, deterministic fallback, and side-panel
  context/focus return.
  Traceability: closes wireframe, responsive, and accessibility drift.
  Note (2026-07-29): blocked because the in-app browser inventory was empty.
  Automated Jest covers keyboard open/close, focus restoration, typed detail,
  and a non-clickable source path; manual responsive/zoom/motion QA remains.

- [x] 3.4 Run `npx nx lint:diff-with-main twenty-server --configuration=fix`,
  `npx nx lint:diff-with-main twenty-front --configuration=fix`,
  `npx nx typecheck twenty-server`, `npx nx typecheck twenty-front`.
  Traceability: closes the package quality gates for both surfaces.

- [x] 3.5 Run the V2 browse, typed-detail, and pagination fixtures against the
  migration-ready schema. Verify normalized browse values, latest-raw detail
  precedence, no provider call on panel open, document/source-reference
  boundaries, retention through page 250, cap-partial status, and idempotent
  historical-state repair.
  Traceability: proves the diagnosed runtime defect is closed end-to-end.

## 4. Release Hygiene and Closeout

- [x] 4.1 Update `CHANGELOG.md` only when the slice is ready to ship.
  Traceability: release traceability belongs after implementation and
  verification.

- [x] 4.2 Update user/operational docs where shipped behavior changed (new
  view + nav item) and preserve the compact-table/detail mapping,
  `MP_COMPRA_AGIL_MAX_PAGES=250` partial-run semantics, daily CLI cadence,
  backfill procedure, and schema-precondition evidence for operators. Do not
  expose those operations as product UI controls.
  Traceability: keeps the read-only surface and CLI-only recovery path
  discoverable without broadening authority.

- [x] 4.3 Run `openspec validate mercado-publico-command-center` and confirm
  proposal, design, spec, and tasks remain aligned before any later
  `/opsx-sync` or `/opsx-archive`.
  Traceability: final artifact-level proof.

## Execution Order

### Slice 0 — Scope lock
- Tasks: `0.1 -> 0.2 -> 0.3 -> 0.4`
- Checkpoint: read service DTOs verified, route/redirect seam verified,
  read-query bounds and source-to-read evidence verified.
- Blocks: Slices 1, 2.

### Slice 1 — Resolver contract (failing first)
- Tasks: `1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5 -> 1.6 -> 1.7`
- Checkpoint: every query plus the V2 browse, typed-detail, and full-page
  contracts have a failing proof at the appropriate seam.
- Blocked by: Slice 0.
- Blocks: Slice 2-backend.

### Slice 2 — Implementation
- Schema/source: `2.15 -> 2.16 -> 2.17 -> 2.18 -> 2.19 -> 2.20`
- Backend: `2.1 -> 2.2 -> 2.3`
- Front data: `2.4 -> 2.5`
- Front route/nav: `2.6 -> 2.7 -> 2.8`
- Front views: `2.9 -> 2.10 -> 2.11 -> 2.12 -> 2.21`
- Quality: `2.13 -> 2.14`
- Checkpoint: migration-ready schema, compact normalized browse, typed raw
  detail, full bounded discovery, resolver, and front module agree on one read
  contract.
- Blocked by: Slice 1; existing date command is a precondition for V2
  ingestion/backfill work.
- Blocks: Slice 3.

### Slice 3 — Verification
- Tasks: `3.1 -> 3.2 -> 3.3 -> 3.4 -> 3.5`
- Checkpoint: browse/detail/page-completeness proof, UI proof, and quality
  gates green.
- Blocked by: Slice 2.
- Blocks: Slice 4.

### Slice 4 — Closeout
- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: changelog, docs, and `openspec validate` aligned.
- Blocked by: Slice 3.
- Blocks: None.
