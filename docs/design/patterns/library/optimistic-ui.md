---
type: reference
title: Optimistic UI
description: Pattern-specific guidance for showing a safe reversible mutation before server confirmation.
okf_version: "0.1"
---

# Optimistic UI

`UI-PAT-042` · Primary guide: [Feedback and Recovery](../feedback-and-recovery.md)

Posture: `CONTEXTUAL`

## Use when

The mutation is low-risk, reversible, and has deterministic rollback and server
reconciliation.

## Do not apply when

The operation is destructive, permission-sensitive, non-idempotent, or likely to
leave the user with a false durable state.

## Repository interpretation

Keep pending, rollback, server error, and reconciliation visible. Use the
existing Apollo and Jotai conventions.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/optimistic-ui) · [Official references](../sources/official-references.md)
