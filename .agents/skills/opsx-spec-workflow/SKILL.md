---
name: opsx-spec-workflow
description: Standardize legacy OpenSpec and `opsx-*` spec work in repositories that still use `openspec/`. Use when the repo contains `openspec/`, the user references `openspec/changes/**`, `/plan source=openspec`, or `opsx-*`, or asks to author, refine, normalize, grill, verify, sync, or archive a legacy spec-driven change. Stop at `Proposal Ready for Implementation` and defer `/execute` until the user explicitly asks to start implementation.
---

# Opsx Spec Workflow

Use this skill only for repos that still actively use `openspec/` or when the
user explicitly requests the legacy OpenSpec workflow.

Read only what is needed:

- the active change folder under `openspec/changes/<change-name>/`
- `.agents/skills/grill-with-docs/SKILL.md`
- [references/opsx-command-contract.md](references/opsx-command-contract.md)
- [references/opsx-house-style.md](references/opsx-house-style.md)
- [references/artifact-templates.md](references/artifact-templates.md)
- [references/harness-compatibility.md](references/harness-compatibility.md)
- nearby archived changes only when style calibration is needed

Read the native harness adapter only when needed to resolve command
compatibility or repo-local workflow expectations.

## Core Rule

Treat slash commands as the workflow engine and this skill as the policy,
authoring, normalization, and proposal-readiness layer.

This workflow exists to close design and handoff, not to authorize
implementation.

Do not replace `/plan`, `/execute`, `/grill-with-docs`, `/opsx-sync`, or
`/opsx-archive`.

Stop at `Proposal Ready for Implementation`. Implementation starts later and
only after the user explicitly asks for `/execute`.

## Activation Gate

Use this skill only when at least one of these is true:

- the repo contains `openspec/`
- the user references `openspec/changes/**`
- the user asks for `/plan source=openspec`
- the user references `opsx-*` commands
- the user explicitly asks for legacy OpenSpec workflow handling

Do not trigger this skill only because generic artifact names such as
`proposal.md`, `design.md`, `tasks.md`, or `spec.md` appear in the request.

If the user is already asking to implement tasks, hand off to `/execute`
instead of treating this skill as an implementation surface.

## Operating Sequence

1. Confirm that `openspec/` and `opsx-*` are the right workflow.
2. Resolve the active change name or path.
3. Investigate first and lock the ownership boundary before planning slices.
4. Use the canonical phase order from
   [references/opsx-house-style.md](references/opsx-house-style.md).
5. Author or normalize `README.md`, `proposal.md`, `design.md`, `tasks.md`,
   and `spec.md` only as needed for the active change.
6. Shape `## 2. Implementation` into implementation-ready slices with
   sequential numeric task IDs only.
7. Stop and use `grill-with-docs` when shared understanding is not yet
   polished.
8. Validate artifacts and stop cleanly once they are proposal-ready.

## Authoring Rules

Keep the active change profile explicit:

- `runtime-change`
- `docs-or-governance-change`
- `mixed-change`

Keep artifacts compatible with local command expectations:

- `proposal.md` must include `## Notes`
- every checkbox task in `tasks.md` must include an adjacent `Traceability:` line
- completed tasks should also include an adjacent `Notes:` line
- use sequential numeric task IDs only such as `0.1`, `1.1`, `2.1`, `2.2`
- do not mix numeric task IDs with alphabetic subsection IDs
- use semantic headings for grouping, not for task identifiers

Use [references/opsx-house-style.md](references/opsx-house-style.md) as the
authoring source of truth for phase order, slice heuristics, and exit-gate
quality. Inside `## 2. Implementation`, plan only minimal implementation-ready
slices.

Keep changelog, docs, diagrams, sync, and archive-readiness in
`## 4. Release Hygiene and Closeout` unless they are needed earlier to resolve
an ambiguity.

## Clarification Protocol

When repo docs, proposal artifacts, and user intent do not yet form a polished
shared understanding:

1. Stop before implementation planning continues.
2. Use `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill`.
3. Ask one focused question only.
4. Present exactly three alternatives.
5. Recommend one option as the safest and most professional default.
6. Wait for the human answer.
7. Record the decision in `proposal.md` or `design.md`.
8. Continue only after the ambiguity is closed.

## Workflow States

Use this state machine as the exit contract:

- `blocked`
  - use when ownership, intent, or contract ambiguity still prevents safe planning
  - return one exact next command only
- `in-progress`
  - use when artifacts still need authoring or normalization
  - return one exact next command only
- `proposal-ready`
  - use only when the spec satisfies the exit gate in
    [references/opsx-house-style.md](references/opsx-house-style.md)
  - report `Proposal Ready for Implementation`
  - stop without recommending a mandatory next command
  - mention `/execute <change> <task-selector>` only as a later entrypoint if
    the user explicitly decides to start implementation

Use one exact next command only while the spec is incomplete or blocked:

- `/opsx-new <change-name>` when the change does not exist yet
- `/opsx-continue <change-name>` when the change exists but artifacts are
  partial or stale
- `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill`
  when clarification is required
- `/plan source=openspec <change-name>` when the change is clear enough to
  author artifacts but is not yet `Proposal Ready for Implementation`
- `/opsx-verify <change-name>` when implementation has already happened and
  alignment must be checked
- `/opsx-sync <change-name>` when implemented deltas must be synchronized into
  canonical specs
- `/opsx-archive <change-name>` only after verification and sync are complete

## Validation

When `openspec/` exists, prefer these checks:

- `openspec list --json`
- `openspec status --change "<change-name>" --json`
- `openspec instructions apply --change "<change-name>" --json`
- use `openspec instructions proposal --change "<change-name>" --json` only
  when artifact diagnosis is needed
- `openspec validate "<change-name>"`

Always report:

- whether this workflow is appropriate and which artifacts were created,
  refined, or normalized
- what compatibility fixes were applied and whether clarification through
  `grill-with-docs` is required
- whether the spec is blocked, in progress, or `Proposal Ready for Implementation`
- the exact next command only when the spec is blocked or in progress
- when proposal-ready, that implementation is deferred pending explicit user
  instruction

## Stop Conditions

Stop and report a blocker when:

- OpenSpec was requested but `openspec/` does not exist
- the change requires a broader seam than declared
- tasks are too vague to implement safely
- artifact structure conflicts with slash-command expectations
- accounting, export, canon, schema, approval, or workflow behavior would widen
  silently
- human and artifact understanding are still materially misaligned
## Authoring Quality Gates

Before planning slices, Phase 0 must identify the highest existing Seam, its
owning Module and Interface, and the highest test Seam through which callers and
tests can observe the behavior. Prefer an existing Seam; explain why a lower
Seam is necessary when one is proposed.

When runtime, contract, persistence, integration, UI, or regression risk exists,
Phase 1 must name the first failing behavior or contract proof and relevant test
prior art. The proof crosses the chosen Seam and asserts external behavior.

Phase 2 tasks must be vertical, bounded, demoable or verifiable on their own,
and small enough for one fresh context when practical. Use real Blocked by edges
only when a dependency gates work. Use expand -> migrate -> contract for wide
refactors. Add Execution Order when there is more than one slice, a real
dependency between phases, parallel work, or a wide refactor that could be
misread as numeric order. Keep numeric IDs stable, list each task once in that
block, and reject missing IDs or cycles. Layer headings group tasks; they do not
define execution order.

Use the selected Matt rules as guidance only:

- grilling / grill-with-docs: clarify intent, ownership, and scope one question
  at a time; preserve the Opsx protocol of exactly three alternatives and one
  recommendation. The available skill is .agents/skills/grill-with-docs/SKILL.md.
- codebase-design: use Module, Interface, Seam, Adapter, Depth, Locality, and
  Leverage.
- to-spec: prefer the highest existing Seam, external behavior, and test prior
  art.
- to-tickets: use vertical tracer-bullet slices, genuine blockers, and
  expand-contract.

OpenSpec remains the sole source of truth. Do not run Matt commands that publish
tracker work or create parallel artifacts during normal Opsx authoring; in
particular, do not invoke to-spec or to-tickets as authoring steps.
