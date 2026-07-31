---
type: change-tasks
title: "Tasks: mercado-publico-workspace-redesign"
description: "Implementation-ready UI replacement slices for Mercado Público."
okf_version: "0.1"
---

# Tasks: mercado-publico-workspace-redesign

## 0. Investigation and Scope Lock

- [ ] 0.1 Re-read the current command-center read contracts, Wayfinder data
  matrix, and validated prototype before editing runtime code; record the
  permitted fields and successor-authority boundary in the implementation PR.
  Traceability: prevents a presentation replacement from widening GraphQL,
  ingestion, or unsupported visible data.

- [ ] 0.2 Confirm the existing SidePanel registration API and the current
  Mercado Público page/component ownership; add a shared page type only if the
  existing seam cannot carry family/code safely.
  Traceability: chooses the highest existing desktop/mobile/focus seam instead
  of preserving a local overlay or creating a parallel abstraction.

## 1. Compra Ágil Vertical Slice

- [ ] 1.1 Add a failing page integration test using the real SidePanel host and
  per-instance contextual state. Prove that Compra Ágil pointer/Enter/Space
  activation transports `family` + `code`, and close/Escape restores focus,
  applied filters, page, selection, and scroll.
  Traceability: proves the replacement at the native user-observable seam.

- [ ] 1.2 Add failing Compra Ágil coverage for its six-column semantic table;
  exact filters and sorts; server pagination; source-pending detail;
  unavailable/null states; mobile/200% local containment; and truthful
  full-value text. Capture focused Storybook visual/a11y evidence for the slice.
  Traceability: locks behavior and the supported-data ceiling before replacement.

- [ ] 1.3 Implement the Compra Ágil browse and native SidePanel detail over
  existing typed hooks. After 1.1–1.2 pass, remove only its equivalent bespoke
  filter/detail presentation in the same slice.
  Traceability: ships and simplifies one complete vertical surface without an
  upfront generic browse abstraction.

## 2. Licitaciones Vertical Slice

- [ ] 2.1 Add failing Licitaciones coverage for the same six-column filters,
  sorts, pagination, keyboard/focus/context, unavailable/null, and responsive
  contracts, while limiting detail to its currently typed family evidence;
  capture focused Storybook visual/a11y evidence for the slice.
  Traceability: proves shared interaction without implying DTO equivalence.

- [ ] 2.2 Implement Licitaciones browse and native SidePanel detail. Extract
  only the exact browse seams now shared with Compra Ágil; keep family detail
  specific. After 2.1 passes, remove only its equivalent legacy presentation.
  Traceability: defers abstraction until two concrete consumers prove it.

## 3. Centro de Control Vertical Slice

- [ ] 3.1 After scope lock, independently add failing coverage for one mounted
  job/API view, `hasMore`, partial/null values without zero substitution,
  transparent quota math, semantic containment, visible focus, and unique
  tooltip anchors; capture focused Storybook visual/a11y evidence for the slice.
  Traceability: Control Center has no artificial dependency on browse/detail.

- [ ] 3.2 Recompose Centro de Control into native Diagnóstico, Investigación,
  and Integridad sections with one local semantic monitoring-table composition,
  one mounted job/API view, local containment, and transparent quota math.
  Traceability: delivers the accepted calm read model without KPI theater,
  mutation controls, or incomplete-page aggregates.

- [ ] 3.3 After 3.1 passes, remove only the equivalent duplicated monitoring
  wrappers in the same slice; retain domain-specific semantics and skeleton
  geometry.
  Traceability: makes replacement and deletion one reversible frontend diff.

## 4. Verification

- [ ] 4.1 Run focused Mercado Público Jest tests, then `yarn nx typecheck
  twenty-front`; if implementation changes `twenty-shared`, first run
  `yarn nx build twenty-shared` and validate its affected consumer.
  Traceability: proves the changed module and any shared contract in dependency
  order.

- [ ] 4.2 Run automated ARIA, keyboard, focus, and Mercado Público Storybook
  interaction/a11y tests plus fresh cross-surface captures at desktop/mobile,
  light/dark, keyboard-only, 200%,
  and reduced motion; attach the audit evidence to this change.
  Traceability: carries the prototype acceptance gate into the production-bound
  composition rather than relying on source inspection.

## 5. Release Hygiene and Closeout

- [ ] 5.1 Update operator/user-facing documentation only if the shipped route
  behavior changes; retain the CLI-only ingestion and current-read-contract
  boundaries.
  Traceability: prevents documentation from implying a new control surface or
  unsupported data.

- [ ] 5.2 Run `openspec validate mercado-publico-workspace-redesign`, confirm
  removal criteria and rollback notes against the implemented diff, then use
  the normal verify/sync/archive workflow when implementation is complete.
  Traceability: keeps successor authority, implementation evidence, and the
  legacy change relationship auditable.

## Execution Order

### Slice 1 — Scope lock
- Tasks: `0.1 -> 0.2`
- Checkpoint: authority, supported fields, and native SidePanel seam confirmed.
- Blocks: Slices 2, 3, and 4.

### Slice 2 — Compra Ágil
- Tasks: `1.1 -> 1.2 -> 1.3`
- Checkpoint: first native vertical browse/detail replacement passes before its
  equivalent legacy code is deleted.
- Blocks: Slice 3 and Slice 5.

### Slice 3 — Licitaciones
- Tasks: `2.1 -> 2.2`
- Checkpoint: second vertical slice passes and only proven common browse seams
  are extracted.
- Blocked by: Slice 2.
- Blocks: Slice 5.

### Slice 4 — Centro de Control
- Tasks: `3.1 -> 3.2 -> 3.3`
- Checkpoint: one contained factual monitoring table switches views without
  fabricated aggregate or partial-state values.
- Blocked by: Slice 1 only; may run independently of Slices 2 and 3.
- Blocks: Slice 5.

### Slice 5 — Final parity and closeout
- Tasks: `4.1 -> 4.2 -> 5.1 -> 5.2`
- Checkpoint: focused checks and cross-surface audit prove all replacements;
  deleted code has no remaining behavior owner.
- Blocked by: Slices 2, 3, and 4.
- Blocks: None.
