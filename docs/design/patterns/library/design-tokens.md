---
type: reference
title: Design Tokens
description: Pattern-specific guidance for using repository-defined visual constants.
okf_version: "0.1"
---

# Design Tokens

`UI-PAT-066` · Primary guide: [Visual Foundations](../visual-foundations.md)

Posture: `REQUIRED`

## Use when

A component needs color, spacing, typography, radius, shadow, or motion values.

## Do not apply when

Literal external values would bypass an existing token or theme contract.

## Repository interpretation

Search `packages/twenty-ui/src/theme/` and `src/theme-constants/` first. Preserve
light/dark parity and existing CSS-variable contracts.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/design-tokens) · [Official references](../sources/official-references.md)
