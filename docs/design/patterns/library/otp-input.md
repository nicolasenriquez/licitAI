---
type: reference
title: OTP Input
description: Pattern-specific guidance for one-time-code entry and resend behavior.
okf_version: "0.1"
---

# OTP Input

`UI-PAT-034` · Primary guide: [Forms and Editing](../forms-and-editing.md)

Posture: `CONTEXTUAL`

## Use when

An authentication flow requires a one-time code.

## Do not apply when

Separate boxes would break paste, autofill, screen-reader meaning, or the
identity provider's code model.

## Repository interpretation

Represent one logical value. Support paste, autofill, clear errors, resend
status, expiry, keyboard navigation, and recovery.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/otp-input) · [Official references](../sources/official-references.md)
