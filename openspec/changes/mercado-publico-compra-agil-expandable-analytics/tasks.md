---
type: change-tasks
title: "Tasks: mercado-publico-compra-agil-expandable-analytics"
description: "Implementation and verification tasks for Compra Ágil analytics."
okf_version: "0.1"
---

# Tasks: mercado-publico-compra-agil-expandable-analytics

## 0. Investigation and Scope Lock

- [x] 0.1 Confirm successor authority and record the HTML-to-data-to-contract-to-component matrix.
  Traceability: prevents this successor from reopening archived changes or deriving analytics from unsupported presentation fixtures.
  Notes: Confirmed new active successor authority; mapped retained V2 evidence through staging, canonical, gold, GraphQL, native charts, productive Storybook, and SidePanel.

- [x] 0.2 Record owning seams, current fields, real coverage semantics, and graph/Storybook precedents.
  Traceability: locks the narrowest backend and frontend ownership boundaries before implementation.
  Notes: Selected the detected-process read service, Mercado Público frontend module, PostgreSQL-shaped read integration, productive Workspace story, and native graph/SidePanel seams.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Prove extraction and canonical refresh preserve unknown versus explicit zero for documents and offers.
  Traceability: null and zero have different business meaning and must fail before the schema/source mapping change.

- [ ] 1.2 Prove list and analytics share business filters and that pagination/order never change aggregate population.
  Traceability: prevents page-derived KPI and filter drift at the owning read-service seam.

- [ ] 1.3 Prove four KPI, closed disclosure, six charts, five-column table, SidePanel, and partial coverage in the productive page/Storybook contract.
  Traceability: locks the complete user-visible Compra Ágil composition before replacing production markup.

## 2. Implementation

- [ ] 2.1 Expand the nullable canon with reversible instance commands, extraction, idempotent retained-payload backfill, and gold projection.
  Traceability: preserves source truth through the existing CLI-only persistence path without aggregate storage.

- [ ] 2.2 Extend the read service, DTO, resolver, GraphQL schema/documents, generated types, and hooks with shared filters and one analytics query.
  Traceability: provides one parameterized full-population contract for list, KPI, and charts.

- [ ] 2.3 Build the productive Workspace story first with MSW scenarios for full, loading, empty, error, and partial coverage.
  Traceability: turns Storybook into the production composition proof rather than a disconnected prototype.

- [ ] 2.4 Integrate filters, KPI, six native charts, five-column table, business-language panel, iconography, and responsive/a11y behavior in the real route.
  Traceability: ships the approved Compra Ágil experience at the highest existing product seam.

- [ ] 2.5 Remove only superseded prototype markup and stories after productive parity passes.
  Traceability: avoids dual presentation authorities without deleting evidence prematurely.

## 3. Verification

- [ ] 3.1 Validate reversible schema commands, canonical refresh/backfill, arithmetic, Santiago timezone, null/zero semantics, and deterministic ordering.
  Traceability: proves the persistence and analytical correctness boundaries directly.

- [ ] 3.2 Validate resolver, frontend code generation, hooks, shared filters, and aggregate independence from pagination.
  Traceability: proves transport and client consumers preserve the owning read contract.

- [ ] 3.3 Validate light/dark, desktop/390 px, keyboard, focus, reduced motion, loading, empty, error, partial coverage, and no-data chart behavior.
  Traceability: proves the productive presentation remains usable and truthful across required states.

- [ ] 3.4 Confirm no regression in default hash, Licitaciones, Centro de Control, and native SidePanel behavior.
  Traceability: enforces the successor authority boundary against adjacent stable surfaces.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update durable documentation only where the shipped public or canonical operating contract changes.
  Traceability: keeps planning details out of durable docs while documenting real operational change.

- [ ] 4.2 Run focused checks, package validations, Storybook checks, and OpenSpec validation; record concise evidence.
  Traceability: provides reviewable completion evidence at every touched seam.

- [ ] 4.3 Prepare sync/archive only after implementation and verification are complete.
  Traceability: keeps the active successor authoritative until its delta is proven and synchronized.

## Execution Order

### Slice 1 — Scope lock
- Tasks: `0.1 -> 0.2`
- Checkpoint: authority, source matrix, owning seams, and test precedents are explicit.
- Blocks: Slice 2.

### Slice 2 — Backend contract proof
- Tasks: `1.1 -> 1.2`
- Checkpoint: null/zero and complete-population filter parity fail before implementation.
- Blocked by: Slice 1.
- Blocks: Slice 3.

### Slice 3 — Canon and read contract
- Tasks: `2.1 -> 2.2`
- Checkpoint: retained evidence reaches list and one full-population analytics query through generated GraphQL types.
- Blocked by: Slice 2.
- Blocks: Slice 4.

### Slice 4 — Productive Compra Ágil composition
- Tasks: `1.3 -> 2.3 -> 2.4 -> 2.5`
- Checkpoint: productive story and route pass full and partial states before prototype removal.
- Blocked by: Slice 3.
- Blocks: Slice 5.

### Slice 5 — Verification
- Tasks: `3.1 -> 3.2 -> 3.3 -> 3.4`
- Checkpoint: persistence, API, UI, accessibility, and adjacent regressions pass.
- Blocked by: Slice 4.
- Blocks: Slice 6.

### Slice 6 — Closeout
- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: durable docs, concise evidence, validation, sync, and archive readiness agree.
- Blocked by: Slice 5.
- Blocks: None.

