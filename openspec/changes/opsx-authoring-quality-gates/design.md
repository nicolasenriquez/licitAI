---
type: change-design
title: opsx-authoring-quality-gates Design
description: Design for executable ordering and quality gates in Opsx authoring.
okf_version: "0.1"
---

# Design: opsx-authoring-quality-gates

## Context

The repo-local Opsx workflow is the policy layer around legacy OpenSpec
artifacts. Its references already define the canonical phase order, numeric task
IDs, and Traceability:, but they leave dependency-sensitive execution to author
judgment. The change must make that order inspectable while preserving OpenSpec
as the only source of truth.

The authoring workflow is treated as a Module. Its Interface is the set of
artifact rules that a proposal, design, and tasks file must expose to a future
executor and reviewer. The external Seam is the Opsx reference set; the
highest test seam is the generated artifact contract, not a runtime module.
Matt skills supply design vocabulary and slicing heuristics, but they are
guidance sources rather than parallel workflow engines.

## Goals / Non-Goals

**Goals:**

- Make real dependencies, parallel slices, and wide-refactor sequences
  explicit and executable.
- Require seam ownership, highest test seam, first proof, and prior art before
  implementation slices are considered ready.
- Preserve small-change ergonomics: one simple slice can continue using numeric
  task order without an Execution Order section.
- Keep historical artifacts compatible, including Footnote: lines.
- Keep tracker publication and parallel artifacts outside normal Opsx authoring.

**Non-Goals:**

- Changing OpenSpec's schema or CLI behavior.
- Executing implementation, tests, tracker commands, or slash commands while
  authoring.
- Adding rules to .agents/skills, .opencode/, execute.md, or commit-local.md.
- Replacing vertical slices with a layer-by-layer checklist.

## Boundary and Ownership

### Authoring contract

The Opsx reference documents own the Interface for proposal readiness. The
SKILL.md owns phase gates and clarification behavior; opsx-house-style.md owns
ordering, slicing, and exit rules; artifact-templates.md owns the minimum
fields authors must fill; and opsx-command-contract.md owns compatibility with
slash-command expectations.

### Seam vocabulary

Each change must identify the highest existing Seam at which behavior can be
tested, the Module that owns it, and any Adapter crossing that Seam. The design
must state the Module's Interface and explain its Depth, Leverage, and Locality
when those concepts affect the slice shape. Tests should cross the same Seam as
callers.

## Decisions

1. **Make execution order conditional, not universal.**

   Execution Order is mandatory when a change has more than one slice, a real
   dependency between phases, parallel work, or a wide-refactor sequence that
   could be misread as numeric order. It is optional for a simple single-slice
   change.

   Rationale: this closes the proven gap without adding ceremony to trivial
   documentation changes.

   Alternatives considered:

   - Require the section for every change.
     - Rejected because it adds noise and weakens the signal of meaningful
       dependencies.
   - Infer order from layer headings.
     - Rejected because headings are grouping, not executable edges.

2. **Use explicit acyclic task edges and checkpoints.**

   Each execution slice lists its task IDs once, one observable checkpoint, and
   either real blockers or None. Blocked by: is only used for a genuine
   dependency and must reference existing IDs. Numeric IDs remain stable after
   implementation begins.

   Rationale: reviewers can verify the graph without reconstructing it from
   prose, and a checkpoint makes each slice demoable or otherwise verifiable.

   Alternatives considered:

   - Use task numbering as the dependency graph.
     - Rejected because numeric order cannot express parallelism or
       expand-contract migration safely.
   - Permit free-form blockers.
     - Rejected because invalid IDs and cycles would be discovered too late.

3. **Adopt seam-first, behavior-first authoring gates.**

   Phase 0 records ownership and the highest test Seam. Phase 1, when required,
   names the first failing behavior or contract proof and its prior art. Phase
   2 validates vertical slices that cross the complete relevant path. Wide
   refactors use expand → migrate → contract.

   Rationale: the interface is the test surface, and a narrow deep Module
   improves testability, Leverage, and Locality.

   Alternatives considered:

   - Start from file layers and discover tests later.
     - Rejected because it encourages horizontal tasks and
       implementation-detail tests.
   - Require a new test Seam for every slice.
     - Rejected because existing higher Seams should be preferred.

4. **Integrate Matt skills as non-publishing guidance.**

   grilling and grill-with-docs govern one-question clarification;
   codebase-design supplies the required vocabulary; to-spec supplies seam,
   external-behavior, and prior-art rules; and to-tickets supplies
   vertical-slice, blocker, and expand-contract rules. Opsx does not invoke
   tracker-publishing flows or create tickets.md.

   Rationale: OpenSpec remains the single source of truth and the normal
   authoring workflow remains local and deterministic.

## Risks / Trade-offs

- [Risk] Authors may overuse Execution Order for trivial changes. → Mitigation:
  keep the applicability rule explicit and retain the single-slice exception.
- [Risk] A prose blocker can still hide a cycle. → Mitigation: require existing
  numeric IDs, one listing per task, and an acyclic graph.
- [Risk] Matt skill wording may drift independently. → Mitigation: record only
  the selected rules and link the real skill path; do not copy whole workflows.
- [Risk] Historical artifacts use Footnote: rather than Traceability:. →
  Mitigation: accept that format for existing changes and require only
  Traceability: for new tasks.

## Migration Plan

Apply the four scoped reference changes together. Existing OpenSpec changes are
not rewritten or invalidated solely because they lack Execution Order. New or
materially edited tasks follow the updated contract. Rollback is deleting the
additive sections and restoring the prior reference text; no runtime migration
or data rollback exists.

## Verification Strategy

Verify the highest artifact Seam by checking that the skill, house style,
templates, and command contract agree on:

- simple single-slice omission;
- dependency-sensitive and parallel execution order;
- valid blockers with no cycles;
- expand-contract sequencing;
- grilling ambiguity behavior;
- no tracker publication;
- historical Footnote: compatibility.

Then run openspec validate opsx-authoring-quality-gates --type change
--no-interactive.
