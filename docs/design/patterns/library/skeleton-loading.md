---
type: reference
title: Skeleton Loading
description: Pattern-specific guidance for shape-preserving loading placeholders.
okf_version: "0.1"
---

# Skeleton Loading

`UI-PAT-043` · Primary guide: [Feedback and Recovery](../feedback-and-recovery.md)

Posture: `RECOMMENDED_WHEN_SHAPE_KNOWN`

## Use when

The loaded content has a stable, known shape and the placeholder preserves
orientation.

## Do not apply when

The shape is unknown, content is unavailable, or a skeleton would imply data
that does not exist.

## Repository interpretation

Use table-shaped skeletons for stable dense tables. Preserve `aria-busy`, status,
responsive structure, and reduced motion.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/skeleton-loading) · [Official references](../sources/official-references.md)
