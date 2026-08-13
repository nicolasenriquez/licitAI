---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly and single test files regularly (fail fast). At the
end, run the affected unit test suites only: `npx nx lint:diff-with-main <pkg>`,
`npx nx typecheck <pkg>`, and focused jest. Never run the full test suite or CI
(`just ci*`) unless the user explicitly requests it.

Once done, use `/code-review` only when the current user explicitly requests a code review; ticket closeout does not depend on review.

For a local Markdown ticket passed to this skill, the ticket file is the execution source of truth, even when an OpenSpec is linked:

- Read and update only that ticket.
- Before implementation, append a dated start entry under `## Progress`; create the section if it is missing.
- Append only material milestones, blockers, and validation results during implementation.
- After each task or acceptance criterion passes implementation and required validation, immediately replace its `- [ ]` with `- [x]`, append one dated progress milestone with evidence, and save the ticket before continuing. Never batch checkbox updates at closeout.
- If any task or acceptance criterion is blocked or incomplete, leave its checkbox unchecked, leave `Status` unchanged, and append the blocker.
- After final validation, re-read the ticket. Completion gate: zero unchecked task or acceptance checkboxes remain.
- If the completion gate passes, replace the existing top `Status:` line with `Status: done`; never append a duplicate status. Add `Completed: <current date>`, `Evidence: <repo-relative path or validation command>`, and a final progress entry.
- Commit the ticket update with the implementation, staging only files belonging to this work.

Commit your work to the current branch.
