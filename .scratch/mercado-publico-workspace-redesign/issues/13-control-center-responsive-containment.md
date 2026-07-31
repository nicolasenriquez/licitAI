# Contain Control Center at mobile and 200% zoom

Type: task
Status: resolved
Blocked by: -

## Question

How should Control Center keep its dense tables locally scrollable without
expanding the document at mobile width or 200% zoom?

## Work

- Constrain table wrappers and their flex/grid ancestors with the smallest
  `min-width: 0`, `max-width`, or `width` adjustment supported by evidence.
- Keep table minimum width and local horizontal scrolling; do not collapse
  factual columns into invented summaries.
- Re-test 390px mobile and the 720 CSS-pixel/device-scale-2 zoom proxy.
- Verify headers, investigation controls, pagination, and integrity stay inside
  the document viewport.

## Exit evidence

- Document `scrollWidth` equals `clientWidth` at 390px and the 200% proxy.
- Each dense table remains independently keyboard- and pointer-scrollable.
- Desktop density and continuous reading order remain unchanged.

## Answer

Root cause: the isolated prototype kept `overflow-x: auto` on its table
wrappers but did not bound the prototype and wrappers to their available inline
size. The `min-width: 720px` tables therefore expanded the document instead of
their own scrollers.

Reuse the existing production Control Center containment seam; no component,
token, or responsive column reduction is needed:

- `StyledPrototype`: `max-width: min(1180px, 100%)`, `min-width: 0`, and
  `width: 100%`.
- `StyledTableWrap`: `max-width: 100%` and `min-width: 0`, retaining its
  720px table minimum width and `overflow-x: auto`.
- Each dense table wrapper is a labelled, focusable `role="region"`, so its
  local horizontal scroller is reachable with keyboard and pointer.

Live local Storybook/Playwright evidence after the change:

- 390px: document `clientWidth=390`, `scrollWidth=390`; each of the three
  dense tables has `scrollWidth=720`, `clientWidth=248`, and is locally
  scrollable/focusable.
- 720 CSS-pixel viewport at device-scale-factor 2: document
  `clientWidth=720`, `scrollWidth=720`; each dense table has
  `scrollWidth=720`, `clientWidth=578`, and is locally scrollable/focusable.
- `yarn nx typecheck twenty-front` passes.

The untouched full audit still awaits tickets 11, 12, and 14; this resolves
only Control Center containment.
