---
type: change-spec
title: "Spec: mercado-publico-workspace-redesign"
description: "Successor UI requirements for Mercado Público workspace reads."
okf_version: "0.1"
---

# Spec: mercado-publico-workspace-redesign

## Implementation Readiness Contract

This is a successor UI specification. When applied, it supersedes only
conflicting Mercado Público presentation requirements in
`mercado-publico-command-center`; that change remains authoritative for current
backend reads, GraphQL shape, route, and CLI-only ingestion. A field missing
from those reads MUST NOT be rendered until separately authorized.

It SHALL retain `/mercado-publico`, its three URL-hash tabs, read-only behavior,
server pagination, truthful null/partial states, applied context, and keyboard/
focus behavior. It SHALL replace the bespoke filter chrome, fixed detail
overlay/focus trap, compact-list mobile presentation, duplicated monitoring
wrappers, and conflicting Control Center composition. Backend/read expansion,
new metrics, ingestion changes, and unresolved predecessor environment
verification are outside this change.

## ADDED Requirements

### Requirement: Compose both process families through one truthful browse/detail grammar

The system SHALL render Compra Ágil and Licitaciones with the same domain-local
browse grammar: Objeto, Organismo, Estado, Cierre, Publicada, Código; supported
filters/sorts; and server `page`/`limit`/`total`. Supported filters SHALL be
state, publication-from, publication-to, exact buyer code, and changed-since.
Supported sorts SHALL be `lastSeenAt`, `publishedAt`, `closingAt`,
`processCode`, and `canonicalState`, each ascending or descending. It SHALL use
the global desktop/mobile SidePanel for detail. Compra Ágil MAY render typed
source detail progressively; Licitaciones SHALL render only its current common
detail, items, adjudications, related-OC evidence, lineage, and reconciliation.

The SidePanel selection SHALL travel as `family` plus `code` in contextual
state owned by that SidePanel instance. A thin Mercado Público domain hook
SHALL open the registered page; it SHALL NOT introduce global selection state
or a parallel detail host.

#### Scenario: Keyboard user opens and closes a supported detail
- **WHEN** a keyboard user activates a browse row by Enter or Space
- **THEN** the native SidePanel opens the same typed detail as pointer use
- **AND** Escape or close returns focus to the activating row while preserving
  that tab's applied filters, page, selection, and scroll context

#### Scenario: Data is absent or pending
- **WHEN** `compraAgilSource` is null, a supported field is null, or a browse
  list is unavailable
- **THEN** the UI labels source detail pending or values unavailable without
  zeroes, inferred facts, or stale selected fixture detail
- **AND** `lastSeenAt` is labelled as an observation, not freshness

### Requirement: Keep Centro de Control factual, continuous, and bounded

The system SHALL render Diagnóstico, Investigación, and Integridad as one
continuous read-only surface. It SHALL mount only one heavy job-run or API-call
table at once and use local contained semantic tables at narrow widths and
200% zoom. It MAY display per-source remaining quota only as
`max(0, dailyLimit - used)` with both inputs visible.

#### Scenario: Monitoring response is partial or paginated
- **WHEN** a pipeline/CSV response is partial or an investigation response
  exposes `hasMore`
- **THEN** the UI displays only returned facts and page scope
- **AND** it does not replace missing values with zero or claim a global total,
  freshness, quality, coverage, or success rate

#### Scenario: Investigation view changes
- **WHEN** the user switches between job runs and API calls
- **THEN** only the selected heavy table is mounted and queried
- **AND** each view preserves its own supported filters and bounded pagination

### Requirement: Preserve native theme, responsive, and accessible behavior before removal

The system SHALL use existing Twenty tokens and primitives and SHALL preserve
light/dark contrast, visible keyboard focus, semantic headings/tables, reduced
motion, unique tooltip anchor IDs, and no document-level horizontal overflow.
It SHALL NOT remove bespoke presentation until its native replacement has
focused behavior tests and cross-surface visual/a11y parity evidence.

#### Scenario: Long data at mobile and 200% zoom
- **WHEN** long Spanish procurement text renders at mobile width or 200% zoom
- **THEN** browse remains the same six-column semantic table contained in a
  focusable local scroller, text has an
  accessible full-value path, and the document does not overflow horizontally

#### Scenario: Replacement is not yet proven
- **WHEN** native replacement coverage or cross-surface audit has not passed
- **THEN** the corresponding bespoke presentation remains in place
- **AND** no generic component, token family, dependency, or parallel shell is
  introduced as a substitute
