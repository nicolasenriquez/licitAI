---
type: design-adapter
title: "Figma Adapter"
description: "Operating contract for exporting the canonical token source to Figma."
okf_version: "0.1"
---
# Figma Adapter

Figma consumes the generated bundles under
`packages/twenty-design-tokens/generated/figma/`. It is an adapter and review
surface, not an authority parallel to Git.

## Collections

- `Global Primitives` — one mode.
- `Product Semantic` — `Light`, `Dark`.
- `Marketing Semantic` — `Light`, `Muted`, `Dark`.

Map colors and dimensions to Variables. Map typography and shadows to the
corresponding Figma styles or Tokens Studio representations. Keep aliases and
descriptions intact in the import bundle.

Git Sync, if adopted later, must use a branch and pull request. Bidirectional
automatic sync and a custom Figma plugin are explicitly out of scope for this
phase.
