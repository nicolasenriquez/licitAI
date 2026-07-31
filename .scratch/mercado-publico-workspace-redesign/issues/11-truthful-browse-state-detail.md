# Restore truthful browse state/detail coupling

Type: task
Status: resolved
Blocked by: -

## Question

How should the isolated browse/detail prototype prevent a populated detail from
appearing current while the browse list is loading, empty, or failed?

## Work

- Suppress the selected detail for initial loading, empty, and error states, or
  explicitly identify genuinely retained context if that behavior is intended.
- Keep source-pending distinct: a selected process may remain visible while its
  family-specific source is unavailable.
- Add focused stories or assertions that prevent fixture detail from leaking
  into unavailable list states.
- Preserve filter/selection context only when the UI can state its provenance
  truthfully.

## Exit evidence

- Loading, empty, and error screenshots contain no detail presented as current.
- Source-pending still explains absent family detail without zero substitution.
- Keyboard selection in loaded states remains unchanged.

## Answer

The prototype now treats a selected process as visible only while its browse
list is available (`loaded` or `source-pending`). Loading, empty, and error
states retain no process summary or fixture fields; the detail panel states
that it will become available when the list can be shown. This preserves
selection only where its provenance is visible.

`source-pending` remains distinct: it still displays the selected process
summary and explicitly withholds family-specific Compra Agil values without
zero substitution. Loaded keyboard selection remains available.

The focused local Playwright audit asserts and captures loading, empty, error,
source-pending, and loaded selection. Its results show zero summary fields and
the unavailable-state notice for all three unavailable states; source-pending
retains three summary fields; keyboard selection moves the loaded detail to
`CA-FIXTURE-002`. See
[audit results](../artifacts/11-truthful-browse-state-detail/results.json),
[loading](../artifacts/11-truthful-browse-state-detail/loading.png),
[empty](../artifacts/11-truthful-browse-state-detail/empty.png),
[error](../artifacts/11-truthful-browse-state-detail/error.png), and
[source pending](../artifacts/11-truthful-browse-state-detail/sourcePending.png).

`yarn nx typecheck twenty-front --skip-nx-cache` passes. The static,
modules-scoped Storybook build used for the audit also passes; it avoids an
unrelated Windows dev-server HMR loop.
