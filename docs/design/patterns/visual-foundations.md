---
type: design-guide
title: Visual Foundations
description: Guidance for hierarchy, tokens, color, density, layering, and visual heuristics.
okf_version: "0.1"
---

# Visual Foundations

Use this guide when a task changes hierarchy, spacing, color, typography,
icons, surfaces, density, or theme behavior.

## Applies when

- the visual change improves scanning, comprehension, or task priority;
- a component needs an existing token or theme mapping;
- a chart or visual encoding communicates real data.

## Do not apply when

- an external aesthetic recipe conflicts with the repository design system;
- a decorative treatment adds gradients, glassmorphism, excessive shadows,
  parallax, or an unbounded “premium” look;
- a visual metaphor would imply data the backend does not provide.

## Guidance

- Use `docs/design/design-system.md` and the actual Twenty token seams as the
  source of truth. Search `packages/twenty-ui/src/theme/` and
  `packages/twenty-ui/src/theme-constants/` before adding values.
- Prioritize task hierarchy and readable density before decoration.
- Use semantic color and non-color cues. Preserve light/dark parity and WCAG
  contrast.
- Use existing icon, layout, radius, shadow, and typography primitives.
- Keep charts truthful. Do not calculate universe metrics from paged data.
- Treat visual laws and ratios as heuristics only. They cannot override tokens,
  package contracts, or feature requirements.

## Mercado Público

Keep the product analytical, restrained, and read-optimized. Do not add metric
cards, gradients, decorative motion, fake scores, or a second visual system.

## Verification

Check hierarchy, contrast, color-independent meaning, token use, light/dark
parity, responsive density, 200% zoom, reduced motion, and truthful chart
encodings.

## Primary-owned patterns

- Primary owner: [Live Cursors](library/live-cursors.md)
- Primary owner: [Peak-End Rule](library/peak-end-rule.md)
- Primary owner: [Star Rating](library/star-rating.md)
- Primary owner: [Zeigarnik Effect](library/zeigarnik-effect.md)
- Primary owner: [Serial Position](library/serial-position.md)
- Primary owner: [Landing Page Skeleton](library/landing-page-skeleton.md)
- Primary owner: [Charts That Lie](library/charts-that-lie.md)
- Primary owner: [Design System Kit](library/design-system-kit.md)
- Primary owner: [Golden Ratio](library/golden-ratio.md)
- Primary owner: [Grid System](library/grid-system.md)
- Primary owner: [Proximity Rule](library/proximity-rule.md)
- Primary owner: [Shadow Elevation](library/shadow-elevation.md)
- Primary owner: [Visual Hierarchy](library/visual-hierarchy.md)
- Primary owner: [Gradient Design](library/gradient-design.md)
- Primary owner: [Icon Design Rules](library/icon-design-rules.md)
- Primary owner: [Design Tokens](library/design-tokens.md)
- Primary owner: [Color Accessibility](library/color-accessibility.md)
- Primary owner: [Gestalt Laws](library/gestalt-laws.md)
- Primary owner: [Border Radius](library/border-radius.md)
- Primary owner: [Dark Mode](library/dark-mode.md)
- Primary owner: [Von Restorff Effect](library/von-restorff-effect.md)
- Primary owner: [Perfect Card](library/perfect-card.md)
- Primary owner: [Depth Layers](library/depth-layers.md)
