---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

For a local Markdown ticket passed to this skill:

- Read and update only that ticket.
- Before implementation, append a dated start entry under `## Progress`; create the section if it is missing.
- Append only material milestones, blockers, and validation results during implementation.
- After validation and review, check every acceptance criterion that actually passes.
- If every criterion passes, set `Status: done`, add `Completed: <current date>`, add `Evidence: <repo-relative path or validation command>`, and append a final progress entry.
- If work is blocked or incomplete, leave `Status` unchanged and append the blocker.
- Commit the ticket update with the implementation, staging only files belonging to this work.

Commit your work to the current branch.
