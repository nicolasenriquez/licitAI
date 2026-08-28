---
type: design-guide
title: Motion
description: Guidance for product transitions, timing, easing, hover polish, and reduced motion.
okf_version: "0.1"
---

# Motion

Use this guide when motion materially improves orientation, feedback, or task
continuity.

## Applies when

- a transition explains a state or spatial relationship;
- existing repository motion behavior needs extension;
- progressive enhancement can improve comprehension without blocking use.

## Do not apply when

- motion is decorative, distracting, or required to discover an action;
- parallax, bounce, glow, or scale would compete with dense product content;
- reduced-motion behavior is not defined.

## Guidance

- Follow existing Twenty motion tokens and component behavior. External timing
  and easing values are heuristics, not repository requirements.
- Prefer short, purposeful transitions. Do not animate every property.
- Respect `prefers-reduced-motion` and keep the interaction fully usable without
  animation.
- Never make a critical action hover-only. Hover may enhance secondary detail.
- Treat scroll-driven effects as progressive enhancement, not product baseline.

## Verification

Check motion-on, reduced-motion, keyboard and pointer operation, interruption,
focus visibility, performance, and dense-surface readability.

## Primary-owned patterns

- Primary owner: [Animation Timing](library/animation-timing.md)
- Primary owner: [Easing Curves](library/easing-curves.md)
- Primary owner: [Card Hover Anatomy](library/card-hover-anatomy.md)
- Primary owner: [Scroll-Driven Animations](library/scroll-driven-animations.md)
