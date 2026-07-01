---
name: opsx-spec-workflow
description: Standardize legacy OpenSpec and `opsx-*` spec authoring in repositories that still use `openspec/`. Use when the repo contains `openspec/`, the user references `openspec/changes/**`, `/plan source=openspec`, `/execute <change>`, `opsx-*`, or asks to create, refine, normalize, grill, verify, sync, or archive a legacy spec-driven change. Enforce investigation-first planning, fail-first contract coverage when behavior changes, sequential numeric task IDs, minimal safe implementation slices, human-in-the-loop clarification through `grill-with-docs`, delayed documentation and changelog closeout, and a hard boundary where this skill stops at implementation-ready artifacts and `/execute` performs code changes.
---

# Opsx Spec Workflow

Use this skill only for repos that still actively use `openspec/` or when the
user explicitly requests the legacy OpenSpec workflow.

Read these first when they exist:

- `.codex/commands/README.md`
- `.codex/commands/prime.md`
- `.codex/commands/plan.md`
- `.codex/commands/execute.md`
- `.codex/commands/grill-with-docs.md`
- relevant `opsx-*.md` files
- `AGENTS.md`
- the active change folder under `openspec/changes/<change-name>/`
- nearby archived changes for style calibration
- [references/opsx-command-contract.md](references/opsx-command-contract.md)
- [references/opsx-house-style.md](references/opsx-house-style.md)
- [references/artifact-templates.md](references/artifact-templates.md)

## Core Rule

Treat slash commands as the workflow engine and this skill as the policy,
authoring, normalization, and implementation-readiness layer.

Do not replace `/plan`, `/execute`, `/grill-with-docs`, `/opsx-sync`, or
`/opsx-archive`.

This skill stops at implementation-ready artifacts.
Actual code changes are performed later through `/execute`.

## Activation Gate

Use this skill only when at least one of these is true:

- the repo contains `openspec/`
- the user references `openspec/changes/**`
- the user asks for `/plan source=openspec`
- the user asks for `/execute <change>`
- the user references `opsx-*` commands
- the user explicitly asks for legacy OpenSpec workflow handling

Do not trigger this skill only because generic artifact names such as
`proposal.md`, `design.md`, `tasks.md`, or `spec.md` appear in the request.

## Workflow

1. Resolve whether `openspec/` and `opsx-*` are the right path.
2. Resolve the active change name or path.
3. Preserve slash-command compatibility before recommending execution.
4. Apply the canonical phase order in `tasks.md`.
5. Decompose implementation into execution-ready slices with sequential numeric task IDs only.
6. Stop and use `grill-with-docs` when shared understanding is not yet polished.
7. Author or normalize `README.md`, `proposal.md`, `design.md`, `tasks.md`, and `spec.md`.
8. Keep changelog, docs, diagrams, sync, and archive-readiness in final closeout only.
9. Validate artifacts before handoff.
10. Recommend one exact next command.

## Change Profiles

Classify the change before shaping the artifacts:

- `runtime-change`
  - use when behavior, contract, persistence, integration, or UI behavior changes
- `docs-or-governance-change`
  - use when the change only updates documentation, policy, ADRs, standards, or diagrams
- `mixed-change`
  - use when the change combines runtime work with documentation or governance work

Keep the canonical phase order for every profile.
Scale the depth of each phase to the smallest safe level for that profile.

## Compatibility Rules

- `proposal.md` must include `## Notes`.
- Every checkbox task in `tasks.md` must include an adjacent `Traceability:` line.
- Completed tasks should also include an adjacent `Notes:` line.
- Use sequential numeric task IDs only:
  - `0.1`, `1.1`, `2.1`, `2.2`, `3.1`
- Do not mix numeric task IDs with alphabetic subsection IDs such as `2A`, `2B`, or `2C`.
- Use semantic markdown headings for grouping, not for task identifiers.

## Clarification Protocol

When repo docs, proposal artifacts, and user intent do not yet form a polished
shared understanding:

1. Stop before implementation planning.
2. Use `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill`.
3. Ask one focused question only.
4. Present exactly three alternatives.
5. Recommend one option as the safest and most professional default.
6. Wait for the human answer.
7. Record the resolved decision in `proposal.md` or `design.md`.
8. Continue only after the ambiguity is closed.

## Entry and Exit Gates

### Clarification Required

Stop before implementation planning when any of these are true:

- the ownership boundary is unclear
- the user intent and repo evidence disagree
- more than one materially different behavior could satisfy the request
- the affected contract or source of truth is still ambiguous

### Implementation Ready

Declare a spec `Implementation Ready` only when all of these are true:

- scope is locked through investigation
- no material ambiguity remains open
- the active change profile is explicit
- `tasks.md` follows the canonical phase order
- every task has `Traceability:`
- phase `1` is present when behavior, contract, persistence, integration, UI behavior, or regression risk changes
- if phase `1` is omitted, `proposal.md` explicitly justifies why fail-first coverage is not required
- implementation tasks are decomposed into minimal safe slices
- release hygiene work is deferred to final closeout
- one exact next command is recommended

### Ready for Execute

Recommend `/execute <change> <task-selector>` only when the spec is already
`Implementation Ready`.

## Implementation Boundary

Inside `## 2. Implementation`, plan execution-ready slices only.

Each task should be:

- minimal
- independently understandable
- independently testable
- independently reviewable
- bounded to one primary seam unless splitting would make the plan less safe

Prefer separate tasks when:

- ownership changes
- test type changes
- one seam can be validated without another
- a combined task would hide blast radius

## Closeout Boundary

Keep these in `## 4. Release Hygiene and Closeout` unless a clarification must
be written earlier:

- `CHANGELOG.md`
- user docs
- operational docs
- diagrams
- spec sync
- archive readiness

Do not schedule them in implementation planning unless they are required to
resolve a design ambiguity before `/execute`.

## Validation

When `openspec/` exists, prefer these checks:

- `openspec list --json`
- `openspec status --change "<change-name>" --json`
- `openspec instructions apply --change "<change-name>" --json`
- `openspec instructions proposal --change "<change-name>" --json` only when artifact diagnosis is needed
- `openspec validate "<change-name>"`

## Command Routing

Choose one exact next command from the current state:

- use `/opsx-new <change-name>` when the change does not exist yet
- use `/opsx-continue <change-name>` when the change exists but artifacts are partial or stale
- use `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill` when clarification is required
- use `/plan source=openspec <change-name>` when the change is clear enough to author artifacts but is not yet `Implementation Ready`
- use `/execute <change-name> <task-selector>` only after the spec is `Implementation Ready`
- use `/opsx-verify <change-name>` when implementation has happened and alignment must be checked
- use `/opsx-sync <change-name>` when implemented deltas must be synchronized into canonical specs
- use `/opsx-archive <change-name>` only after verification and sync are complete

## Output Expectations

Always report:

- whether this workflow is appropriate
- which artifact was created, refined, or normalized
- what compatibility fixes were applied
- whether clarification through `grill-with-docs` is required
- whether the spec is `Implementation Ready` or still blocked
- the exact next command to run

## Stop Conditions

Stop and report a blocker when:

- OpenSpec was requested but `openspec/` does not exist
- the change requires a broader seam than declared
- tasks are too vague to implement safely
- artifact structure conflicts with slash-command expectations
- accounting, export, canon, schema, approval, or workflow behavior would widen silently
- human and artifact understanding are still materially misaligned
