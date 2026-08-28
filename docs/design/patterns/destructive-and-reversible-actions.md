---
type: design-guide
title: Destructive and Reversible Actions
description: Guidance for mutation risk, destructive actions, confirmation, undo, and rollback.
okf_version: "0.1"
---

# Destructive and Reversible Actions

Use this guide when an action can delete, archive, overwrite, publish, or
otherwise cause material loss or change.

## Applies when

- an action changes durable server state;
- the consequence is destructive, difficult to reverse, or broad in scope;
- the product can truthfully support undo or rollback.

## Do not apply when

- a confirmation only adds friction to a safe, reversible action;
- the backend cannot guarantee the promised reversal;
- the UI would simulate success before server truth is known.

## Guidance

- Classify risk, scope, reversibility, and user expectation before choosing
  confirmation, undo, pending, or optimistic behavior.
- State what will change and the affected scope. Do not hide consequences in a
  tooltip or hover-only menu.
- Confirm high-risk or irreversible actions at the right point. Do not confirm
  every low-risk action by habit.
- Offer undo only when the backend and domain model make reversal reliable.
- On failure, restore truthful state and provide a clear recovery path.

## Verification

Check action scope, confirmation copy, keyboard access, pending state, server
failure, rollback or undo expiry, duplicate submission, and recovery.

## Primary-owned patterns

- Primary owner: [Destructive Actions](library/destructive-actions.md)
- Primary owner: [Undo UX](library/undo-ux.md)
