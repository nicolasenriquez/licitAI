---
type: change-tasks
title: repo-okf-documentation-adoption Tasks
description: Implementation and verification tasks for the OKF documentation adoption slice.
okf_version: "0.1"
---

# Tasks: repo-okf-documentation-adoption

Phase 1 is intentionally omitted. See `proposal.md` for the no-runtime-change
justification.

## 0. Investigation and Scope Lock

- [x] 0.1 Confirm all current `CONTEXT-MAP.md` references and affected routing contracts.
  Traceability: root routing replacement, routing-contract migration
- [x] 0.2 Confirm the documentation surfaces that receive additive metadata in this slice.
  Traceability: safe additive metadata rollout, body preservation
- [x] 0.3 Confirm the OKF `type` taxonomy and index hierarchy for the repository bundle.
  Traceability: stable taxonomy, documentation ordering

## 2. Implementation

- [x] 2.1 Create root `index.md` and migrate the canonical routing map from `CONTEXT-MAP.md`.
  Traceability: root routing index replacement
- [x] 2.2 Add progressive-disclosure `index.md` files for `docs/`, `openspec/`, `packages/`, `.codex/`, and `.opencode/`.
  Traceability: surface indexing
- [x] 2.3 Update routing contracts and bounce rules to reference root `index.md`.
  Traceability: routing-contract migration
- [x] 2.4 Add `docs/standards/okf-standard.md`, `docs/architecture/documentation-topology.md`, and `docs/operations/okf-authoring-guide.md`.
  Traceability: taxonomy, topology, authoring guidance
- [x] 2.5 Apply additive metadata and bounded formatting fixes to the targeted existing documentation corpus.
  Traceability: additive metadata rollout, body preservation
- [x] 2.6 Remove `CONTEXT-MAP.md` after live-contract reference cleanup.
  Traceability: root routing index replacement

## 3. Verification

- [x] 3.1 Verify there are zero remaining live-contract references to `CONTEXT-MAP.md`.
  Traceability: routing-contract migration
- [x] 3.2 Verify the root routing flow remains `AGENTS.md` -> `index.md` -> selected surface.
  Traceability: root routing index replacement, documentation ordering
- [x] 3.3 Verify mapped surfaces expose coherent local `index.md` files and non-contradictory routing contracts.
  Traceability: surface indexing
- [x] 3.4 Verify existing-document updates are limited to metadata, formatting, and routing-link adjustments.
  Traceability: safe additive metadata rollout, body preservation

## 4. Release Hygiene and Closeout

- [x] 4.1 Update final docs that depend on the routing source of truth.
  Traceability: routing-contract migration
- [x] 4.2 Run `openspec validate repo-okf-documentation-adoption`.
  Traceability: change validation
- [ ] 4.3 Defer archive and sync until implementation is complete and accepted.
  Traceability: change lifecycle hygiene
