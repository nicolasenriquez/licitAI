---
type: reference
title: Pagination
description: Pattern-specific guidance for moving through paged result sets without losing query context.
okf_version: "0.1"
---

# Pagination

`UI-PAT-047` · Primary guide: [Data-Dense Surfaces](../data-dense-surfaces.md)

Posture: `REQUIRED_FOR_PAGED_DATA`

## Use when

Results are paged and users need clear next, previous, position, and context
behavior.

## Do not apply when

Paging is added without a real result-set contract or obscures a better existing
Twenty data surface.

## Repository interpretation

Preserve cursor, filters, ordering, selection, URL state, loading, and failure.
For Mercado Público, follow the explicit `after` contract.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/pagination) · [Official references](../sources/official-references.md)
