---
type: change-tasks
title: opsx-authoring-quality-gates Tasks
description: Implementation and verification tasks for Opsx authoring quality gates.
okf_version: "0.1"
---

# Tasks: opsx-authoring-quality-gates

Phase 1 is intentionally omitted. See proposal.md for the no-runtime-change
justification.

## 0. Investigation and Scope Lock

- [x] 0.1 Re-read the current Opsx skill and three references, plus the selected Matt skills, to confirm the ownership and compatibility seams.
  Traceability: establishes the existing authoring contract, highest test seam, and non-publishing boundary before edits begin.
  Notes: Implemented and verified in the scoped Opsx references.
- [x] 0.2 Map the planned requirements to the four scoped documents and confirm that existing changes, execute.md, commit-local.md, .agents/skills, and .opencode/ remain untouched.
  Traceability: locks the docs-or-governance scope and prevents parallel workflow artifacts.
  Notes: Implemented and verified in the scoped Opsx references.

## 2. Implementation

### Skill and House Style

- [x] 2.1 Update SKILL.md with seam, first-proof, vertical-slice, clarification, and non-publishing gates, and correct the grill-with-docs reference.
  Traceability: makes the workflow policy enforce the intended authoring sequence at its entrypoint.
  Notes: Implemented and verified in the scoped Opsx references.
- [x] 2.2 Add conditional Execution Order, checkpoint, blocker, stable-ID, acyclic-graph, and expand-contract rules to opsx-house-style.md.
  Traceability: defines the authoritative ordering and slicing policy used by all artifacts.
  Notes: Implemented and verified in the scoped Opsx references.

### Artifact Templates and Command Contract

- [x] 2.3 Enrich artifact-templates.md with seam ownership, prior art, first-proof, Execution Order, checkpoint, blocker, vertical-slice, and expand-contract examples.
  Traceability: turns the policy into copyable authoring structure without removing existing sections.
  Notes: Implemented and verified in the scoped Opsx references.
- [x] 2.4 Update opsx-command-contract.md so conditional Execution Order, canonical Traceability:, optional real Blocked by:, and historical Footnote: compatibility are explicit.
  Traceability: preserves slash-command compatibility while adding the new quality gates.
  Notes: Implemented and verified in the scoped Opsx references.

## Execution Order

### Slice 1 — Gate and ordering policy

- Tasks: 0.1 -> 0.2 -> 2.1 -> 2.2
- Checkpoint: The entry skill and house style agree on the highest Seam, first proof, applicability rule, and executable order.
- Blocks: None

### Slice 2 — Artifact authoring and compatibility

- Tasks: 2.3 -> 2.4
- Checkpoint: Templates and command contract encode the same conditional order and compatibility rules.
- Blocked by: 2.1, 2.2

### Slice 3 — Validation and closeout

- Tasks: 3.1 -> 3.2 -> 4.1
- Checkpoint: All eight requested scenarios and the OpenSpec validator pass with no out-of-scope file changes.
- Blocked by: 2.3, 2.4

## 3. Verification

- [x] 3.1 Re-read all four scoped documents and verify the eight scenarios: simple slice, schema → backend → API, parallel blockers, expand-contract, grilling ambiguity, no tracker, historical Footnote:, and OpenSpec compatibility.
  Traceability: proves the policy closes the identified authoring gap without contradictory guidance.
  Notes: Implemented and verified in the scoped Opsx references.
- [x] 3.2 Inspect the final diff and confirm only the four scoped Opsx files and this OpenSpec change are changed.
  Traceability: proves the documentation-only boundary and protects existing workflows.
  Notes: Implemented and verified in the scoped Opsx references.

## 4. Release Hygiene and Closeout

- [x] 4.1 Run openspec validate opsx-authoring-quality-gates --type change --no-interactive and record the result.
  Traceability: provides final artifact-level proof that proposal, design, spec, and tasks remain aligned.
  Notes: Implemented and verified in the scoped Opsx references.
