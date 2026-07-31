# Meet accessible text contrast in both themes

Type: task
Status: resolved
Blocked by: -

## Question

What is the smallest Twenty-native color treatment that makes prototype text
readable in light and dark themes without adding tokens or a parallel system?

## Work

- Give `StyledSourceList` an explicit theme text color; its dark-mode list items
  currently render black at 1.17:1.
- Review input labels, table headers, definition terms, and supporting copy that
  currently measure below 4.5:1 for normal text.
- Prefer an existing stronger Twenty semantic color in the domain composition.
  Do not change global tokens unless current-run evidence proves the issue and
  the broader blast radius is intentionally accepted.
- Re-capture Compra Agil, Licitaciones, and Centro de Control in both themes.

## Exit evidence

- All non-disabled normal text used by the prototype measures at least 4.5:1.
- Status meaning is not color-only.
- Light/dark screenshots retain the native Twenty hierarchy.

## Answer

Reused `themeCssVariables.font.color.secondary` inside the two prototype
stories. The scoped treatment covers supporting copy, browse filter labels,
table headers, definition terms, formula notes, and `StyledSourceList`; the
last now has an explicit semantic text color rather than inheriting browser
black in dark mode. No token, dependency, or generic component was added.

Status still has readable text labels, so its meaning is not color-only.
Disabled controls are excluded from the normal-text requirement in the local
audit.

Re-captured with the modules-scoped Storybook runner. Every one of the 17
light/dark state captures and the three 200% zoom captures reports
`contrastBelow45: []`, no document overflow, and no page or console errors in
[`results.json`](../artifacts/08-validation/results.json). Updated screenshots
include Compra Agil and Licitaciones in dark mode (`07`, `08`) and Centro de
Control in dark mode (`09`).
