---
type: design-brief
title: Mercado Publico V2 UI
description: Operate-mode contract for the Mercado Publico workspace.
okf_version: "0.1"
---

# Mercado Público V2 UI

## Purpose

Mercado Público is an operational workspace for a Chilean SME with one to three
operators, limited research time, and limited working capital. It must support
one direct flow: search, filter, scan public procurement processes, open
detail, and decide what merits investigation. Keep the current routes and
GraphQL contract. Do not add a parallel record page.

## Information hierarchy

Use this order on the processes page:

1. Mercado Público heading and section navigation.
2. Primary filters: search, situation, region, closing date, and order.
3. Applied-filter chips.
4. Results state and dense semantic table.
5. Previous and next pagination.
6. Collapsed Quality and provenance analytics.

Use the words **Procesos** and **Compradores** for Mercado Público source data.
Reserve **Oportunidad** for an explicit CRM conversion or link action. Show
totals as secondary context.

## Interaction contract

- Keep `q`, `cohorte`, `estado`, `buyer`, `region`, date, range, `orden`,
  `after`, and `proceso` URL keys.
- Removing one chip or all filters resets the cursor. It keeps order and the
  selected `proceso`.
- Store previous cursors in navigation state. Preserve unrelated navigation
  state. A direct URL with no cursor history disables Previous.
- Keep analytics independent from result loading and failure.
- Keep the detail in the existing side panel. Put secondary data in collapsed
  disclosures. Keep history secondary and the sanitized payload technical.

## States and data language

Use table-shaped skeletons while results load. Put empty content in a status
region and failures in an alert region. Retry in place without clearing URL
state. Translate healthy, stale, and degraded. Omit unknown freshness. Never
derive universe metrics from the visible page.

Distinguish numeric zero from unavailable data. Use one of these messages when
data is absent: `No informado por fuente`, `Aún no disponible`, or `No aplica`.

Treat the published process amount as source evidence, not required working
capital. Do not invent capital, margin, ROI, probability, scores, or
recommendations. State explicitly when financial feasibility is not evaluated.

## Responsive and accessibility

Keep a semantic table, caption, column headers, and `time` values. Preserve a
visible focus ring. At narrow widths, transform each row into a compact record
without changing source order or accessible names. Support 320 px and 200%
zoom. Controls need clear labels and practical touch targets. Announce loading,
empty, and error states. Keep light and dark themes token-based.

## Visual language

Use Lingui, Linaria, `themeCssVariables`, and `twenty-ui` primitives. Use the
existing dense Twenty product language. Do not create metric cards, gradients,
decorative motion, or a second design system.

## Anti-patterns

- Do not show every filter at once.
- Do not repeat data-quality disclosures in each buyer row.
- Do not show empty optional sections in the detail panel.
- Do not add fake totals or metrics from paged results.
- Do not replace native buttons with keyboard simulations.
- Do not add a static sidebar entry or a full-detail route.
