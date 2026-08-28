---
type: design-guide
title: Mercado Público Pattern Application
description: Priority and guardrail map for applying curated UI patterns to the Mercado Público workflow.
okf_version: "0.1"
---

# Mercado Público Pattern Application

Use this document for Mercado Público-specific product flow and UI guardrails.
It maps relevant curated pattern knowledge to that workflow.

## Product flow

Preserve the direct flow: search, filter, scan public procurement processes,
open detail, and decide what merits investigation. Keep the current route,
URL state, selection, and side-panel model.

## Priority map

### P0

- Data Table
- Search Experience System
- Filter Chips
- Loading States System
- Error States
- Empty States
- Pagination
- Focus States
- Design Tokens and Color Accessibility when affected

### P1 when the capability exists

- Bulk Actions
- Modal Hierarchy
- Context Menu
- Inline Editing
- Undo UX
- Optimistic UI
- Notification System
- Microcopy

### P2 or out of scope by default

- Command Palette
- Tooltip Design
- optional visual heuristics
- marketing-only patterns

## Mercado Público guardrails

- Preserve `q`, `cohorte`, `estado`, `buyer`, `region`, date/range, `orden`,
  `after`, and `proceso` when the feature contract requires them.
- Reset the cursor when filters or the query change. Preserve order and selected
  process when the contract requires them.
- Distinguish loading, data, empty, filtered-empty, unavailable, and error.
- Retry in place and preserve URL state.
- Use `No informado por fuente`, `Aún no disponible`, and `No aplica` where
  the contract requires unavailable-value language.
- Do not invent capital, margin, ROI, probability, scores, recommendations, or
  universe metrics.
- Use semantic table structure, visible focus, 320px and 200% zoom checks,
  token-based light/dark styling, and no decorative motion or gradients.
- Use the existing side-panel detail model. Do not add a competing detail route.
