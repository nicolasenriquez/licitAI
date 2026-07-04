---
type: design-guide
title: "Wireframe Playbook"
description: "Design guidance for Wireframe Playbook."
okf_version: "0.1"
---
# Wireframe Playbook

## Purpose
Provide a low-fidelity wireframe grammar that defines the canonical UI patterns of the Twenty CRM. Used by AI agents and engineers to design new screens and features consistently.

## Primary Audience
Frontend engineers, AI agents, and reviewers designing or implementing product surfaces.

## Executive Summary
Twenty's product UI follows a consistent shell-based layout: sidebar navigation, top bar, main content area, and a right-side record panel. Views (table, kanban, calendar) are the primary interaction surface for object records. The command menu provides keyboard-driven navigation. This playbook defines the canonical page zones and screen templates.

## When To Use This Playbook

- Before implementing a new view type or screen.
- When designing a new feature that adds UI surfaces.
- When an AI agent needs a stable frontend vocabulary before writing code.
- When evaluating whether a UI pattern fits Twenty's interaction model.

## Wireframe Fidelity Level

| Attribute | Rule |
| --- | --- |
| Fidelity | Low to mid fidelity. Zones and behavior, not pixel-perfect. |
| Color | Grayscale plus annotation. |
| Typography | Simple hierarchy labels. |
| Detail | Enough to validate layout, information priority, and action placement. |
| Goal | Decide interaction contracts, not visual polish. |

## Canonical Page Zones

Every Twenty screen uses these zones:

1. **App Shell** — Sidebar navigation + top bar. Always visible.
2. **Object/View Header** — Object name, active view selector, record count, actions.
3. **View Toolbar** — Search, filters, sort, fields visibility, density, view type switch.
4. **Results Canvas** — The main data display: table, kanban, or calendar.
5. **Record Panel** — Right-side panel showing selected record detail. Resizable.
6. **Record Full Page** — Dedicated page for deep record inspection. Reached from panel.
7. **Command Menu** — Cmd+K / Ctrl+K overlay. Search, navigate, execute actions.

## Core Screen Templates

### Template A: Object List View (Table)

Primary view for exploring object records.

| Zone | Content |
| --- | --- |
| Object/View header | Object name + icon, active view name, record count, "Add record" button |
| View toolbar | Search bar, quick filters (status, owner, date), sort selector, fields visibility toggle, density toggle (compact/comfortable), view type switch (table/kanban/calendar) |
| Results canvas | Table with dynamic columns from view configuration. Click row → opens record panel. Inline edit on double-click. Checkbox for multi-select. |
| Record panel | Selected record summary, key fields, tabs (timeline, related records), actions (edit, delete, follow). Close button returns to table. |

Default behavior:
- Table columns are defined by the view's field configuration.
- Filters are saved per view and persist across sessions.
- The record panel opens on the right side without closing the table.
- Scroll position, filters, and sort are preserved when inspecting records.

### Template B: Kanban View

Column-based view for pipeline and stage tracking.

| Zone | Content |
| --- | --- |
| View toolbar | Same as table view. View type switch to kanban. |
| Results canvas | Columns representing stages/categories. Cards within columns showing record key fields. Drag-and-drop between columns. Column headers show aggregate (count, sum, avg). |
| Record panel | Same as table view. Opens on card click. |

Default behavior:
- Columns are defined by a SELECT or RELATION field on the object.
- Card fields are configurable per view.
- Drag-and-drop triggers a field update on the record.
- Kanban aggregate operation (count/sum/avg) is configurable per view.

### Template C: Calendar View

Date-based view for scheduling and timeline tracking.

| Zone | Content |
| --- | --- |
| View toolbar | Same as table view. View type switch to calendar. |
| Results canvas | Calendar grid (month/week/day). Events/records placed by date field. Click event → record panel. |
| Record panel | Same as table view. |

Default behavior:
- Date field is configurable per view.
- Calendar layout (month/week) is configurable.
- Events can be dragged to reschedule.

### Template D: Record Panel

Right-side panel for inspecting a selected record.

| Zone | Content |
| --- | --- |
| Panel header | Record label (from label identifier field), close button, actions (edit, delete, follow) |
| Summary fields | Configurable set of key fields shown at top |
| Tabs | Timeline (emails, notes, calls, system events). Related records tab. Custom tabs from page layout. |
| Panel footer | Quick actions: email, note, task, meeting |

Default behavior:
- Panel width is resizable.
- Opening a different record replaces the current panel content.
- "Open full page" action navigates to the dedicated record page.
- Panel state (open/closed, width) is preserved per view.

### Template E: Record Full Page

Dedicated page for deep record inspection.

| Zone | Content |
| --- | --- |
| Page header | Object icon + record label, back button, actions |
| Page layout | Tabs and widgets defined by the object's page layout configuration |
| Widgets | Front components from apps, related records lists, custom charts |

Default behavior:
- Reached by clicking "Open full page" from the record panel.
- Page layout tabs and widgets are configurable via metadata.
- Apps can inject custom widgets via `definePageLayout()` and `defineFrontComponent()`.

### Template F: Settings & Workspace Admin

Configuration pages for workspace settings.

| Zone | Content |
| --- | --- |
| Settings sidebar | Navigation: Workspace, Members, Roles, Data Model, Security, Workflows, Applications, Billing, Developer |
| Settings content | Form-based configuration. Save per section. |
| Data Model | List of objects → click → fields list → edit field → save. Add object/field. |
| Roles | List of roles → click → permission flags → save. |

## Command Menu

Activated by Cmd+K (Mac) or Ctrl+K (Windows/Linux).

| Feature | Behavior |
| --- | --- |
| Navigation | Type object name → navigate to object list view. Type record name → open record page. |
| Actions | Create new record, open settings, switch workspace. |
| Search | Full-text search across objects. Results grouped by object type. |
| AI Assistant | Natural language queries. "Show all deals closing this week." |

## Interaction Rules

1. **Props down, events up.** Parent components pass data via props. Children emit changes via callbacks.
2. **Event handlers over `useEffect`.** State updates from user actions use `onClick`, `onChange`, etc.
3. **Functional state updates.** `setState(prev => prev + 1)`, not `setState(value)`.
4. **Record panel first.** Default inspection opens in the right panel. Full page is for deep review.
5. **Preserve context.** Filters, sort, scroll position persist when inspecting records.
6. **Keyboard navigable.** Tab through interactive elements. Enter to select. Escape to close panel/menu.
7. **Loading → Empty → Error → Data.** Every data surface must handle all four states.

## Current Assumptions

- The app shell (sidebar + topbar) is always visible and does not change.
- Views are the primary interaction surface for object records.
- The record panel model (right side, resizable) is the default inspection pattern.
- The command menu is always available via keyboard shortcut.
- All new screens follow the canonical page zones defined here.

## Open Decisions

- Should the record panel be detachable/pop-out?
- Should there be a dark mode for the product UI?
- Should the calendar view support drag-to-create events?
- Should the command menu support custom actions defined by apps?
