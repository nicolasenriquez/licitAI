---
type: design-guide
title: Feedback and Recovery
description: Guidance for loading, empty, error, notification, mutation, and recovery states.
okf_version: "0.1"
---

# Feedback and Recovery

Use this guide when the system is loading, changing, unavailable, or needs to
tell the user what happened.

## Applies when

- a request or mutation has a visible lifecycle;
- the user needs confirmation, failure detail, or recovery;
- content can be empty, unavailable, or filtered to zero results.

## Do not apply when

- a spinner would hide a known stable content shape;
- a toast is being used for information that must persist;
- optimistic UI would make an unsafe or irreversible mutation appear complete.

## Guidance

- Model loading, data, empty, filtered-empty, unavailable, error, pending, and
  recovery states as distinct states.
- Match the feedback surface to scope and severity. Use programmatic status or
  alert semantics where appropriate.
- Preserve context during retry and recovery.
- Use skeletons only when the content shape is known. Use progress when actual
  progress exists.
- Use optimistic UI only for low-risk, reversible mutations with deterministic
  rollback and server reconciliation.
- Keep important information in a durable surface, not only a transient toast.

## Mercado Público

Failures must appear in the alert region with retry in place. Preserve URL
state. Distinguish `0` from unavailable data and use the feature contract's
approved unavailable-value language. Never invent metrics or recommendations.

## Verification

Check loading, stable data, empty, filtered-empty, error, retry, pending,
success, rollback, announcements, focus, and context preservation.

## Primary-owned patterns

- Primary owner: [Behind the Button](library/behind-the-button.md)
- Primary owner: [Doherty Threshold](library/doherty-threshold.md)
- Primary owner: [Error States](library/error-states.md)
- Primary owner: [Loading States System](library/loading-states-system.md)
- Primary owner: [Notification System](library/notification-system.md)
- Primary owner: [Toast Notifications](library/toast-notifications.md)
- Primary owner: [Optimistic UI](library/optimistic-ui.md)
- Primary owner: [Skeleton Loading](library/skeleton-loading.md)
- Primary owner: [Empty States](library/empty-states.md)
- Primary owner: [Microcopy](library/microcopy.md)
