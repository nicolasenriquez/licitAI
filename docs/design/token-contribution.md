---
type: design-process
title: "Design Token Contribution"
description: "Workflow for adding, changing, renaming, and deprecating tokens."
okf_version: "0.1"
---
# Design Token Contribution

1. Search the canonical source and existing adapters before adding a token.
2. Choose `primitives`, `product`, or `marketing`; do not put semantic roles
   in primitives.
3. Add `$type`, `$value`, and a short `$description`. Prefer a complete alias
   over repeating the same primitive value.
4. Keep sibling mode paths in parity.
5. Run `npx nx run twenty-design-tokens:validate` and
   `npx nx run twenty-design-tokens:generate`.
6. Review generated CSS/TypeScript/Figma output and visual snapshots.
7. Obtain design and frontend approval for semantic changes.

## Compatibility

The public `twenty-ui` theme surface remains stable during migration. A rename
must add a deprecation alias, update the changelog/migration note, and retain
the old generated name until the next major version.

## Prohibited authoring surfaces

- Generated files under `packages/twenty-design-tokens/generated/`.
- Figma variables as a code authority.
- New global colors, spacing, radius, shadow, or motion values hardcoded in
  component styles.
