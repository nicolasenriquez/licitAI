## 0. Investigation and Scope Lock

- [ ] 0.1 Confirm active page, URL hook, filter bar, side-panel detail, History,
  resolver, Opportunity metadata, and Common API ownership against current HEAD.
  Traceability: locks highest existing frontend and backend Seams before code changes.

- [ ] 0.2 Record baseline results and reconcile obsolete Mercado Publico E2E
  labels before treating existing failures as regressions.
  Traceability: separates pre-existing test drift from product-design changes.

- [ ] 0.3 Confirm generated fast instance-command scope for Opportunity source
  fields and core investigation mapping, including reversible `up` and `down`.
  Traceability: prevents silent schema widening or hand-authored migration logic.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add failing Playwright proof for process-switch reset and local detail retry.
  Traceability: first proof crosses the route/panel Seam and exposes stale state and missing recovery.

- [ ] 1.2 Add failing filter and URL tests for grouped controls, Escape focus
  return, unchanged keys, cursor reset, process preservation, and list scroll.
  Traceability: protects existing query contract while changing hierarchy.

- [ ] 1.3 Add failing panel tests for primary tabs, technical disclosure,
  factual state language, History return context, and relation alerts.
  Traceability: proves visible information architecture and recovery behavior before implementation.

- [ ] 1.4 Add failing server tests for authorization, missing source, repeat,
  same-workspace concurrency, cross-workspace isolation, and deleted-target replacement.
  Traceability: first mutation proof crosses resolver/service and durable mapping Seams.

- [ ] 1.5 Add failing client tests for pending, created, existing, error, retry,
  and Open in CRM states.
  Traceability: pins user-visible mutation behavior before Apollo integration.

## 2. Implementation

### Slice 1: Panel resilience

- [ ] 2.1 Reset tab, four relation cursors, payload, errors, and transient state
  by `codigo`; add detail `refetch` and independent relation alerts/retries.
  Traceability: closes audit P1 reset and recovery defects at existing panel Seam.

### Slice 2: Filter hierarchy

- [ ] 2.2 Keep five primary controls and group remaining filters by buyer,
  process status, and size/evidence with managed focus and existing URL serialization.
  Traceability: improves operator intent without changing server or URL contracts.

### Slice 3: Detail and History hierarchy

- [ ] 2.3 Add factual summary and feasibility notice, keep three primary tabs,
  move sanitized payload to lazy disclosure, localize specific empty states, and
  implement History as context-preserving panel subview.
  Traceability: closes audit hierarchy, language, technical exposure, and continuity requirements.

### Slice 4: CRM persistence and API

- [ ] 2.4 Add optional Opportunity process-code and source-URL metadata and
  generate the required fast instance command with reversible schema behavior.
  Traceability: provides factual CRM fields through repository-approved schema workflow.

- [ ] 2.5 Add core workspace-plus-code mapping and transactional investigation
  service using Common API Opportunity creation, conflict convergence, immutable
  `markedAt`, and deleted-target replacement.
  Traceability: owns idempotency locally without weakening generic CRM CRUD.

- [ ] 2.6 Add guarded mutation DTO/resolver/module wiring and regenerate
  compatible GraphQL and client types.
  Traceability: exposes the minimal four-field contract through existing auth and permission boundaries.

### Slice 5: CRM client integration

- [ ] 2.7 Add Apollo mutation and panel state machine for pending, created,
  existing, error/retry, and existing record-page navigation.
  Traceability: completes vertical investigation flow while preserving query context.

### Slice 6: Responsive and accessibility closure

- [ ] 2.8 Reflow list and panel at 320 px and 200 percent zoom; preserve
  semantic order, visible focus, 44 by 44 targets, three destinations, alerts,
  status messages, and light/dark token behavior.
  Traceability: closes remaining audit P2/P3 access and adaptation requirements.

## 3. Verification

- [ ] 3.1 Run focused frontend Jest and Mercado Publico server Jest suites.
  Traceability: proves component, resolver, service, transaction, and metadata boundaries directly.

- [ ] 3.2 Run Mercado Publico Playwright contracts at desktop, 320 px, 200
  percent zoom, light theme, and dark theme with panel open.
  Traceability: proves complete user flow, focus, reflow, state, and visual requirements.

- [ ] 3.3 Run changed-file lint, `twenty-front` and `twenty-server` typechecks,
  migration up/down verification, and GraphQL compatibility checks.
  Traceability: proves repository quality and schema contracts beyond focused behavior tests.

- [ ] 3.4 Re-run audit acceptance matrix and require zero P0, zero P1, at
  least 18/20 technical score, and no new detector findings.
  Traceability: closes the originating product-design symptom rather than a proxy.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update product design docs and changelog only for behavior that
  passed verification; attach required desktop/mobile/theme evidence.
  Traceability: keeps durable documentation aligned with shipped proof.

- [ ] 4.2 Sync accepted capability deltas and prepare archive only after all
  implementation and verification tasks complete.
  Traceability: specification lifecycle closeout follows runtime proof.

- [ ] 4.3 Run `openspec validate mercado-publico-v2-product-design`.
  Traceability: final artifact proof keeps proposal, design, specs, and tasks aligned.

## Execution Order

### Slice 0: Scope and failing contracts
- Tasks: `0.1 -> 0.2 -> 0.3 -> 1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5`
- Checkpoint: ownership and migration seams are locked and all target regressions fail for expected reasons.
- Blocks: Slices 1, 2, 3, and 4.

### Slice 1: Panel resilience
- Tasks: `2.1`
- Checkpoint: process switch and detail/relation retry tests pass without stale state.
- Blocked by: Slice 0.
- Blocks: Slice 6.

### Slice 2: Filter hierarchy
- Tasks: `2.2`
- Checkpoint: grouped filters preserve URL, selection, cursor-reset, focus, and scroll contracts.
- Blocked by: Slice 0.
- Blocks: Slice 6.

### Slice 3: Detail and History hierarchy
- Tasks: `2.3`
- Checkpoint: factual detail, three destinations, technical disclosure, and History return tests pass.
- Blocked by: Slice 0.
- Blocks: Slice 6.

### Slice 4: CRM persistence and API
- Tasks: `2.4 -> 2.5 -> 2.6`
- Checkpoint: migration reverses cleanly and mutation concurrency, isolation, permission, repeat, and replacement tests pass.
- Blocked by: Slice 0.
- Blocks: Slice 5.

### Slice 5: CRM client integration
- Tasks: `2.7`
- Checkpoint: operator marks, retries, repeats, and opens one live CRM record without losing panel context.
- Blocked by: Slice 4.
- Blocks: Slice 6.

### Slice 6: Responsive and accessibility closure
- Tasks: `2.8`
- Checkpoint: complete visible flow passes desktop/mobile/zoom/theme accessibility matrix.
- Blocked by: Slices 1, 2, 3, and 5.
- Blocks: Slice 7.

### Slice 7: Verification and closeout
- Tasks: `3.1 -> 3.2 -> 3.3 -> 3.4 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: focused and repository gates pass, audit target is met, docs match proof, and OpenSpec validates.
- Blocked by: Slice 6.
- Blocks: None.
