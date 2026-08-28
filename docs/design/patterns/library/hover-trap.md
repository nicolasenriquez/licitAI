---
type: reference
title: Hover Trap
description: Pattern-specific guidance for avoiding hover-only discovery and actions.
okf_version: "0.1"
---

# Hover Trap

`UI-PAT-003` · Primary guide: [Overlays and Disclosure](../overlays-and-disclosure.md)

Posture: `REQUIRED`

## Use when

Any pointer-enhanced affordance could otherwise hide information or an action.

## Do not apply when

Hover is only an optional enhancement and the same behavior is available from
focus, keyboard, touch, or visible controls.

## Repository interpretation

Critical actions must never depend on hover. Use existing Twenty focus and
disclosure primitives.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/hover-trap) · [MDN hover media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
