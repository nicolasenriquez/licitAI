---
type: change-proposal
title: opsx-authoring-quality-gates Proposal
description: Proposal for executable ordering and quality gates in the repo-local Opsx authoring workflow.
okf_version: "0.1"
---

# Change Proposal: opsx-authoring-quality-gates

## Why

The repo-local Opsx workflow defines phases and stable task IDs, but it does not define dependencies or an executable order across slices. That gap allows otherwise valid OpenSpec tasks to be executed in numeric order even when a real dependency, parallel branch, or expand-contract sequence requires a different order.

## What Changes

- Add explicit authoring gates for the highest existing `Seam`, its ownership, and the highest test seam.
- Require the first observable behavior or contract proof to be named during authoring, together with relevant prior art.
- Add an `Execution Order` format for multi-slice, dependency-sensitive, parallel, and wide-refactor changes, including checkpoints and real blocking edges.
- Require vertical, demoable slices and document expand-contract sequencing for wide refactors.
- Define stable numeric task IDs, one-time task listing, acyclic dependencies, and the continued canonical use of `Traceability:`.
- Integrate the selected Matt skill guidance for grilling, deep-module design, test seams, vertical slices, blockers, and expand-contract without invoking tracker-publishing commands or creating parallel artifacts.
- Correct the `grill-with-docs` reference to the real available skill path.
- Preserve compatibility for simple single-slice changes and historical `Footnote:` lines.

## Capabilities

### New Capabilities

- `opsx-authoring-quality-gates`: executable ordering, seam/test coverage, and slice-quality rules for repo-local Opsx/OpenSpec authoring.

### Modified Capabilities

- None. The existing OpenSpec capability requirements are not changed; this change adds a local authoring policy and compatibility contract.

## Impact

- Affects `.codex/commands/opsx-spec-workflow/SKILL.md` and its three reference documents.
- Adds a docs-or-governance OpenSpec change with proposal, design, spec, and tasks artifacts.
- Does not affect production code, APIs, runtime behavior, `execute.md`, `commit-local.md`, `.agents/skills`, `.opencode/`, or existing changes.
- Highest test seam: the authoring contract and artifact templates, verified by reading the generated artifacts and running OpenSpec validation. No runtime fail-first test is required for this docs-only policy change.
- Prior art: the existing Opsx phase, numeric-ID, `Traceability:`, and `Footnote:` compatibility rules in the three reference documents.
- First failing proof: a multi-slice task plan with a schema → backend → API dependency currently has no required executable order or checkpoint contract.

## Execution Order Decision

This change requires `Execution Order` in its own `tasks.md` because it has multiple documentation slices with dependency-sensitive edits and a final validation checkpoint. A simple one-slice documentation change would remain valid without that section.

## Phase 1 Omission

Phase 1 fail-first coverage is intentionally omitted. This change alters only authoring guidance and artifact compatibility; it has no runtime, transport, persistence, integration, UI, or regression behavior to exercise. Its proof is artifact coherence, compatibility preservation, and successful OpenSpec validation.

## Notes

- Context: OpenSpec remains the sole source of truth for change artifacts.
- Assumptions: the Matt skills remain guidance sources, not additional workflow engines in Opsx authoring.
- Boundaries: no tracker publication, no parallel ticket file, and no changes outside the four scoped Opsx files plus this change's artifacts.
