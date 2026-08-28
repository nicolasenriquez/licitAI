---
type: reference
title: Modal Hierarchy
description: Pattern-specific guidance for choosing between modal, drawer, popover, and disclosure surfaces.
okf_version: "0.1"
---

# Modal Hierarchy

`UI-PAT-022` · Primary guide: [Overlays and Disclosure](../overlays-and-disclosure.md)

Posture: `REQUIRED_WHEN_OVERLAY_NEEDED`

## Use when

An overlay is needed and its interruption, context, scope, and focus behavior
must be selected deliberately.

## Do not apply when

Navigation or inline content would preserve context more clearly.

## Repository interpretation

Use a modal for an interrupting decision, a side panel for contextual detail,
and disclosure for secondary content. Follow existing Twenty focus and inert
behavior.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/modal-hierarchy) · [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
