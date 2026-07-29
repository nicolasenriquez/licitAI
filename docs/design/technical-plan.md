---
type: technical-plan
title: "Design Token Migration Plan"
description: "Incremental delivery plan for the canonical token seam and generated adapters."
okf_version: "0.1"
---
# Design Token Migration Plan

## Baseline

Capture the public `twenty-ui` CSS variable names, light/dark values, theme
accessor paths, and current Storybook visual evidence before changing runtime
consumers. Resolve contradictions in tooling and theme-class documentation
before adding enforcement.

## Waves

1. **Canonical seam** — DTCG source, vocabulary, validator, deterministic
   compiler, generated CSS/TypeScript/Figma bundles, and legacy parity tests.
2. **Product adapter** — import all remaining `twenty-ui` values, generate the
   complete `themeCssVariables` compatibility shape, and verify `.light`/`.dark`
   and `ThemeProvider` behavior.
3. **Marketing adapter** — preserve the local website facade while moving
   semantic definitions into the marketing register; keep product previews on
   a small adapter rather than importing a full product theme.
4. **Governance and enforcement** — CI determinism check, visual hardcode debt
   baseline, accessibility/visual gates, and design/frontend ownership review.
5. **Figma pilot** — import the generated collections and verify names, aliases,
   descriptions, and modes from a branch/PR.

## Exit criteria

- No generated-file diff after regeneration.
- All source aliases resolve without cycles.
- Mode paths remain in parity.
- Existing public theme keys and values remain unchanged until a migration
  wave has direct visual evidence.
- New hardcoded visual values are rejected while existing debt is tracked.
