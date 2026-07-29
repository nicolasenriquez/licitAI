---
type: design-index
title: "Design System"
description: "Normative navigation for product and marketing tokens, components, accessibility, and Figma adapters."
okf_version: "0.1"
---
# Design System

This directory is the human-facing contract for the shared design system.
The machine-readable source is `packages/twenty-design-tokens`; generated
artifacts must not be edited by hand.

## Start here

- `design-system.md` — product and marketing registers, interaction, and
  accessibility baseline.
- `token-governance.md` — vocabulary, hierarchy, mode rules, and ownership.
- `token-contribution.md` — authoring, deprecation, validation, and review.
- `technical-plan.md` — incremental migration waves and exit criteria.
- `figma.md` — Figma as a generated/imported adapter.
- `wireframe-playbook.md` — layout and interaction guidance.

## Routing rule

Choose the register before choosing a token. Product work uses `product`; the
website uses `marketing`. If a token appears useful to both, first prove that
it represents the same primitive decision rather than copying semantics.
