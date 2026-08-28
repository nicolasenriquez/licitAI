---
type: design-guide
title: Data-Dense Surfaces
description: Guidance for tables, records, selection, sorting, and pagination in product workflows.
okf_version: "0.1"
---

# Data-Dense Surfaces

Use this guide when users scan, compare, select, sort, or page through
structured records.

## Applies when

- the surface presents repeated structured records;
- users need comparison or scanning;
- pagination, sorting, or selection has real domain meaning.

## Do not apply when

- the content is primarily narrative or heterogeneous;
- a new table would duplicate an existing Twenty surface;
- selection scope or bulk effects cannot be made explicit.

## Guidance

- Prefer native semantic table structure for tabular data. Use the repository's
  metadata-driven rendering and existing `twenty-ui` primitives.
- Define loading, populated, empty, filtered-empty, unavailable, and error
  states before styling the table.
- Make sorting state, selection scope, and bulk-operation consequences visible.
- Keep keyboard traversal and focus visible. Do not make critical actions
  available only on hover.
- Preserve filters, ordering, selection, and cursor behavior required by the
  feature contract.
- Use truthful data only. Do not derive universe metrics from a paged result.

## Mercado Público

The process list is a dense record surface. Preserve its URL keys and cursor
rules from `mercado-publico-application.md`. Use table-shaped skeletons,
distinguish zero results from unavailable data, and keep detail in the existing
side panel.

## Verification

Check initial loading, data, empty, filtered-empty, error, selected row,
multi-selection, sorting, pagination, keyboard traversal, narrow layout, and
200% zoom. For semantic behavior, cross-check the
[WAI-ARIA table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/).

## Primary-owned patterns

- Primary owner: [Bulk Actions](library/bulk-actions.md)
- Primary owner: [Data Table](library/data-table.md)
- Primary owner: [Pagination](library/pagination.md)
