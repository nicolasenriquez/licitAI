---
type: reference
title: Bulk Actions
description: Pattern-specific guidance for applying one operation to an explicit record selection.
okf_version: "0.1"
---

# Bulk Actions

`UI-PAT-001` · Primary guide: [Data-Dense Surfaces](../data-dense-surfaces.md)

Posture: `RECOMMENDED`

## Use when

Users select multiple records for the same safe operation and the scope can be
made explicit.

## Do not apply when

Records need different decisions or the mutation has heterogeneous or unclear
side effects.

## Repository interpretation

Reuse existing Twenty selection and action primitives. Show selection scope,
pending state, failure, and recovery. For Mercado Público, do not invent a bulk
capability that the product contract does not provide.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/bulk-actions) · [Official references](../sources/official-references.md)
