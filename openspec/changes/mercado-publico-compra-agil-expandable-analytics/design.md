---
type: change-design
title: "Design: mercado-publico-compra-agil-expandable-analytics"
description: "Canonical data, shared filters, analytics, and presentation design for Compra Ágil."
okf_version: "0.1"
---

# Design: mercado-publico-compra-agil-expandable-analytics

## Routing Declaration

Surface: `openspec/`, with implementation routed through
`packages/twenty-server` and `packages/twenty-front`. Consulted: root
`AGENTS.md`, `index.md`, `openspec/{AGENTS,CONTEXT,index}.md`,
`packages/{AGENTS,CONTEXT,index}.md`, both leaf package contracts, archived
Mercado Público predecessor changes, current source/tests, productive
Storybook, retained V2 evidence, and native graph/SidePanel precedents.

## Context

The predecessor route and UI correctly avoid invented values, but Compra Ágil
needs business analytics over all retained matches, not the current page. The
existing detected-process read service is already the owning boundary for
normalization and parameterized SQL. Deepening that module keeps population
semantics local and prevents list/chart drift.

This spec supersedes only incompatible Compra Ágil data and presentation
requirements. Route/hash, authentication, read-only behavior, SidePanel,
CLI-only ingestion, server pagination, truthful null states, Licitaciones, and
Centro de Control remain authoritative and unchanged.

## Goals / Non-Goals

**Goals**

- Preserve seven source-backed Compra Ágil business fields without conflating
  absence with zero.
- Make list, KPI, and charts share one normalized, parameterized population.
- Return one analytics payload for the complete filtered population.
- Present a native, keyboard-accessible, responsive Compra Ágil workspace with
  honest coverage language.

**Non-Goals**

- Materialized aggregates, caching, new graph libraries, generic query
  builders, speculative indexes, persisted UI preferences, or per-chart reads.
- Analytics changes outside Compra Ágil or a redesign of Centro de Control.
- Inferring region, amount, stage, documents, offers, buyer RUT, or unit.

## Boundary and Ownership

### Persistence Module

The deployment-local `mp` schema owns procurement evidence. A fast reversible
instance command adds nullable fields to staging, canonical, and gold shapes;
a slow idempotent command backfills from retained V2 payloads. Extraction and
canonical refresh preserve new evidence on future runs.

### Read Module

`MercadoPublicoDetectedProcessReadService` is the owning Module. Its Interface
is a typed filter object plus list and Compra Ágil analytics methods. The
highest Seam is the existing core GraphQL resolver. A single business-filter
normalizer and SQL `WHERE` constructor are used by both methods. This is a deep
local interface: callers do not know column names, joins, timezone bucketing,
or coverage arithmetic.

### Presentation Module

`modules/mercado-publico` owns the Compra Ágil composition. It uses one list
hook, one analytics hook, native graph components, native SidePanel, Lingui,
Linaria, and Twenty tokens. It does not add a reusable `twenty-ui` component.

## Canonical Field Semantics

| Canonical field | V2 evidence | Semantics |
| --- | --- | --- |
| `buyer_rut` | `institucion.rut` | Trimmed source value or null |
| `purchase_unit_name` | `institucion.unidad_compra` | Trimmed source value or null |
| `region_name` | `institucion.nombre_region` | Trimmed source value or null |
| `amount_available_clp` | `montos.monto_disponible_clp` | Finite source number or null |
| `call_stage` | `convocatoria.descripcion` | `first_call` or `second_call`; other values null |
| `document_count` | `documentos` | Array length; absent/non-array null; empty array zero |
| `offers_received_count` | `resumen.total_ofertas_recibidas` | Non-negative integer or null |

The backfill uses the same extractor as new ingestion. `COALESCE` protects
known canonical values from later missing evidence while preserving numeric
zero as known evidence.

## Shared Filter Contract

The normalizer accepts existing filters plus:

- `search`: case-insensitive match over process code, title, buyer name, and
  purchase unit;
- `regionName`;
- `closingFrom` / `closingTo`;
- `hasDocuments`: `true` means positive known count, `false` means explicit
  zero, and omission includes unknown;
- `callStages`: recognized first/second values only;
- `amountMin` / `amountMax`;
- exact `buyerRut`;
- amount sort through the existing sort whitelist.

List-only pagination and order are normalized separately after the shared
business filters. Analytics omits them and forces `process_type =
'compra_agil'`. All values remain query parameters; only whitelisted sort
columns interpolate into SQL.

## Analytics Contract

`mercadoPublicoCompraAgilAnalytics` executes one parameterized SQL statement
with a filtered-population CTE and returns:

- `summary`: total found, closing in the next 24 hours, known CLP sum, and
  positive known document count;
- `closingByDay`: today plus six consecutive local dates in
  `America/Santiago`, including zero buckets;
- `regions`: five highest counts, then region name ascending;
- `topBuyers`: five highest counts grouped by RUT, falling back to buyer code
  only, then key ascending;
- `amountBands`: `< $100 mil`, `$100 mil–$500 mil`, `$500 mil–$1 millón`,
  `$1–$3 millones`, and `> $3 millones`, in that fixed order;
- `callStages`: first and second call, unknown excluded;
- `documentAvailability`: positive versus explicit zero, unknown excluded;
- `metadata`: filtered population, calculation time, timezone, complete
  population confirmation, and known coverage counts for closing, region,
  buyer identity, amount, call stage, documents, and offers.

All amounts use known CLP values only. `completePopulation=true` describes
independence from list pagination, not provider-total completeness.

## GraphQL Shape

The existing list item gains the seven nullable fields. The existing list args
gain the additive filters and `amountAvailableClp` sort key. The analytics args
reuse the business filters except `processTypes`; the resolver forces Compra
Ágil by calling the dedicated service method.

GraphQL uses explicit object types for summary, buckets, buyer groups,
coverage, and metadata. No raw JSON is exposed. Frontend code generation
remains the contract source for hooks and UI.

## Presentation and Interaction

- Page header uses `TintedIconTile` and `IconBuildingSkyscraper` with tokens.
- Four KPI display total results, next-24-hour closings, known CLP amount, and
  detected-document opportunities. Partial dimensions say `N de Y` and sums
  say `informado`.
- Cierres and regions are always visible. Four secondary charts live inside an
  `AnimatedExpandableContainer`, closed by default.
- Charts use `GraphWidgetLineChart` and `GraphWidgetBarChart` directly inside
  domain-local labelled containers. Empty dimensions retain `NoDataLayer`
  behavior and explanatory text.
- The five-column table is Oportunidad, Institución/región, Monto, Cierre, and
  Antecedentes. Row activation opens the existing SidePanel with family/code.
- The Compra Ágil panel uses business language; reconciliation, lineage, and
  source priority remain available in backend data but are not rendered here.
- Loading, empty, error, partial coverage, keyboard focus, reduced motion,
  light/dark, desktop, and 390 px states remain explicit.

## Data Flow

```text
V2 retained payload
  -> Compra Ágil extractor
  -> mp.stg_api_v2_compra_agil
  -> mp.compra_agil
  -> mp.gold_detected_process
  -> shared normalized filter + parameterized population
       -> paginated list
       -> one full-population analytics query
  -> Apollo hooks
  -> KPI + charts + table + native SidePanel
```

## Decisions

1. Store source-backed dimensions rather than reparse raw JSON at read time.
   Rationale: one canonical contract serves filters, list, analytics, backfill,
   and future ingestion consistently.

2. Deepen the detected-process read service instead of creating a generic
   query builder.
   Rationale: the existing module already owns this SQL and a broader
   abstraction has no second demonstrated consumer.

3. Use one analytics GraphQL query and no materialized aggregate.
   Rationale: correctness and filter parity come first; indexing or caching
   requires observed query evidence.

4. Report partial coverage instead of hiding charts.
   Rationale: known evidence remains useful when the denominator and unknown
   count stay visible.

5. Keep the productive Compra Ágil component domain-local.
   Rationale: Licitaciones and Control Center are regression surfaces, not
   consumers of this analytics composition.

## Blast Radius

### Touched runtime areas

- Mercado Público V2 extraction, staging persistence, canonical refresh,
  reconciliation gold projection, instance commands, read service, DTO,
  resolver, schema, frontend GraphQL, hooks, Compra Ágil component, productive
  story, and focused tests.

### Untouched runtime areas

- Provider clients and bounded pagination, mutations, scheduling, workspace
  metadata, tenant CRM records, Licitaciones UI/query behavior, Control Center,
  native SidePanel host, and shared UI packages.

## Verification Strategy

- First prove null/zero extraction and refresh, shared filter parity, and
  pagination-independent analytics.
- Prove migration `up`/`down`, idempotent retained-payload backfill, known-only
  arithmetic, fixed amount-band boundaries, Santiago local-day buckets, and
  deterministic top-five ordering.
- Prove resolver/query/codegen and productive Apollo/MSW full/loading/empty/
  error/partial states.
- Run focused Jest, Nx typecheck/lint/build, Storybook interaction/a11y checks,
  predecessor regression tests, and `openspec validate`.

