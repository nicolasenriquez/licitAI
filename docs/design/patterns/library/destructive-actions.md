---
type: reference
title: Destructive Actions
description: Pattern-specific guidance for actions that can cause material or irreversible change.
okf_version: "0.1"
---

# Destructive Actions

`UI-PAT-007` · Primary guide: [Destructive and Reversible Actions](../destructive-and-reversible-actions.md)

Posture: `REQUIRED_WHEN_APPLICABLE`

## Use when

An action deletes, overwrites, archives, publishes, or changes durable state.

## Do not apply when

The action is safe and reversible, or the interface cannot accurately describe
its scope and consequence.

## Repository interpretation

Classify risk and reversibility before choosing confirmation, undo, or
optimistic behavior. Do not promise a reversal the backend cannot perform.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/destructive-actions) · [Official references](../sources/official-references.md)
