---
type: design-governance
title: "Design Token Governance"
description: "Canonical vocabulary and boundaries for design-token authoring."
okf_version: "0.1"
---
# Design Token Governance

## Vocabulary

| Term | Meaning |
| --- | --- |
| Primitive token | A value without a visual role, such as a color, dimension, duration, or z-index. |
| Semantic token | A named visual intention inside one register, such as `background.primary` or `font.color.secondary`. |
| Visual register | A governed token namespace for a surface: `product` or `marketing`. |
| Mode | A complete state of one register, such as product `light`/`dark` or marketing `light`/`muted`/`dark`. |
| Generated adapter | CSS, TypeScript, Figma, or compatibility output produced by the token compiler. |
| Deprecation alias | A compatibility name retained while callers migrate to a replacement token. |

## Hierarchy

```text
primitives → register/common → register/mode → component-local tokens
```

Primitives may be shared. Semantic records are separate for product and
marketing. Component tokens are local and should hide a stable shared decision,
not every individual CSS property.

## Registers and modes

- Product: `common`, `light`, `dark`.
- Marketing: `common`, `light`, `muted`, `dark`.
- Every mode must expose the same semantic paths as its sibling modes.
- A mode may change a value, but not silently add or remove a semantic role.

## Ownership

- Design owns visual intent, naming, mode meaning, and Figma mapping.
- Frontend owns runtime compatibility, generated consumption, and component
  integration.
- A semantic token change requires both design and frontend approval.
