---
type: reference
title: Error States
description: Pattern-specific guidance for communicating failure and recovery.
okf_version: "0.1"
---

# Error States

`UI-PAT-036` · Primary guide: [Feedback and Recovery](../feedback-and-recovery.md)

Posture: `REQUIRED`

## Use when

Loading, validation, or server behavior fails in a way that affects the user.

## Do not apply when

The message is generic, hides the affected scope, or offers no useful recovery.

## Repository interpretation

Match the error surface to scope and severity. Use accessible alert semantics,
accurate copy, retry where valid, and preserve useful context.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/error-states) · [Official references](../sources/official-references.md)
