---
type: reference
title: "Opsx House Style"
description: "Reference documentation for Opsx House Style."
okf_version: "0.1"
---
# Opsx House Style

Use this reference when authoring or normalizing an OpenSpec change.

## Canonical Phase Order

Use this order in `tasks.md`:

- `## 0. Investigation and Scope Lock`
- `## 1. Contract Coverage (Failing First)`
- `## 2. Implementation`
- `## 3. Verification`
- `## 4. Release Hygiene and Closeout`

Rules:

- `0` always exists
- `1` is mandatory when runtime behavior, contract, persistence, integration, UI behavior, or regression risk changes
- `1` may be omitted only for docs-only, governance-only, or structural changes with no runtime effect
- when `1` is omitted, `proposal.md` must justify the omission explicitly
- `2` contains execution-ready implementation slices only
- `3` proves implementation and reproduced symptom
- `4` contains final changelog, docs, diagrams, sync, and archive readiness

This phase order governs authoring quality. It does not by itself authorize
implementation.

## Change Profiles

Classify each change as one of:

- `runtime-change`
- `docs-or-governance-change`
- `mixed-change`

Profile expectations:

- `runtime-change`
  - phase `1` normally remains mandatory
  - verification must prove the changed behavior directly
- `docs-or-governance-change`
  - phase `1` may be omitted with explicit justification
  - verification should prove contradiction removal, policy alignment, or documentation coherence
- `mixed-change`
  - keep runtime proof strict for runtime slices
  - keep documentation and governance work in final closeout unless earlier clarification is required

## Task ID Rules

Use numeric task IDs only:

- `0.1`
- `1.1`
- `2.1`
- `2.2`
- `3.1`

Do not use mixed numeric and alphabetic identifiers such as:

- `2A`
- `2B`
- `2C`

Use semantic headings for grouping only, for example:

- `### Schema and Persistence`
- `### Backend Service`
- `### API Contract`
- `### Client Integration`
- `### UI Contract`

## Traceability and Notes

Every task must carry:

- `Traceability:`

Completed persisted tasks should also carry:

- `Notes:`

Use them this way:

- `Traceability:` explains why the task exists
- `Notes:` records concise execution evidence or outcome

Do not use diary-style progress logs.
Do not paste long command output into task notes.

## Implementation Slice Heuristics

Prefer more small, well-bounded tasks over fewer broad tasks.

Split tasks when:

- ownership changes
- test type changes
- blast radius becomes unclear
- one seam can be validated without another

Typical seams:

- schema or migration
- repository or persistence
- service orchestration
- API or transport contract
- client integration
- UI rendering or interaction

Avoid both extremes:

- one giant end-to-end implementation task
- micro-fragmentation that creates meaningless ceremony

`implementation-ready slices` describes task quality, not permission to start
implementation.

## Clarification Policy

If repo docs, artifacts, and user intent do not yet form a polished shared
understanding:

- stop before implementation planning
- use `grill-with-docs`
- ask one focused question
- present exactly three alternatives
- recommend one
- wait for the human answer
- record the decision in `proposal.md` or `design.md`

## Exit Gate

A spec is `Proposal Ready for Implementation` only when:

- the scope is locked
- no material ambiguity remains
- the active change profile is explicit
- the canonical phase order is present
- every task has `Traceability:`
- phase `1` is present when runtime behavior, contract, persistence, integration, UI behavior, or regression risk changes
- if phase `1` is omitted, `proposal.md` explicitly justifies why fail-first coverage is not required
- implementation tasks are minimal safe slices
- release hygiene work stays in final closeout
- the workflow can stop without assuming implementation starts immediately

This gate ends planning and hands control back to the human.
It does not automatically transition into `/execute`.

## Closeout Policy

Keep final documentation and release work in `## 4. Release Hygiene and Closeout`:

- `CHANGELOG.md`
- user docs
- operational docs
- diagrams
- spec sync
- archive readiness

Allow earlier doc edits only when they close a design ambiguity before
implementation begins.
