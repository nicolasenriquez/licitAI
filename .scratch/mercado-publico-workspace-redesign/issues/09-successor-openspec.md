# Author the successor OpenSpec change

Type: task
Status: resolved
Blocked by: 08

## Question

What exact proposal, design, delta specifications, and tasks authorize the later
production implementation without conflicting with the existing command-center
change?

## Work

- Use the repository OpenSpec workflow and route through `openspec/` contracts.
- Reference, supersede, or amend the existing change explicitly; do not leave
  two ambiguous behavioral authorities.
- Encode validated UI composition, supported visible data, null/partial states,
  accessibility, themes, responsive behavior, rollout, and compatibility.
- Separate any backend contract expansion into its own authorized scope.
- Define narrow tests and Nx validation for affected consumers.
- Include removal criteria for bespoke presentation code after parity.

## Exit evidence

- Valid successor OpenSpec artifacts ready for apply.
- Traceability from prototype decisions and data matrix to requirements/tasks.
- Explicit non-goals and migration/rollback strategy.

## Answer

Created and validated the proposal-ready successor OpenSpec change
`mercado-publico-workspace-redesign`. It explicitly supersedes only the
Mercado Público presentation requirements of `mercado-publico-command-center`;
the existing change remains authoritative for current backend reads, GraphQL,
route, and CLI-only ingestion. The artifacts trace the validated prototype and
data matrix into supported browse/detail and Control Center requirements,
failing-first tests, native SidePanel integration, responsive/a11y parity,
safe bespoke-code removal, and frontend-only rollout/rollback. No backend
contract expansion is authorized; any such need is a separate change.

Validation: `openspec validate mercado-publico-workspace-redesign` passes and
`openspec status --change mercado-publico-workspace-redesign --json` reports
proposal, design, specs, and tasks complete.
