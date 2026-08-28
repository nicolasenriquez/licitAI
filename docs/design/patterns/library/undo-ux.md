---
type: reference
title: Undo UX
description: Pattern-specific guidance for truthful reversal after a user action.
okf_version: "0.1"
---

# Undo UX

`UI-PAT-041` · Primary guide: [Destructive and Reversible Actions](../destructive-and-reversible-actions.md)

Posture: `RECOMMENDED_WHEN_REVERSIBLE`

## Use when

The backend and domain model can reliably reverse the completed action.

## Do not apply when

Reversal is partial, unsafe, unavailable, or cannot be communicated truthfully.

## Repository interpretation

Show scope, time, outcome, failure, and recovery. Do not use undo to avoid
appropriate confirmation for irreversible actions.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/undo-ux) · [Official references](../sources/official-references.md)
