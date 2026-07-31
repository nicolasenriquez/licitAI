# Validate the complete prototype

Type: research
Status: resolved
Blocked by: 05, 06, 07, 11, 12, 13, 14

## Question

Does the combined prototype meet the repository's visual, interaction,
accessibility, theme, and no-fake-data contracts?

## Work

- Review all three views together inside the authentic workspace shell.
- Test desktop/mobile, light/dark, keyboard only, screen-reader semantics, focus
  return, 200% zoom, reduced motion, loading, empty, error, and partial data.
- Compare spacing, typography, borders, density, and feedback with canonical
  neighboring Twenty surfaces and stories.
- Obtain user acceptance on hierarchy and information priority.
- Record failures as child follow-up tickets rather than hiding them in prose.

## Exit evidence

- Validation checklist with screenshots and defects.
- User decision accepting or rejecting the prototype.
- No unresolved critical accessibility or data-truth defect.

## Answer

Fresh local Playwright replay validates 25 screenshots, 17 semantic snapshots,
desktop/mobile light and dark surfaces, 200% reflow, keyboard interactions, and
reduced motion. All 20 audited DOM snapshots have no duplicate IDs; no document
overflow, normal-text contrast failure, or page error remains. The four prior
follow-ups are resolved, and the user accepted hierarchy and information
priority. The prototype passes this non-production validation gate.

## Comments

### 2026-07-31 — local Playwright audit checkpoint

The modules-scoped Storybook prototype was captured and inspected through a
user-authorized local Playwright runner. The complete current-run report and 25
accepted screenshots are linked at
[Cross-surface prototype audit](../artifacts/08-validation/audit-report.md).

The core hierarchy and no-fake-data language are strong, keyboard interactions
work, and Compra Agil/Licitaciones contain their mobile and 200% reflow. Four
blocking defects were promoted into child tickets: truthful browse detail during
unavailable states, accessible text contrast, Control Center responsive
containment, and unique title IDs. Human acceptance remained pending at this
checkpoint, so the ticket stayed claimed and unresolved.

### 2026-07-31 — hierarchy accepted

The user accepted the prototype's hierarchy and information priority as the
direction to preserve. This satisfies the human-decision portion of the exit
evidence. The ticket remains claimed and unresolved only because the four
blocking defects in tickets 11–14 must still be corrected and revalidated.

### 2026-07-31 — final gate blocked by unresolved duplicate IDs

Source inspection found `OverflowingTextWithTooltip` still derives its anchor
ID from `+new Date()`; it has neither the documented normalized React `useId`
repair nor its multi-instance regression check. The latest audit evidence also
contains `title-id-1710235800000` duplicates. Ticket 14 was reopened. Ticket
08 remains claimed and blocked; the four other child fixes remain evidenced,
but the prototype cannot be accepted while this shared accessibility defect is
present.

### 2026-07-31 — resolved after fresh cross-surface replay

The audit was rerun against the modules-scoped Storybook server after all four
follow-ups. Results: 25 screenshots, 17 ARIA snapshots, 20 empty
`duplicateIds` arrays, zero document-overflow findings, zero normal-text
contrast findings below 4.5:1, and zero page errors. Desktop, mobile, light,
dark, keyboard, 200% reflow, and reduced-motion checks pass. See
[Cross-surface prototype audit](../artifacts/08-validation/audit-report.md)
and `results.json`.
