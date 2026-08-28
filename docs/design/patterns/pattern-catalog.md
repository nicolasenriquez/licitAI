---
type: reference
title: Curated UI Pattern Catalog
description: Routing catalog for the 73 reviewed DesignMotionHQ patterns and their repository posture.
okf_version: "0.1"
---

# Curated UI Pattern Catalog

This catalog is a curated snapshot of the 73 DesignMotionHQ patterns present at
review time on 2026-08-28. It is a routing map, not 73 mandatory rules.

The `Guide` column is the canonical primary owner. Related guidance may mention
a pattern without changing that ownership.

| # | Category | Pattern | Repo posture | Guide | MP relevance | Curated agent note |
|---:|---|---|---|---|---|---|
| 1 | Interaction | [Bulk Actions](library/bulk-actions.md) | `RECOMMENDED` | [`data-dense-surfaces.md`](data-dense-surfaces.md) | High | Multi-record operations with explicit, stable selection scope. |
| 2 | Interaction | [Disabled Buttons](library/disabled-buttons.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Use native disabled semantics when truly unavailable; never hide the blocker or misuse disabled as loading. |
| 3 | Interaction | [Hover Trap](library/hover-trap.md) | `REQUIRED` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Critical actions must remain reachable without hover. |
| 4 | Interaction | [Behind the Button](library/behind-the-button.md) | `REQUIRED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Treat mutation UX as validation, pending, server truth, and recovery. |
| 5 | Interaction | [Inline Editing](library/inline-editing.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | High | Use when it reduces interruption and preserves validation, rollback, and keyboard behavior. |
| 6 | Interaction | [Live Cursors](library/live-cursors.md) | `AVOID_BY_DEFAULT` | [`visual-foundations.md`](visual-foundations.md) | Low | No current Mercado Público need. |
| 7 | Interaction | [Destructive Actions](library/destructive-actions.md) | `REQUIRED_WHEN_APPLICABLE` | [`destructive-and-reversible-actions.md`](destructive-and-reversible-actions.md) | High | Risk and reversibility determine friction. |
| 8 | Interaction | [Context Menu](library/context-menu.md) | `CONTEXTUAL` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Secondary expert actions need keyboard and touch equivalents. |
| 9 | Interaction | [Drag and Drop](library/drag-and-drop.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Provide a non-drag alternative. |
| 10 | Interaction | [Dropdown Design](library/dropdown-design.md) | `RECOMMENDED` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Reuse existing primitives and handle focus, collision, and long lists. |
| 11 | Interaction | [Peak-End Rule](library/peak-end-rule.md) | `HEURISTIC` | [`visual-foundations.md`](visual-foundations.md) | Low | Journey-design lens only. |
| 12 | Interaction | [Search Experience System](library/search-experience-system.md) | `REQUIRED_WHEN_SEARCH_EXISTS` | [`search-filter-discovery.md`](search-filter-discovery.md) | High | Search needs discoverability, keyboard behavior, result feedback, and recovery. |
| 13 | Interaction | [Star Rating](library/star-rating.md) | `AVOID_BY_DEFAULT` | [`visual-foundations.md`](visual-foundations.md) | Low | No current CRM or procurement requirement. |
| 14 | Interaction | [Tooltip Design](library/tooltip-design.md) | `CONTEXTUAL` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | Medium | Supplementary explanation only; trigger on focus as well as hover. |
| 15 | Interaction | [Swipe Actions](library/swipe-actions.md) | `AVOID_BY_DEFAULT` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | Low | Never the sole path to an action. |
| 16 | Interaction | [Bottom Sheets](library/bottom-sheets.md) | `CONTEXTUAL` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | Medium | Use only when it fits existing primitives and navigation. |
| 17 | Interaction | [Color Picker UX](library/color-picker-ux.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Low | Only for actual color-configuration features. |
| 18 | Interaction | [Command Palette](library/command-palette.md) | `RECOMMENDED` | [`navigation.md`](navigation.md) | High | Align with Twenty's existing command menu. |
| 19 | Interaction | [Filter Chips](library/filter-chips.md) | `REQUIRED_WHEN_FILTERING` | [`search-filter-discovery.md`](search-filter-discovery.md) | High | Make active filters, removal, reset, and result effects explicit. |
| 20 | Interaction | [Accordion Disclosure](library/accordion-disclosure.md) | `RECOMMENDED` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Use semantic disclosure for secondary detail. |
| 21 | Interaction | [Data Table](library/data-table.md) | `REQUIRED_FOR_DENSE_RECORD_LISTS` | [`data-dense-surfaces.md`](data-dense-surfaces.md) | High | Use semantic, metadata-driven, state-complete behavior. |
| 22 | Interaction | [Modal Hierarchy](library/modal-hierarchy.md) | `REQUIRED_WHEN_OVERLAY_NEEDED` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Choose modal, drawer, popover, or side panel by task. |
| 23 | Forms | [Settings System](library/settings-system.md) | `RECOMMENDED` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Group settings by task and risk. |
| 24 | Forms | [Autosave](library/autosave.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | High | Expose pending, saved, offline, error, and conflict behavior. |
| 25 | Forms | [Date Pickers](library/date-pickers.md) | `RECOMMENDED` | [`forms-and-editing.md`](forms-and-editing.md) | High | Preserve keyboard access and format clarity. |
| 26 | Forms | [Form Field States](library/form-field-states.md) | `REQUIRED` | [`forms-and-editing.md`](forms-and-editing.md) | High | Define the states the field actually needs. |
| 27 | Forms | [Input Masking](library/input-masking.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Do not corrupt raw values, paste, caret position, or assistive technology use. |
| 28 | Forms | [Range Sliders](library/range-sliders.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Low | Pair approximate ranges with precise values when needed. |
| 29 | Forms | [Stepper Wizard](library/stepper-wizard.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Use only when sequence or dependency is real. |
| 30 | Forms | [Toggle Anatomy](library/toggle-anatomy.md) | `RECOMMENDED` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Make state, label, pending, and error behavior explicit. |
| 31 | Forms | [Form Validation Timing](library/form-validation-timing.md) | `REQUIRED` | [`forms-and-editing.md`](forms-and-editing.md) | High | Validate at meaningful boundaries and make recovery clear. |
| 32 | Forms | [File Upload UX](library/file-upload-ux.md) | `REQUIRED_WHEN_UPLOAD_EXISTS` | [`forms-and-editing.md`](forms-and-editing.md) | High | Expose progress, retry, failure, cancellation, and file status. |
| 33 | Forms | [Password Field UX](library/password-field-ux.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Authentication-only; follow identity-provider policy. |
| 34 | Forms | [OTP Input](library/otp-input.md) | `CONTEXTUAL` | [`forms-and-editing.md`](forms-and-editing.md) | Medium | Preserve one logical value, paste, autofill, and resend behavior. |
| 35 | Feedback | [Doherty Threshold](library/doherty-threshold.md) | `HEURISTIC` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | Medium | Perceived-performance guidance, not an SLA. |
| 36 | Feedback | [Error States](library/error-states.md) | `REQUIRED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Match surface to scope and provide recovery. |
| 37 | Feedback | [Loading States System](library/loading-states-system.md) | `REQUIRED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Choose skeleton, spinner, progress, or local pending deliberately. |
| 38 | Feedback | [Notification System](library/notification-system.md) | `RECOMMENDED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Match interruption to importance. |
| 39 | Feedback | [Toast Notifications](library/toast-notifications.md) | `CONTEXTUAL` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Transient feedback only; durable information needs a durable surface. |
| 40 | Feedback | [Zeigarnik Effect](library/zeigarnik-effect.md) | `HEURISTIC` | [`visual-foundations.md`](visual-foundations.md) | Low | Avoid artificial incompleteness. |
| 41 | Feedback | [Undo UX](library/undo-ux.md) | `RECOMMENDED_WHEN_REVERSIBLE` | [`destructive-and-reversible-actions.md`](destructive-and-reversible-actions.md) | High | Reversal must be truthful and reliable. |
| 42 | Feedback | [Optimistic UI](library/optimistic-ui.md) | `CONTEXTUAL` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Only for low-risk reversible mutations with rollback. |
| 43 | Feedback | [Skeleton Loading](library/skeleton-loading.md) | `RECOMMENDED_WHEN_SHAPE_KNOWN` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Match a known stable shape; do not use by default. |
| 44 | Navigation | [Navigation Patterns](library/navigation-patterns.md) | `REQUIRED_AS_CONTEXT` | [`navigation.md`](navigation.md) | High | Follow Twenty shell and local routing. |
| 45 | Navigation | [Tabs System](library/tabs-system.md) | `RECOMMENDED` | [`navigation.md`](navigation.md) | High | Use existing tabs and APG-compatible keyboard semantics. |
| 46 | Navigation | [Focus States](library/focus-states.md) | `REQUIRED` | [`navigation.md`](navigation.md) | High | Visible focus and correct focus order are hard gates. |
| 47 | Navigation | [Pagination](library/pagination.md) | `REQUIRED_FOR_PAGED_DATA` | [`data-dense-surfaces.md`](data-dense-surfaces.md) | High | Preserve cursor, URL, and list context. |
| 48 | Motion | [Animation Timing](library/animation-timing.md) | `HEURISTIC` | [`motion.md`](motion.md) | Medium | Existing motion tokens override external durations. |
| 49 | Motion | [Easing Curves](library/easing-curves.md) | `HEURISTIC` | [`motion.md`](motion.md) | Low | Do not add bounce because it appears premium elsewhere. |
| 50 | Motion | [Card Hover Anatomy](library/card-hover-anatomy.md) | `AVOID_BY_DEFAULT` | [`motion.md`](motion.md) | Low | Dense CRM UI should not gain ornamental lift by default. |
| 51 | Motion | [Scroll-Driven Animations](library/scroll-driven-animations.md) | `AVOID_BY_DEFAULT` | [`motion.md`](motion.md) | Low | Progressive enhancement only if justified and motion-safe. |
| 52 | Content | [Empty States](library/empty-states.md) | `REQUIRED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Distinguish first-use, zero-results, filtered-empty, and failure. |
| 53 | Content | [Serial Position](library/serial-position.md) | `HEURISTIC` | [`visual-foundations.md`](visual-foundations.md) | Low | Domain priority and task frequency win. |
| 54 | Content | [Microcopy](library/microcopy.md) | `RECOMMENDED` | [`feedback-and-recovery.md`](feedback-and-recovery.md) | High | Use accurate, translatable, action-oriented copy. |
| 55 | Content | [Landing Page Skeleton](library/landing-page-skeleton.md) | `OUT_OF_PRODUCT_SCOPE` | [`visual-foundations.md`](visual-foundations.md) | Low | Marketing-only reference. |
| 56 | Visual | [Charts That Lie](library/charts-that-lie.md) | `REQUIRED_WHEN_CHARTING` | [`visual-foundations.md`](visual-foundations.md) | High | Use truthful scales and encodings. |
| 57 | Visual | [Design System Kit](library/design-system-kit.md) | `REQUIRED_AS_CONTEXT` | [`visual-foundations.md`](visual-foundations.md) | High | Repository tokens and primitives are primary. |
| 58 | Visual | [Golden Ratio](library/golden-ratio.md) | `AVOID_AS_RULE` | [`visual-foundations.md`](visual-foundations.md) | Low | Never override spacing, grid, or token contracts. |
| 59 | Visual | [Grid System](library/grid-system.md) | `RECOMMENDED` | [`visual-foundations.md`](visual-foundations.md) | Medium | Existing layout primitives win; 12 columns are not mandatory. |
| 60 | Visual | [Proximity Rule](library/proximity-rule.md) | `RECOMMENDED` | [`visual-foundations.md`](visual-foundations.md) | High | Use spacing and hierarchy before decoration. |
| 61 | Visual | [Shadow Elevation](library/shadow-elevation.md) | `CONTEXTUAL` | [`visual-foundations.md`](visual-foundations.md) | Medium | Avoid decorative depth escalation. |
| 62 | Visual | [Visual Hierarchy](library/visual-hierarchy.md) | `REQUIRED` | [`visual-foundations.md`](visual-foundations.md) | High | Task priority and scanning hierarchy matter. |
| 63 | Visual | [Z-Index Mastery](library/z-index-mastery.md) | `REQUIRED_WHEN_LAYERING` | [`overlays-and-disclosure.md`](overlays-and-disclosure.md) | High | Respect existing stacking and overlay primitives. |
| 64 | Visual | [Gradient Design](library/gradient-design.md) | `PROHIBITED_PRODUCT_UI` | [`visual-foundations.md`](visual-foundations.md) | High | Product design-system anti-pattern. |
| 65 | Visual | [Icon Design Rules](library/icon-design-rules.md) | `RECOMMENDED` | [`visual-foundations.md`](visual-foundations.md) | Medium | Reuse the existing icon library and accessible labeling. |
| 66 | Visual | [Design Tokens](library/design-tokens.md) | `REQUIRED` | [`visual-foundations.md`](visual-foundations.md) | High | Repository token source of truth wins. |
| 67 | Visual | [Color Accessibility](library/color-accessibility.md) | `REQUIRED` | [`visual-foundations.md`](visual-foundations.md) | High | Color cannot be the sole carrier of meaning. |
| 68 | Visual | [Gestalt Laws](library/gestalt-laws.md) | `HEURISTIC` | [`visual-foundations.md`](visual-foundations.md) | Medium | Composition lens, not implementation specification. |
| 69 | Visual | [Border Radius](library/border-radius.md) | `REQUIRED_AS_REPO_TOKEN` | [`visual-foundations.md`](visual-foundations.md) | High | Use repository radius tokens. |
| 70 | Visual | [Dark Mode](library/dark-mode.md) | `REQUIRED_WHEN_AFFECTED` | [`visual-foundations.md`](visual-foundations.md) | High | Preserve token-based light/dark parity. |
| 71 | Visual | [Von Restorff Effect](library/von-restorff-effect.md) | `HEURISTIC` | [`visual-foundations.md`](visual-foundations.md) | Low | Reserve emphasis for true priority. |
| 72 | Visual | [Perfect Card](library/perfect-card.md) | `AVOID_AS_RULE` | [`visual-foundations.md`](visual-foundations.md) | Low | External aesthetic recipe only. |
| 73 | Visual | [Depth Layers](library/depth-layers.md) | `PROHIBITED_BY_DEFAULT` | [`visual-foundations.md`](visual-foundations.md) | Low | Conflicts with restrained CRM language when decorative. |

## Routing notes

High Mercado Público relevance means the pattern commonly affects the current
dense process-search/detail workflow. Medium means it may matter in adjacent
product work. Low means it is optional, specialized, aesthetic, marketing, or
collaboration guidance.
