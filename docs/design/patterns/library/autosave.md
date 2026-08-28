---
type: reference
title: Autosave
description: Pattern-specific guidance for automatic persistence with truthful save state.
okf_version: "0.1"
---

# Autosave

`UI-PAT-024` · Primary guide: [Forms and Editing](../forms-and-editing.md)

Posture: `CONTEXTUAL`

## Use when

Automatic persistence reduces interruption and the product can expose saved,
pending, offline, conflict, and failure states.

## Do not apply when

Users need an explicit review boundary or the backend cannot reconcile retries
and concurrent edits.

## Repository interpretation

Do not imply that a value is saved before server truth. Preserve recovery and
conflict behavior.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/autosave-ux) · [Official references](../sources/official-references.md)
