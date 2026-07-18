---
type: change-tasks
title: "Tasks: mercado-publico-command-center"
description: "Tasks for the Mercado Publico command center read view."
okf_version: "0.1"
---
# Tasks: mercado-publico-command-center

## 0. Investigation and Scope Lock

- [ ] 0.1 Confirm the five existing read DTOs against the binding matrix in
  `design.md`; reject unsupported search, region, OC amount, award date,
  percentage confidence, approval state, cadence, quota, or synthetic metric
  fields before freezing resolver outputs.
  Traceability: locks the real backend read surface before resolver planning
  begins.

- [ ] 0.2 Confirm `usePageChangeEffectNavigateLocation` redirect fallthrough
  for a new `AppPath` member (verify against its test table) and confirm
  `MainAppLayoutWithSidePanel` route group placement.
  Traceability: de-risks the new top-level route + onboarding redirect
  interaction before wiring.

- [ ] 0.3 Confirm the two new read queries (`stg_job_run` list, `raw_api_payload`
  list) use indexed `ingestion_job_id`/`started_at`/`fetched_at` ordering and
  `limit/offset`; no unbounded scans, no gold writes.
  Traceability: locks the only new backend data access at the read-only seam.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add fail-first resolver integration coverage at the `/graphql` seam
  for detected-process list (filters: processTypes, states, buyerCode,
  publishedFrom/To, changedSince, sort; pagination) and process detail.
  Traceability: proves the browse contract before the resolver ships.

- [ ] 1.2 Add fail-first resolver integration coverage for job-run list
  (`stg_job_run` filters, status union incl. `skipped`, pagination,
  expandable error_summary) and API call log (`raw_api_payload` filters by
  source/endpoint/http_status, pagination).
  Traceability: proves the monitoring contract at the new read services.

- [ ] 1.3 Add fail-first resolver integration coverage for pipeline health,
  API quota usage, and CSV file health wrapper outputs.
  Traceability: proves the wrapper shapes over the existing read services.

- [ ] 1.4 Add fail-first frontend behavior coverage for canonical hash fallback,
  exact filter mapping, `page`/`limit`/`total` browse pagination, bounded
  monitoring previous/next pagination, keyboard detail focus, request-parameter redaction,
  and independent state handling.
  Traceability: proves reviewer-visible contracts before page components ship.

## 2. Implementation

### Backend read services and resolver

- [ ] 2.1 Add `MercadoPublicoJobRunReadService` (raw SQL over
  `mp.stg_job_run`: list with status/job/started filters, pagination,
  error_summary) and `MercadoPublicoApiCallLogReadService` (raw SQL over
  `mp.raw_api_payload`: list with source/endpoint/http_status filters,
  pagination), each with focused unit tests.
  Traceability: isolates the only new data access before transport mapping.

- [ ] 2.2 Add GraphQL ObjectTypes/Args + a `MercadoPublicoQueryResolver`
  on core `/graphql` delegating to the five existing read services plus the
  two new read services; wire auth the same as other core resolvers.
  Traceability: keeps transport adaptation separate from read logic.

- [ ] 2.3 Export the resolver from the module and ensure it is picked up by
  the core schema without registering `mp.*` as workspace standard objects.
  Traceability: preserves the instance-level schema boundary.

### Front-end data layer

- [ ] 2.4 Add `src/modules/mercado-publico/graphql/{queries,fragments}/`
  documents (gql tags) for every resolver query; register the module glob in
  `codegen.cjs`; run
  `npx nx run twenty-front:graphql:generate` and commit the generated
  DocumentNodes.
  Traceability: isolates client transport adaptation before UI rendering.

- [ ] 2.5 Add hook wrappers under `src/modules/mercado-publico/hooks/`
  (list-with-filters, detail, job-run list, call-log, health/quota)
  using `useQuery` + `previousData` for smooth reloads, mirroring
  `useUsageAnalyticsData`.
  Traceability: gives components a stable data API independent of UI.

### Front-end route and nav

- [ ] 2.6 Add the `AppPath` member for `/mercado-publico` (twenty-shared)
  and the lazy route block in `useCreateAppRouter.tsx` inside
  `MainAppLayoutWithSidePanel` (with `LazyRoute` + skeleton fallback).
  Traceability: mounts the view without touching other routes.

- [ ] 2.7 Add the LINK `NavigationMenuItem` seed (and optional feature flag
  wiring via `useIsFeatureEnabled`) so the view appears in the main drawer.
  Traceability: keeps nav data-driven and merge-stable.

- [ ] 2.8 Create `pages/mercado-publico/MercadoPublicoCommandCenterPage.tsx`
  on `PageCardLayout` with `PageHeader` + `SettingsTabBar`: Licitaciones,
  Compra Ágil, Centro de Control. Canonical entry is
  `/mercado-publico#licitaciones`; invalid hashes fall back safely.
  Traceability: establishes the page shell and URL-backed tab contract.

### Front-end tabs and detail panel

- [ ] 2.9 Implement **Licitaciones** with contract-backed state, exact buyer
  code, publication/changed-date, and sort controls; status `Tag` values;
  `page`/`limit`/`total` previous/next pagination; and distinct states.
  Do not add partial client-side search.
  Traceability: delivers Frame 3 without widening the read contract.

- [ ] 2.10 Implement the process **detail side panel** using only DTO-backed
  identity/state, buyer, dates, items, adjudications, related OC evidence,
  lineage, reconciliation counts, source priority, and last-seen fields;
  include null-section copy, keyboard open/close, and focus restoration.
  Traceability: delivers Frame 4 without invented business evidence.

- [ ] 2.11 Implement **Compra Ágil** by reusing the browse/detail shape and
  its estado mapping including `proveedor_seleccionado` and `oc_emitida`.
  Do not add unsupported region, free-text, or related-OC list columns.
  Traceability: delivers the second browse view within the same DTO contract.

- [ ] 2.12 Implement **Centro de Control** as Frame 5's continuous surface:
  compact health matrix, real quota rows, bounded job/API logs with independent
  state and expandable details, redacted request parameters, and CSV health.
  Reuse queue-table vocabulary without retry/delete/selection controls.
  Traceability: delivers monitoring without nested card grids or write paths.

### i18n and quality

- [ ] 2.13 Localize all visible strings with Lingui macros and format dates,
  times, counts, percentages, and CLP through workspace locale/timezone; run
  Lingui extract/compile.
  Traceability: satisfies localization and truthful-formatting contracts.

- [ ] 2.14 Harden Frames 1–6 for desktop/tablet/mobile, 200% zoom,
  keyboard-only use, visible focus, live-region behavior, reduced motion,
  overflow, long text, null values, and partial errors.
  Traceability: makes the specified product surface production-ready.

## 3. Verification

- [ ] 3.1 Run focused resolver integration tests at the `/graphql` seam
  against seeded `mp.*` fixtures for every query.
  Traceability: proves the transport contract directly.

- [ ] 3.2 Run frontend jest for exact filter mapping, both pagination models,
  expandable rows, status maps, redaction, focus restoration, long/null data,
  and independent loading/refetch/empty/no-results/error states.
  Traceability: proves UI seams instead of relying on manual breadth.

- [ ] 3.3 Walk through Frames 1–6 at desktop/tablet/mobile, keyboard-only,
  200% zoom, and reduced motion; confirm route/hash/nav and side-panel return.
  Traceability: closes wireframe, responsive, and accessibility drift.

- [ ] 3.4 Run `npx nx lint:diff-with-main twenty-server --configuration=fix`,
  `npx nx lint:diff-with-main twenty-front --configuration=fix`,
  `npx nx typecheck twenty-server`, `npx nx typecheck twenty-front`.
  Traceability: closes the package quality gates for both surfaces.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update `CHANGELOG.md` only when the slice is ready to ship.
  Traceability: release traceability belongs after implementation and
  verification.

- [ ] 4.2 Update user/operational docs only where shipped behavior changed
  (new view + nav item); do not document ingestion internals out of scope.
  Traceability: keeps docs aligned with the read-only shipped surface.

- [ ] 4.3 Run `openspec validate mercado-publico-command-center` and confirm
  proposal, design, spec, and tasks remain aligned before any later
  `/opsx-sync` or `/opsx-archive`.
  Traceability: final artifact-level proof.

## Execution Order

### Slice 0 — Scope lock
- Tasks: `0.1 -> 0.2 -> 0.3`
- Checkpoint: read service DTOs verified, route/redirect seam verified,
  read-query bounds verified.
- Blocks: Slices 1, 2.

### Slice 1 — Resolver contract (failing first)
- Tasks: `1.1 -> 1.2 -> 1.3 -> 1.4`
- Checkpoint: every query has a failing proof at the `/graphql` seam.
- Blocked by: Slice 0.
- Blocks: Slice 2-backend.

### Slice 2 — Implementation
- Backend: `2.1 -> 2.2 -> 2.3`
- Front data: `2.4 -> 2.5`
- Front route/nav: `2.6 -> 2.7 -> 2.8`
- Front views: `2.9 -> 2.10 -> 2.11 -> 2.12`
- Quality: `2.13 -> 2.14`
- Checkpoint: resolver ships; front module wires data, route, views; i18n
  passes.
- Blocked by: Slice 1 (backend), Slice 0 (frontend registration).
- Blocks: Slice 3.

### Slice 3 — Verification
- Tasks: `3.1 -> 3.2 -> 3.3 -> 3.4`
- Checkpoint: contract proof + UI proof + quality gates green.
- Blocked by: Slice 2.
- Blocks: Slice 4.

### Slice 4 — Closeout
- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: changelog, docs, and `openspec validate` aligned.
- Blocked by: Slice 3.
- Blocks: None.
