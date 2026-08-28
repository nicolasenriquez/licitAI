---
type: design-guide
title: Navigation
description: Guidance for navigation context, tabs, command menus, focus, and pagination.
okf_version: "0.1"
---

# Navigation

Use this guide when users move between product surfaces, switch views, or need
to understand where they are.

## Applies when

- a route, tab, command menu, or pagination control changes visible context;
- the user must preserve or restore a meaningful view state;
- focus and orientation are part of the task.

## Do not apply when

- a new route duplicates an existing shell or detail surface;
- tabs hide unrelated workflows that need separate navigation;
- navigation state cannot be restored or communicated.

## Guidance

- Follow the existing Twenty shell, routing, and navigation primitives.
- Keep the current task context visible and preserve URL state when required.
- Use semantic tabs with the expected keyboard behavior. Do not use tabs as
  decoration.
- Make focus visible and return it predictably after menus, dialogs, and panels.
- Align any command palette with Twenty's existing command menu.
- Treat pagination as stateful navigation. Preserve filters, ordering, and
  cursor rules required by the feature.

## Verification

Check current-location communication, keyboard traversal, tab activation,
command-menu focus, direct URL restoration, pagination, narrow layout, and
focus return.

## Primary-owned patterns

- Primary owner: [Command Palette](library/command-palette.md)
- Primary owner: [Navigation Patterns](library/navigation-patterns.md)
- Primary owner: [Tabs System](library/tabs-system.md)
- Primary owner: [Focus States](library/focus-states.md)
