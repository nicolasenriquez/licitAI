# Eliminate duplicate title IDs

Type: research
Status: resolved
Blocked by: -

## Question

What is the narrow safe seam for unique accessible title IDs when Storybook
freezes time and multiple Twenty title components render together?

## Work

- Confirm the impact of `OverflowingTextWithTooltip` deriving IDs from
  `+new Date()` under mocked time and same-millisecond production rendering.
- Decide whether the prototype can avoid the collision locally or whether the
  shared component should use a stable unique primitive such as React `useId`.
- Keep the fix compatible with existing tooltip and accessible-name behavior.
- Add a focused duplicate-ID regression check.

## Exit evidence

- No duplicate `title-id-*` values in Compra Agil, Licitaciones, or Centro de
  Control semantic snapshots.
- Tooltip/accessibility behavior remains intact in neighboring Twenty stories.

## Answer

Root cause: `OverflowingTextWithTooltip` built every DOM anchor ID from
`+new Date()`. Frozen Storybook time made every instance
`title-id-1710235800000`; same-millisecond production rendering had the same
collision risk. The validation audit demonstrated it across all three
prototype surfaces.

Resolution: the shared primitive now uses React `useId`, retaining the
`title-id-` prefix and removing React's `:` separators for the CSS ID selector
used by `anchorSelect`. No API, tooltip condition, text rendering, or
accessible-name behavior changed.

Regression: `SiblingTooltipsHaveUniqueIds` renders two sibling instances and
asserts distinct `data-testid="tooltip"` IDs. `yarn nx typecheck twenty-ui
--skip-nx-cache`, `yarn nx test twenty-ui --skip-nx-cache`, and `yarn nx
storybook:test:no-coverage twenty-ui --skip-nx-cache` pass (226 Storybook
stories). Cross-surface snapshot revalidation belongs to Validate complete
prototype.

## Comments

### 2026-07-31 — reopened by cross-surface validation

The stated repair is not present in the working tree: the shared component
still creates `title-id-${+new Date()}` and does not import `useId`. The latest
available audit also reports duplicate title IDs. This remains a blocking
accessibility defect, so this ticket is open again and ticket 08 cannot resolve
until the shared repair and its regression check are verified.

### 2026-07-31 — resolved

Shared `useId` repair and sibling-ID Storybook regression check verified.
