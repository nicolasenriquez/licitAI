---
type: design-guide
title: Forms and Editing
description: Guidance for fields, validation, editing, uploads, and specialized form controls.
okf_version: "0.1"
---

# Forms and Editing

Use this guide when users enter, change, validate, or save structured values.

## Applies when

- a user supplies or edits a value;
- validation, pending, saved, or failure state affects the task;
- a specialized control represents a real domain need.

## Do not apply when

- a visual control has no domain behavior to support;
- a wizard only splits a simple form without real dependency;
- autosave, masking, or drag-and-drop would hide state or damage recovery.

## Guidance

- Define field states before styling: default, focus, invalid, disabled,
  pending, saved, and recovery as applicable.
- Validate at meaningful boundaries. Preserve paste, caret position, raw values,
  autofill, and assistive-technology behavior.
- Distinguish disabled from busy. Explain why an unavailable action cannot run.
- Use inline editing only when it reduces interruption and supports cancel,
  validation, keyboard operation, and rollback.
- Use autosave only when saved state, failure, offline behavior, and conflict
  handling are explicit.
- Use existing Twenty controls before creating a specialized primitive. In
  `twenty-front` follow Linaria; in `twenty-ui` follow its existing SCSS and
  primitive conventions.

## Verification

Check labels, keyboard operation, validation timing, invalid recovery, pending
state, cancellation, save confirmation, upload progress/failure, responsive
behavior, and screen-reader status.

## Primary-owned patterns

- Primary owner: [Disabled Buttons](library/disabled-buttons.md)
- Primary owner: [Inline Editing](library/inline-editing.md)
- Primary owner: [Drag and Drop](library/drag-and-drop.md)
- Primary owner: [Color Picker UX](library/color-picker-ux.md)
- Primary owner: [Settings System](library/settings-system.md)
- Primary owner: [Autosave](library/autosave.md)
- Primary owner: [Date Pickers](library/date-pickers.md)
- Primary owner: [Form Field States](library/form-field-states.md)
- Primary owner: [Input Masking](library/input-masking.md)
- Primary owner: [Range Sliders](library/range-sliders.md)
- Primary owner: [Stepper Wizard](library/stepper-wizard.md)
- Primary owner: [Toggle Anatomy](library/toggle-anatomy.md)
- Primary owner: [Form Validation Timing](library/form-validation-timing.md)
- Primary owner: [File Upload UX](library/file-upload-ux.md)
- Primary owner: [Password Field UX](library/password-field-ux.md)
- Primary owner: [OTP Input](library/otp-input.md)
