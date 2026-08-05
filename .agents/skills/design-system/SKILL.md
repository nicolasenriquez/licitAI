---
name: design-system
description: Use for design-token authoring, theme migration, Figma adapters, visual parity, or shared UI decisions in this repository.
---

# Design System

Use the canonical token seam before editing a theme or introducing a visual
constant.

## Routing

1. Read `docs/design/index.md`.
2. Select the visual register: `product` for `twenty-ui`/`twenty-front`,
   `marketing` for the websites.
3. Search `packages/twenty-design-tokens/src/source/` and existing generated
   adapters before adding a token.
4. Keep component-specific decisions local to the component package.

## Authoring contract

- DTCG-shaped JSON in `packages/twenty-design-tokens/src/source/` is the source
  of truth.
- Use `$value`, `$type`, `$description`, and complete aliases only.
- Preserve product light/dark and marketing light/muted/dark mode parity.
- Run `npx nx run twenty-design-tokens:validate` and `generate` after source
  changes; generated files are not hand-edited.
- A semantic change needs design and frontend review.
- Preserve `--t-*`, `.light`, `.dark`, `themeCssVariables`, and `ThemeProvider`
  until a migration proves public parity.

## Visual acceptance

Check keyboard states, reduced motion, contrast, responsive behavior, and
Storybook/visual snapshots for affected components. Never invent metric values
or use color as the only carrier of meaning.

For detailed vocabulary, deprecation, and Figma guidance, load the references
only when the task needs them:

- `references/decision-guide.md`
- `references/figma.md`
