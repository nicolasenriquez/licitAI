---
name: Twenty Website
description: Editorial marketing system for Twenty's open-source CRM.
colors:
  paper: "#ffffff"
  muted-surface: "#f4f4f4"
  ink: "#1c1c1c"
  ink-hover: "#333333"
  blue-signal: "#4a38f5"
  blue-signal-muted: "#8174f8"
  pink-signal: "#ed87fc"
  yellow-signal: "#feffb7"
  green-signal: "#89fc9a"
typography:
  display:
    fontFamily: "var(--font-serif), serif"
    fontSize: "5rem"
    fontWeight: 300
    lineHeight: 1.075
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-serif), serif"
    fontSize: "3.75rem"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-serif), serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.17
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-sans), sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "var(--font-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.08em"
rounded:
  base: "2px"
  control: "4px"
  popover: "6px"
  chip: "16px"
spacing:
  base: "4px"
  tight: "8px"
  standard: "16px"
  control: "20px"
  card: "24px"
  section: "40px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  card-editorial:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "20px 24px"
  field-dark:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "clamp(40px, 5.5vh, 56px)"
  navigation-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0"
  chip-active:
    backgroundColor: "rgba(74, 56, 245, 0.18)"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
---

# Design System: Twenty Website

## Overview

**Creative North Star: "The Editorial Instrument"**

Twenty Website treats marketing as considered publishing with functional
product mechanics. Paper and ink establish calm, readable hierarchy; a serif
display face carries editorial conviction while a sans face explains and a mono
face operates. The system is deliberately sparse, yet never passive: controls
move with clear direction when a visitor expresses intent.

Surfaces stay flat and legible at rest. Borders do quiet structural work, then
hover, focus, opening, and selection introduce only enough movement or lift to
clarify a change of state. Accent color is signal, not decoration. The result
should feel precise and founder-led rather than generic SaaS or corporate
enterprise.

**Key Characteristics:**

- Editorial type contrast over decorative chrome.
- Ink, paper, and rare color signals.
- Asymmetrical details within restrained geometry.
- Flat-at-rest surfaces with directional interaction feedback.

## Colors

The palette is a paper-and-ink publishing system with four bright signals used
to locate action, state, or a discrete product moment.

### Primary

- **Editorial Ink:** `{colors.ink}`. Primary reading color, filled action
  surface, and highest-emphasis mark.
- **Pressed Ink:** `{colors.ink-hover}`. Hover fill for ink actions and dark
  surface shifts.

### Secondary

- **Electric Blue Signal:** `{colors.blue-signal}`. Focus rings, active
  navigation, and selected interaction states.
- **Soft Blue Signal:** `{colors.blue-signal-muted}`. Lower-emphasis blue
  states and supporting visual treatment.

### Tertiary

- **Pink Signal:** `{colors.pink-signal}`. Available for contained,
  product-specific emphasis.
- **Yellow Signal:** `{colors.yellow-signal}`. Available for contained,
  product-specific emphasis.
- **Green Signal:** `{colors.green-signal}`. Available for contained,
  product-specific emphasis.

### Neutral

- **Paper:** `{colors.paper}`. Default page, card, popup, and reversed-text
  surface.
- **Quiet Surface:** `{colors.muted-surface}`. Secondary backgrounds and
  restrained separation.

**The Rare Signal Rule.** Ink and paper carry ordinary hierarchy. Use a bright
signal to express focus, selection, or an intentional product moment, never as
ambient decoration across a screen.

## Typography

**Display Font:** Aleo via `var(--font-serif)`, with serif fallback.
**Body Font:** Host Grotesk via `var(--font-sans)`, with sans-serif fallback.
**Label/Mono Font:** Azeret Mono via `var(--font-mono)`, with monospace
fallback.

**Character:** The serif face gives large statements a composed editorial
voice. Host Grotesk keeps explanatory copy direct. Azeret Mono turns utilities,
navigation, and actions into precise instruments rather than generic controls.

### Hierarchy

- **Display** (`300`, `5rem` desktop / `3.75rem` mobile, `1.075`): page-scale
  statements and high-conviction headlines.
- **Headline** (`300`, `3.75rem` desktop / `2.5rem` mobile, `1.1`): section
  titles and prominent stories.
- **Title** (`400`, `3rem` desktop, `1.17`): component and mid-scale content
  hierarchy; card titles often step down to `1.5rem`.
- **Body** (`400`, `1.125rem` desktop / `1rem` mobile, `1.55`): explanatory
  prose. Keep reading measures within the implemented `720px` to `800px`
  range.
- **Label** (`500`, `0.75rem`, `0.08em`, uppercase when operative): navigation,
  action labels, categories, and metadata.

**The Three-Voice Rule.** Use serif for conviction, sans for explanation, and
mono for operation. Do not use weight alone to replace these roles.

## Layout

The outer container centers content at a maximum of `1440px`. Reading measures
are deliberate: `720px` narrow, `800px` wide, and `921px` editorial. The base
spacing unit is `4px`; repeated intervals grow through `8px`, `16px`, `20px`,
`24px`, and `40px` rather than arbitrary gaps.

Mobile is the default composition. At `921px`, headings grow, desktop
navigation appears, and selected cards shift into horizontal composition. At
`1281px`, navigation receives wider internal padding. Keep mobile controls at
least `40px` high; forms use `clamp(40px, 5.5vh, 56px)`.

## Elevation & Depth

The system is flat at rest. Hairline borders and tonal surfaces define most
edges. Depth appears only to clarify interaction, stacking, or an open overlay.

### Shadow Vocabulary

- **Interactive Card Lift** (`0 12px 32px -16px rgba(0, 0, 0, 0.18)`): card
  hover only, paired with a `-2px` lift.
- **Navigation Settle** (`0 1px 3px 0 rgba(0, 0, 0, 0.06)`): sticky navigation
  once scrolling establishes separation.
- **Popup Stack** (`0 1px 1px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.06), 0 24px 64px rgba(0, 0, 0, 0.04)`): floating navigation content.

**The Intent-Only Lift Rule.** Never pre-elevate ordinary surfaces. Add shadow
or movement only when state, hierarchy, or interaction needs explaining.

## Shapes

Corners are restrained: `2px` base radius, `4px` for controls and cards, and
`6px` for popovers. Chips can extend to `16px` when grouping small, removable
items. Borders stay at `1px` with low-contrast ink or paper alpha.

The signature silhouette is the tapered wipe button: a softly rounded left cap
and asymmetric right edge hold a directional fill animation. Preserve this
asymmetry for primary actions; do not replace it with generic soft pills.

## Components

### Buttons

**Character:** Compact mono instruments with a material, directional response.

- **Shape:** `40px` regular and `32px` small height; `4px` control radius with
  the signature tapered right cap.
- **Primary:** Ink fill with paper text on light surfaces; `20px` horizontal
  padding; mono uppercase label.
- **Hover / Focus:** A fill travels left-to-right over `260ms`
  `cubic-bezier(0.22, 1, 0.36, 1)`; label color changes over `220ms`; focus is
  a `1px` blue-signal outline with `1px` offset.
- **Secondary / Outline:** Transparent field with a `1px` stroke. The same
  directional fill provides response without adding ambient shadow.

### Chips

- **Style:** Small removable tags use a blue-tinted selected fill, white text,
  and `16px` radius.
- **State:** Active options use stronger blue transparency; suggestion actions
  use a dashed low-contrast border rather than a filled pill.

### Cards / Containers

- **Corner Style:** Restrained `4px` radius.
- **Background:** Paper surface over page background.
- **Shadow Strategy:** Flat at rest; use Interactive Card Lift only on hover.
- **Border:** `1px` low-alpha ink, deepening one step on hover.
- **Internal Padding:** Common editorial card content uses `20px 24px`.

### Inputs / Fields

- **Style:** Transparent field, `1px` low-alpha paper or ink stroke, `4px`
  radius, and `40px` to `56px` control height.
- **Focus:** Border shifts to blue signal; controls suppress browser outline
  only when that visible replacement is present.
- **Error / Disabled:** Error states use the implemented pale-red border;
  placeholders and inactive values reduce text contrast through existing alpha
  tokens, never opacity on the whole control.

### Navigation

- **Style:** Sticky, compact, and centered in the outer container. Desktop nav
  uses mono uppercase labels with `32px` column gaps; mobile collapses into a
  `40px` icon control and drawer.
- **States:** Active and hover states use blue signal; active routes add a
  narrow `2px` underline. A translucent blur and faint shadow appear only once
  scrolling needs separation.

### Tapered Wipe Button

The system's signature control uses segmented SVG geometry: a rounded left cap,
stretchable center, and tapered right cap. Keep its fill transition directional
and honor `prefers-reduced-motion` by removing the sweep.

## Do's and Don'ts

### Do:

- **Do** establish hierarchy through serif, sans, and mono roles before adding
  color or extra containers.
- **Do** build rhythm from the `4px` spacing unit and shift responsive
  composition at the implemented `921px` and `1281px` breakpoints.
- **Do** use blue signal for focus, selection, and active navigation states.
- **Do** keep controls and mobile hit areas at least `40px` high or wide.
- **Do** remove nonessential motion under `prefers-reduced-motion`.

### Don't:

- **Don't** use bright accents as default page backgrounds or decorative wash.
- **Don't** apply persistent card shadows; surfaces earn lift through intent.
- **Don't** replace tapered primary actions with generic soft-pill buttons.
- **Don't** use rounded, border-heavy containers to manufacture hierarchy that
  typography and spacing should establish.
