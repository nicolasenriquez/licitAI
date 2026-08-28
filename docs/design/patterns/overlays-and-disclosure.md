---
type: design-guide
title: Overlays and Disclosure
description: Guidance for dialogs, drawers, menus, tooltips, popovers, and secondary detail.
okf_version: "0.1"
---

# Overlays and Disclosure

Use this guide when content or actions appear above, beside, or behind the
current surface.

## Applies when

- secondary detail should be available without losing the current context;
- a task needs a menu, dialog, drawer, popover, or disclosure;
- layering and focus behavior are part of the interaction.

## Do not apply when

- a tooltip would hide required instructions or actions;
- hover or swipe is the only access path;
- a new overlay would duplicate an existing Twenty primitive or route.

## Guidance

- Choose the least disruptive surface that fits the task. Use a modal for an
  interrupting decision, a side panel for contextual detail, and disclosure for
  secondary content.
- Dialog focus must enter the dialog, remain appropriately contained, close with
  the supported controls, and return to the invoking element.
- Menus and tooltips must work from keyboard focus, not only pointer hover.
- Provide touch and keyboard equivalents for pointer-specific affordances.
- Reuse `twenty-ui` primitives and respect existing stacking contexts. Do not
  solve layering with arbitrary extreme z-index values.

## Mercado Público

Use the existing side-panel detail model. Preserve the list, selected process,
URL state, and focus return. Do not add a parallel full-detail route.

## Verification

Check open, close, Escape, focus entry, focus return, outside interaction,
keyboard menu behavior, tooltip focus behavior, mobile behavior, and stacking.
Cross-check the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Primary-owned patterns

- Primary owner: [Hover Trap](library/hover-trap.md)
- Primary owner: [Context Menu](library/context-menu.md)
- Primary owner: [Dropdown Design](library/dropdown-design.md)
- Primary owner: [Tooltip Design](library/tooltip-design.md)
- Primary owner: [Swipe Actions](library/swipe-actions.md)
- Primary owner: [Bottom Sheets](library/bottom-sheets.md)
- Primary owner: [Accordion Disclosure](library/accordion-disclosure.md)
- Primary owner: [Modal Hierarchy](library/modal-hierarchy.md)
- Primary owner: [Z-Index Mastery](library/z-index-mastery.md)
