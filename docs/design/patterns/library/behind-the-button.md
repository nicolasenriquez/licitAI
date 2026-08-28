---
type: reference
title: Behind the Button
description: Pattern-specific guidance for the complete lifecycle behind an action control.
okf_version: "0.1"
---

# Behind the Button

`UI-PAT-004` · Primary guide: [Feedback and Recovery](../feedback-and-recovery.md)

Posture: `REQUIRED`

## Use when

An action starts validation, a request, or a server mutation.

## Do not apply when

The control has no real lifecycle or when a spinner is being used to conceal an
undefined state model.

## Repository interpretation

Cover validation, pending, server truth, failure, duplicate submission, and
recovery. Keep the implementation in existing Twenty data and state patterns.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/behind-the-button) · [Official references](../sources/official-references.md)
