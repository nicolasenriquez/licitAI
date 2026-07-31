---
type: product-requirements-document
title: "Mercado Público workspace redesign"
status: ready-for-agent
source_of_truth: openspec/changes/mercado-publico-workspace-redesign
---

# Mercado Público workspace redesign

Status: ready-for-agent

## Problem Statement

As a Mercado Público operator, I can read real procurement information today,
but Compra Ágil, Licitaciones, and Centro de Control still expose overlapping
bespoke presentation behavior. That makes browsing, opening detail, adapting
to small screens, and recognizing unavailable data less consistent than the
rest of Twenty. The former visual reference also contains demo values and a
parallel application shell that must not become product behavior.

I need one calm, native Twenty workspace that lets me discover a procurement
process, inspect only supported facts, and understand operational evidence
without invented numbers, stale detail, or a second control surface.

## Solution

Replace the Mercado Público presentation layer on the existing read-only route
with one shallow, domain-local browse/detail grammar for Compra Ágil and
Licitaciones, plus one continuous factual Control Center. Keep existing reads,
GraphQL shape, route, and CLI-only ingestion authority unchanged. Use native
Twenty shell, controls, theme tokens, feedback, and the desktop/mobile global
SidePanel; retain local semantic table composition only where procurement
density and responsive containment require it.

The highest test seam is the authenticated Mercado Público page consuming its
existing typed hooks and opening the global SidePanel. It observes real user
behavior: supported fields, row activation, focus return, query inputs,
truthful null/partial states, and responsive containment. This seam was
validated through the prototype and human destination gate.

## User Stories

1. As a procurement analyst, I want Compra Ágil and Licitaciones to use the
   same browse grammar, so that I can move between process families without
   relearning the interface.
2. As a procurement analyst, I want to see Objeto, Organismo, Estado, Cierre,
   Publicada, and Código in browse results, so that I can identify a supported
   process quickly.
3. As a procurement analyst, I want filters, sorts, and pagination to reflect
   the server response, so that the workspace never implies client-invented
   totals or results.
4. As a keyboard user, I want Enter and Space to open the same detail as a
   pointer action, so that browse results are fully operable without a mouse.
5. As a keyboard user, I want Escape or close to return focus to my activating
   row, so that I retain my context after inspecting a process.
6. As a procurement analyst, I want active tab, filters, page, selection, and
   scroll context preserved around detail, so that reviewing a process does not
   reset my discovery work.
7. As a mobile user, I want the same process detail to use the native mobile
   SidePanel behavior, so that detail remains usable without a separate modal
   implementation.
8. As a Compra Ágil analyst, I want supported source details to appear
   progressively, so that richer detail is useful without promising it for
   every record.
9. As a Licitaciones analyst, I want common detail, items, adjudications,
   related-OC evidence, lineage, and reconciliation shown only when supported,
   so that family-specific information is not falsely generalized.
10. As an analyst, I want a source-pending record to say that its source detail
    is pending, so that I do not mistake absence for zero offers, budget, or
    documents.
11. As an analyst, I want null and unavailable values labelled explicitly, so
    that I can distinguish an unknown fact from a factual zero.
12. As an analyst, I want an unavailable browse list to hide stale selected
    fixture detail, so that the selected record never appears real when its
    list state is not.
13. As an operator, I want `lastSeenAt` described as an observation, so that I
    do not interpret it as a freshness guarantee.
14. As an operations user, I want Diagnóstico, Investigación, and Integridad
    in one continuous read-only Control Center, so that I can understand the
    operational state without navigating a dashboard maze.
15. As an operations user, I want the investigation view to mount only the
    selected job-run or API-call table, so that dense operational data stays
    responsive and bounded.
16. As an operations user, I want partial and paginated responses to show only
    their returned scope, so that the product never fabricates global totals,
    rates, freshness, quality, or coverage.
17. As an operations user, I want any remaining quota to show its inputs and
    transparent non-negative arithmetic, so that the number is auditable.
18. As a mobile and zoom user, I want long Spanish procurement tables contained
    in a focusable local scroller, so that the document itself does not scroll
    horizontally at narrow widths or 200% zoom.
19. As a low-vision user, I want light and dark themes, contrast, visible focus,
    semantic headings and tables, full-value text access, and reduced-motion
    behavior to remain intact, so that the workspace is usable across supported
    accessibility settings.
20. As a maintainer, I want sibling overflow tooltips to have unique accessible
    anchor IDs, so that assistive technology receives an unambiguous label.
21. As a maintainer, I want bespoke filters, overlays, focus traps, and duplicate
    monitoring wrappers removed only after their native replacement proves
    parity, so that simplification does not delete required behavior.

## Implementation Decisions

- This is a presentation-only successor. It supersedes conflicting visual
  composition requirements from the prior Mercado Público command-center work,
  while preserving backend reads, GraphQL shape, navigation route, and CLI-only
  ingestion behavior.
- The workspace remains read-only. It adds no provider, DTO, GraphQL, database,
  migration, scheduler, retry, permission, or write-path behavior.
- Both process families share a domain-local browse/detail interaction grammar,
  but their detail content remains family-specific. No generic procurement grid
  or universal data adapter is introduced.
- The global SidePanel owns desktop/mobile hosting, Escape, focus stack, and
  focus return. Mercado Público contributes a thin selected-family/code detail
  page rather than another overlay, focus trap, or responsive breakpoint system.
- The Control Center is a vertical sequence of Diagnóstico, Investigación, and
  Integridad. It owns local view context and semantic dense tables, but it does
  not derive metrics, transport data, or expose mutations.
- Supported data is the visible-data ceiling. A missing datum is represented as
  pending, unavailable, empty, partial, loading, or error state; it is never
  replaced by fixtures, zeroes, inferred values, aggregate ratios, or KPI cards.
- Native Twenty components, tokens, shell, controls, feedback, tags, themes,
  and accessibility behavior are the visual authority. The external HTML is
  only an information-hierarchy reference.
- No dependency, token family, second application shell, global page state, or
  generic Mercado Público abstraction is justified by this change.
- Replacement is additive until observable parity passes; the old bespoke
  presentation is removed in the same completed slice as its native successor
  to avoid dual authorities.
- Rollback restores the prior frontend composition only. Persisted data, query
  contracts, and URL behavior remain compatible and require no migration.

## Testing Decisions

- A good test observes user-visible behavior at the page plus existing typed
  hooks plus global SidePanel seam. It does not assert component internals or
  styling implementation details.
- Focused page and component tests must fail first for row activation, pointer
  and keyboard equivalence, focus return, preserved browse context, and absence
  of stale selected detail.
- State tests cover source-pending, unavailable list, null values, loading,
  empty, error, partial monitoring, and `hasMore` pagination. They assert that
  no fabricated zero, freshness statement, global ratio, or unsupported detail
  appears.
- Control Center coverage asserts one mounted heavy investigation table at a
  time, per-view supported state preservation, transparent quota calculation,
  and no aggregate claims from partial responses.
- Semantic/responsive coverage asserts one `h1`, semantic table structure,
  visible focus, contained local scrolling at narrow widths and 200% zoom,
  reduced motion, adequate contrast in both themes, and unique sibling tooltip
  anchors.
- Prior art is the validated Mercado Público prototype, existing page tests,
  existing Mercado Público hooks, the global SidePanel host, and the existing
  Storybook interaction/visual/a11y audit harness.
- Required verification is focused Mercado Público tests, frontend typecheck,
  and fresh Storybook interaction, visual, and accessibility replay at
  desktop/mobile, light/dark, keyboard-only, 200%, and reduced motion. If a
  shared SidePanel type changes, validate its shared package before consumers.

## Out of Scope

- New or changed backend read contracts, GraphQL documents, DTOs, provider
  adapters, persistence, migrations, ingestion, scheduling, retries,
  permissions, or mutations.
- Free-text or buyer-name search, new browse columns, filters, sorts, document
  downloads, dashboard KPIs, freshness/quality/coverage scores, or any field
  not supported by current reads.
- API quota policy changes, reconciliation heuristics, tenant copies of public
  procurement data, and an ingestion console.
- New dependencies, a token family, a generic data-grid framework, a marketing
  visual style, or reproduction of the external demo shell and datasets.

## Further Notes

- Discovery is closed and the human destination gate is validated. The active
  OpenSpec change is the canonical implementation authority; this PRD is its
  tracker-facing synthesis for agent handoff.
- Implementation begins with the scope lock and existing SidePanel seam check,
  then failing behavior coverage, then browse/detail, Control Center, parity,
  and closeout in that order.
- Deferred risks remain explicit: a missing native primitive needs cross-surface
  parity evidence; a missing DTO field needs a separate OpenSpec change;
  production-shaped authenticated test states need frontend test-owner support;
  and exact bespoke deletion waits for parity audit evidence.
