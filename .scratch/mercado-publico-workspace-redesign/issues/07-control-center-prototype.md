# Simplify the Centro de Control prototype

Type: prototype
Status: resolved
Blocked by: 02, 03

## Question

How can Centro de Control communicate diagnosis, investigation, and integrity
with less bespoke dashboard chrome and no unsupported KPI theater?

## Work

- Preserve the existing continuous read-only structure unless evidence rejects
  it: Diagnostico, Investigacion, Integridad.
- Use server facts and approved complete-input derivations only.
- Prototype calm hierarchy for pipeline, quota, CSV, jobs/API calls, freshness,
  warnings, and redacted technical detail.
- Keep one primary heavy investigation table; avoid nested-card grids.
- Make unavailable or partial values explicit instead of visually implying zero.

## Exit evidence

- Reviewed Centro de Control prototype states.
- Formula/source note for every derived display.
- Rejected list of attractive but unsupported HTML metrics.

## Answer

Select variant A: one continuous read-only sequence, Diagnostico,
Investigacion, Integridad. Variants B and C were rejected after review: a
three-item side index adds navigation without reducing work, while placing
diagnostic and integrity tables side by side creates avoidable horizontal
overflow and dashboard density.

The accepted isolated Storybook prototype is
`packages/twenty-front/src/modules/mercado-publico/components/__stories__/MercadoPublicoControlCenterPrototype.stories.tsx`.
It covers healthy, partial, empty, and error states. Partial responses omit
unreturned pipeline/CSV facts explicitly rather than displaying zero. The one
heavy investigation table switches between job runs and API calls, follows
`hasMore` pagination without claiming a total, and exposes server-redacted
request parameters through progressive detail.

Derived-display note:

- Quota remaining is the only arithmetic display:
  `max(0, dailyLimit - used)`, scoped to one returned source row. Both inputs
  are complete supported quota facts. No cross-source total is calculated.
- Pipeline lag/failure count, job/API facts, CSV counts/status, timestamps, and
  page scope are displayed as returned facts, not quality or freshness scores.

Rejected unsupported metrics:

- Pipeline or CSV fresh/stale badges and expected cadence.
- Combined quota allowance across source rows.
- Global job/API success or error rates from offset pages.
- Coverage, completeness, quality, confidence, or approval percentages.
- Missing values interpreted as zero, no failure, or no risk.

Focused validation passed with `yarn nx typecheck twenty-front`. `oxfmt`
completed on the story. Repository oxlint ignores this Storybook path; forcing
`--no-ignore` triggers an oxlint internal panic. The Storybook build target
still fails before bundling because its POSIX `NODE_OPTIONS=...` assignment is
not valid in Windows `cmd`. Browser, theme, zoom, and visual accessibility
checks remain the explicit ticket 08 gate.
