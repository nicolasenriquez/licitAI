---
type: reference
title: Settings System
description: Pattern-specific guidance for grouping and saving user settings.
okf_version: "0.1"
---

# Settings System

`UI-PAT-023` · Primary guide: [Forms and Editing](../forms-and-editing.md)

Posture: `RECOMMENDED`

## Use when

Users configure durable preferences or behavior and need a clear way to know
what changed and when it is saved.

## Do not apply when

Settings are mixed without task or risk grouping, or instant save would create
an unexpected durable mutation.

## Repository interpretation

Group settings by task and risk. Choose instant versus explicit save from the
domain contract and expose pending, saved, and error states.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/settings-system) · [Official references](../sources/official-references.md)
