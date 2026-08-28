---
type: reference
title: File Upload UX
description: Pattern-specific guidance for upload progress, failure, cancellation, and retry.
okf_version: "0.1"
---

# File Upload UX

`UI-PAT-032` · Primary guide: [Forms and Editing](../forms-and-editing.md)

Posture: `REQUIRED_WHEN_UPLOAD_EXISTS`

## Use when

Users upload files and need to understand file-level progress and outcome.

## Do not apply when

The UI cannot expose the actual upload lifecycle or a retry/cancellation path.

## Repository interpretation

Show progress when known, pending, success, failure, retry, cancellation, file
constraints, and accessible status. Do not claim completion before server truth.

## Source

[DesignMotionHQ](https://www.designmotionhq.com/patterns/file-upload-ux) · [Official references](../sources/official-references.md)
