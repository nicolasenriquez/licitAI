---
type: change-proposal
title: "Change Proposal: mercado-publico-compra-agil-expandable-analytics"
description: "Truthful full-population analytics and an expandable Compra Ágil workspace."
okf_version: "0.1"
---

# Change Proposal: mercado-publico-compra-agil-expandable-analytics

## Why

The current Compra Ágil tab is a truthful paginated browser, but the retained
V2 payload contains additional business fields that are not preserved in the
canonical read model. Analysts therefore cannot filter by region, amount,
documents, call stage, or institution RUT, and any chart built from the loaded
page would misrepresent the retained population.

This successor change expands only the Compra Ágil data and presentation
contract. It keeps the route, authentication, read-only interaction model,
native SidePanel, CLI-only ingestion boundary, Licitaciones behavior, and
Centro de Control behavior established by the archived predecessor changes.

## Investigation / Current State

- `mercado-publico-command-center` is archived and owns the source-to-read,
  GraphQL, route/hash, authentication, pagination, SidePanel, and CLI-only
  ingestion contracts.
- `mercado-publico-workspace-redesign` is archived and owns the current native
  Twenty composition and truthful null/partial presentation contract.
- No OpenSpec change was active when this successor was created.
- Retained V2 evidence exposes institution RUT, purchase unit, region name,
  available CLP amount, convocatoria description, documents, and offer count.
- `mp.stg_api_v2_compra_agil`, `mp.compra_agil`,
  `mp.gold_detected_process`, and `mercadoPublicoDetectedProcesses` do not yet
  preserve those seven fields.
- `MercadoPublicoDetectedProcessReadService` already owns list normalization,
  parameterized filtering, pagination, and deterministic ordering. It is the
  narrowest high-leverage owner for shared list and analytics population logic.
- Productive Mercado Público Storybook coverage, native graph components,
  `AnimatedExpandableContainer`, `PageCardHeader`, `SettingsTabBar`, and the
  registered SidePanel provide the required presentation precedents.

## What Changes

- Add seven nullable Compra Ágil fields through reversible instance commands,
  retained-payload backfill, extraction, staging, canonical refresh, gold
  projection, and GraphQL list output.
- Extend `mercadoPublicoDetectedProcesses` additively with Compra Ágil business
  filters and amount sorting while preserving existing callers.
- Add one read-only `mercadoPublicoCompraAgilAnalytics` query over the complete
  filtered population, independent of list pagination and ordering.
- Replace only the productive Compra Ágil composition with four truthful KPI,
  two primary charts, four expandable secondary charts, a five-column result
  table, and the existing native SidePanel.
- Extend productive Storybook scenarios for full, loading, empty, error, and
  partial coverage, then remove only superseded prototype stories.

## Capabilities

### New Capabilities

- `mercado-publico-compra-agil-expandable-analytics`: Canonical Compra Ágil
  business fields, shared filter semantics, full-population analytics, coverage
  metadata, and native expandable presentation.

### Modified Capabilities

- None. This successor capability explicitly overrides only incompatible
  Compra Ágil requirements while retaining all compatible predecessor
  contracts.

## Change Profile

- Profile: `runtime-change`
- Why this profile fits: persistence, extraction, GraphQL reads, filtering,
  analytics, and the user-visible Compra Ágil tab all change at runtime.

## Out Of Scope

- Analytics or redesign work for Licitaciones or Centro de Control.
- A materialized aggregate table, cache, new chart dependency, feature flag,
  persistent preference, per-chart query, or browser-derived KPI.
- A generic query builder or reusable procurement component library.
- Ingestion mutations, scheduling, retries, or any browser write path.
- New indexes without `EXPLAIN` or observed latency evidence.
- Inferred values for missing or unrecognized provider evidence.

## Impact

- Affects the deployment-local `mp` staging, canonical, and gold read shapes.
- Affects Mercado Público V2 extraction, persistence, canonical refresh,
  reconciliation projection, read service, DTOs, resolver, schema, generated
  frontend GraphQL types, hooks, tests, and productive Storybook composition.
- Does not add dependencies or modify workspace metadata objects, tenant CRM
  data, Licitaciones behavior, Centro de Control behavior, or SidePanel hosting.

## Ownership and Test Seam

- Highest existing Seam: `/mercado-publico#compra-agil`, its core GraphQL hooks,
  and the native SidePanel.
- Owning Module: `modules/mercado-publico` in the frontend and
  `MercadoPublicoDetectedProcessReadService` in the backend.
- Interface: callers provide one business-filter set; the list and analytics
  consume the same normalized, parameterized population contract.
- Highest test Seam: PostgreSQL-shaped integration coverage of the read service
  plus productive page/Storybook coverage through Apollo and SidePanel.
- Adapter: the V2 list extractor normalizes source evidence; GraphQL remains a
  thin read-only transport adapter.
- Depth / Leverage / Locality: one canonical mapping and one filter builder
  serve list, KPI, and charts without introducing a broader query abstraction.

## Prior Art and First Proof

- Prior art: archived Mercado Público command-center and workspace-redesign
  changes, existing read-service integration tests, productive Workspace story,
  native graph widgets, and native SidePanel registration.
- First failing behavior or contract proof: an explicit empty `documentos`
  array must persist as `0` while an absent list remains `null`; list and
  analytics with identical business filters must select the same population,
  and changing page or sort must not alter analytics.
- UI proof: productive Apollo/MSW scenarios expose four KPI, six charts, the
  closed disclosure, five-column table, SidePanel, and honest partial coverage.

## Execution Order Decision

- Required: yes.
- Why: schema, source mapping, read contract, code generation, productive
  Storybook, route integration, and regression proof are dependent slices.

## Verification Policy

- Add failing contract coverage before each persistence/read/UI slice.
- Prove null versus zero, filter parity, pagination-independent aggregates,
  local-day bucketing in `America/Santiago`, deterministic top-five ordering,
  and known-only amount arithmetic.
- Run narrow server/frontend tests before typecheck, lint, builds, Storybook,
  and OpenSpec validation.
- Do not substitute current-page arithmetic or broad suite success for the
  owning-seam proofs.

## Notes

- Context: this is a new successor change, not a reopening of an archived
  command-center change.
- Assumptions: retained V2 evidence remains the backfill authority and the core
  datasource can read deployment-local `mp` rows.
- Boundaries: known records remain useful under partial coverage; unknown
  values stay null and are reported as `N de Y`, never inferred or hidden.

