---
type: change-spec
title: "Spec: mercado-publico-compra-agil-expandable-analytics"
description: "Normative Compra Ágil canonical analytics and presentation contract."
okf_version: "0.1"
---

# Spec: mercado-publico-compra-agil-expandable-analytics

## Successor Authority

This specification supersedes only incompatible Compra Ágil requirements from
`mercado-publico-command-center` and `mercado-publico-workspace-redesign`.
Their route/hash, authentication, read-only, server-pagination, native
SidePanel, CLI-only ingestion, truthful null/partial states, Licitaciones, and
Centro de Control requirements remain in force.

## ADDED Requirements

### Requirement: Preserve the minimum Compra Ágil analytics canon

The system SHALL preserve nullable buyer RUT, purchase unit name, region name,
available CLP amount, recognized call stage, document count, and offers
received count from retained V2 evidence through staging, canonical, gold, and
typed list reads. Missing or unrecognized evidence SHALL remain null.

#### Scenario: Empty documents are known zero
- **WHEN** a retained Compra Ágil record contains an explicit empty
  `documentos` array
- **THEN** `documentCount` is stored and returned as `0`
- **AND** document coverage counts that record as known without documents

#### Scenario: Missing documents are unknown
- **WHEN** a retained Compra Ágil record omits `documentos` or supplies a
  non-array value
- **THEN** `documentCount` remains null
- **AND** the system does not classify it as without documents

#### Scenario: Canon expansion is reversible and safe
- **WHEN** the analytics canon is installed or rolled back
- **THEN** a registered instance command provides explicit `up` and `down`
- **AND** retained-payload backfill is idempotent and never overwrites a known
  canonical value with missing evidence

### Requirement: Share one parameterized filtered population

The detected-process list and Compra Ágil analytics SHALL use the same business
filter normalizer and parameterized SQL population builder. The list SHALL add
server-side search over code, title, buyer name, and purchase unit; region,
closing range, explicit document presence, recognized call stage, CLP amount
range, exact buyer RUT, and amount ordering. Existing calls that omit these
filters SHALL retain their current behavior.

#### Scenario: List and analytics filters agree
- **WHEN** a client supplies the same Compra Ágil business filters to list and
  analytics
- **THEN** both operate on the same matching population
- **AND** every dynamic value is passed as a SQL parameter

#### Scenario: Pagination and ordering do not affect analytics
- **WHEN** the list page, limit, sort key, or sort direction changes while
  business filters stay fixed
- **THEN** analytics totals and buckets remain unchanged
- **AND** no KPI or graph is computed from loaded list items

### Requirement: Expose one complete-population Compra Ágil analytics query

The core GraphQL API SHALL expose one read-only
`mercadoPublicoCompraAgilAnalytics` query. It SHALL force Compra Ágil, accept
the list business filters without pagination or order, and return summary,
seven local closing-day buckets, top regions, top buyers, fixed CLP amount
bands, recognized call stages, document availability, and metadata.

#### Scenario: Local closing buckets are complete
- **WHEN** analytics are calculated
- **THEN** `closingByDay` contains today and the next six consecutive dates in
  `America/Santiago`
- **AND** missing dates are returned as zero buckets while null closings remain
  outside every bucket

#### Scenario: Amount arithmetic uses known CLP only
- **WHEN** filtered rows contain known and unknown available CLP amounts
- **THEN** the summary sum and five amount bands use only known amounts
- **AND** metadata reports amount coverage as known records out of the full
  filtered population

#### Scenario: Buyers have stable identity and order
- **WHEN** buyer groups are calculated
- **THEN** they group by buyer RUT with buyer code as the only fallback
- **AND** buyer name is never used as identity
- **AND** top-five ties are ordered deterministically by identity key

#### Scenario: Partial coverage remains useful and explicit
- **WHEN** one analytical dimension is known for fewer than all filtered rows
- **THEN** known rows remain represented
- **AND** metadata reports the known count and filtered denominator
- **AND** unknown rows are not placed into a false zero or fallback category

### Requirement: Present Compra Ágil as a native expandable analytics workspace

The `/mercado-publico#compra-agil` surface SHALL render a native Twenty header,
four summary KPI, two always-visible primary graphs, a closed-by-default
disclosure with four secondary graphs, a five-column result table, and the
native SidePanel. It SHALL issue one initial analytics query and SHALL NOT add
per-graph lazy queries.

#### Scenario: Productive full state renders the complete composition
- **WHEN** list and analytics queries return full data
- **THEN** the surface renders the four specified KPI, closing and region
  graphs, expandable buyer/amount/call/document graphs, and columns for
  opportunity, institution/region, amount, closing, and documents
- **AND** row activation opens the existing SidePanel for the selected Compra
  Ágil process

#### Scenario: Partial coverage uses business language
- **WHEN** coverage is partial
- **THEN** KPI and graph captions use `informado`, `resultados disponibles`, or
  `N de Y`
- **AND** the Compra Ágil view does not expose reconciliation, lineage, source
  priority, or raw backend field names

#### Scenario: Loading, empty, and error states are truthful
- **WHEN** either query is loading, empty, stale-with-error, or unavailable
- **THEN** the surface uses native skeleton, no-data, alert, and retry behavior
- **AND** it never substitutes loaded-page arithmetic for missing analytics

### Requirement: Preserve native accessibility, theme, and adjacent surfaces

The Compra Ágil composition SHALL use Lingui, Linaria, theme tokens, native
graph components, `AnimatedExpandableContainer`, `PageCardHeader`,
`SettingsTabBar`, and the native SidePanel. It SHALL preserve visible focus,
keyboard activation/return, reduced motion, light/dark behavior, and local
responsive containment at 390 px without productive custom SVG or hex colors.

#### Scenario: Narrow and keyboard interaction remains usable
- **WHEN** the surface is used at 390 px, 200% zoom, or with keyboard only
- **THEN** charts and table remain locally contained, disclosure state is
  announced, controls have visible focus, and SidePanel close returns focus
- **AND** the document does not gain horizontal overflow

#### Scenario: Adjacent surfaces retain behavior
- **WHEN** the successor is applied
- **THEN** default hash canonicalization, Licitaciones, Centro de Control, and
  SidePanel hosting remain functionally unchanged
- **AND** prototype stories are removed only after productive parity passes

