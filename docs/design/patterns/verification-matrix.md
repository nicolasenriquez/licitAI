---
type: checklist
title: UI Pattern Verification Matrix
description: Behavior-focused verification matrix for curated product UI patterns.
okf_version: "0.1"
---

# UI Pattern Verification Matrix

Pattern application must produce behavior checks, not only visual changes.
Select the rows relevant to the change and keep the feature contract as the
source of truth.

## General checks

- [ ] Initial loading is identifiable and preserves the expected layout shape.
- [ ] Populated, empty, filtered-empty, unavailable, and error states are
      distinct where applicable.
- [ ] Retry or recovery preserves useful context.
- [ ] Keyboard operation and visible focus work for every changed interaction.
- [ ] Responsive behavior works at the repository's supported narrow widths.
- [ ] Content remains usable at 200% zoom.
- [ ] Light/dark tokens remain coherent.
- [ ] Reduced-motion preferences are respected.

## Dense data surfaces

- [ ] Semantic table structure and headers are correct.
- [ ] Sorting has a clear state and does not lose required context.
- [ ] Selection state is visible and keyboard reachable.
- [ ] Page and result-set selection scope is explicit.
- [ ] Pagination preserves the required URL and filter state.

## Mercado Público minimum matrix

- [ ] Loading
- [ ] Data
- [ ] Empty
- [ ] Filtered-empty
- [ ] Error
- [ ] Retry in place
- [ ] Search and filter add/remove/clear
- [ ] Sort
- [ ] Next and previous cursor behavior
- [ ] Direct URL restoration
- [ ] Side-panel open, close, and focus return
- [ ] Narrow viewport and 200% zoom
- [ ] Keyboard traversal
- [ ] Light and dark themes
