---
type: design-guide
title: Search and Filter Discovery
description: Guidance for searchable datasets, active filters, query state, and no-result recovery.
okf_version: "0.1"
---

# Search and Filter Discovery

Use this guide when users need to find a subset of records or understand why
results changed.

## Applies when

- a list or dataset is searchable or filterable;
- active constraints affect the visible result set;
- users need to remove or revise constraints without losing context.

## Do not apply when

- the dataset has no meaningful query or filter dimensions;
- a filter would imply a distinction the backend does not provide;
- a new search surface would duplicate existing route or component behavior.

## Guidance

- Make the searchable scope and result feedback clear.
- Expose active filters with visible, removable state and a clear-all action
  when several filters can be active.
- Distinguish true empty, no search results, and filtered-empty states.
- Keep keyboard access, labels, focus, and long-list behavior explicit.
- Preserve shareable URL state when the feature contract requires it. Reset the
  cursor when the query or filters change.
- Use domain labels in the UI. Do not expose raw backend field names as labels.

## Mercado Público

Preserve `q`, `cohorte`, `estado`, `buyer`, `region`, date/range, `orden`,
`after`, and `proceso` according to `mercado-publico-application.md`. Filter
changes reset the cursor and preserve the required order and selected process.

## Verification

Check search entry, result feedback, filter add/remove, clear all, direct URL
restoration, query/filter cursor reset, no-results copy, keyboard behavior, and
responsive layout.

## Primary-owned patterns

- Primary owner: [Search Experience System](library/search-experience-system.md)
- Primary owner: [Filter Chips](library/filter-chips.md)
