## Why

Mercado Publico V2 still shares its module with V1 and CSV consumers. Retiring
them before the completed G4 cutover gate would remove the only tested rollback
path and could destroy required evidence. Keeping proven-displaced consumers
after G4 also leaves duplicate routes, contracts, services, and maintenance
costs.

## Investigation / Current State

- `MercadoPublicoModule` currently registers both V2 services and V1/CSV
  services, commands, jobs, and integration suites.
- `AppRouter` mounts V2 routes only when
  `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` is enabled. G4 owns the retained
  private legacy alias and the canonical route rollback contract.
- The existing V2 Playwright suites and server integration suites are the
  relevant behavior proof. They do not prove that a particular V1/CSV consumer
  is safe to remove.
- G4 has no completed tasks. Its final release record must explicitly approve
  G5 before any deletion begins.

## What Changes

- Inventory and classify legacy UI, GraphQL, V1/CSV, scheduler, CLI, story,
  style, fixture, and generated consumers after G4 approval.
- Retire only a batch that has a documented V2 replacement and zero active
  consumers. Preserve V2 evidence, G3 audit records, committed migrations, and
  the G4 rollback record.
- Prove each retirement batch through imports, graph/search results, focused
  tests, GraphQL code generation when applicable, authenticated smoke, and
  visual evidence.
- Publish one final certification record that links the source decisions and
  evidence without making the prior umbrella change authoritative again. A human
  approves the record only after all automated evidence is green.

## Change Profile

- Profile: runtime-change
- Why this profile fits: removing routes, GraphQL consumers, services, jobs,
  and CLI paths changes observable runtime behavior.

## Out Of Scope

- Starting retirement before the G4 final release record approves it.
- Repairing or redesigning V1/CSV behavior to make it removable.
- Changing V2 ingestion, projections, `mp` evidence, SyncRun, G3 permissions,
  or the G4 route/rollback contract.
- Editing committed migration `up` or `down` logic, deleting evidence, or
  treating generated output as a source of truth.

## Ownership and Test Seam

- Highest existing Seam: the Mercado Publico module registrations and the
  authenticated route/GraphQL consumers that expose each candidate.
- Owning Module: `packages/twenty-server` Mercado Publico module for runtime
  providers, jobs, commands, and GraphQL; `packages/twenty-front` AppRouter for
  routed consumers; `packages/twenty-e2e-testing` for authenticated proof.
- Interface: a candidate may be removed only when its named V2 replacement is
  accepted, all active consumers are absent, and G4 approval remains valid.
  Shared services remain when V2 still consumes them; G5 removes only unused
  V1/CSV branches.
- Highest test Seam: focused module and resolver tests plus the isolated
  authenticated Mercado Publico Playwright harness.
- Adapter: imports/provider registration, GraphQL generated types, route table,
  scheduler/CLI registration, and Playwright configuration.
- Depth / Leverage / Locality: the inventory keeps destructive decisions at the
  smallest observable owner instead of deleting by filename or broad pattern.

## Prior Art and First Proof

- Prior art: `mercado-publico-v2-cutover-gate` route-matrix and release-gate
  evidence; existing `tests/mercado-publico` Playwright suites; V1/CSV and V2
  integration suites under `packages/twenty-server/test/integration/mercado-publico`.
- First failing behavior or contract proof: before a deletion, a focused
  consumer inventory must fail when the candidate still has an import, route,
  GraphQL operation, provider, job, CLI, test, story, or fixture dependency.

## Execution Order Decision

- Required: yes
- Why: consumer removal must precede visual artifact removal, which must precede
  V1/CSV service contraction and final certification.

## Impact

- Affects only G4-approved legacy Mercado Publico consumers in front, server,
  shared paths/types, generated GraphQL output, and isolated test assets.
- Affects focused module, integration, codegen, and authenticated E2E proof.
- Does not change migrations, V2 durable evidence, V2 contracts, provider
  behavior, or the G4 rollback procedure.

## Verification Policy

- Add fail-first, candidate-specific zero-consumer proof at the owning seam.
- Verify every deletion through focused tests and the complete authenticated
  harness. Use codegen when GraphQL source changes.
- Do not treat a broad green suite as proof of zero consumers.

## Notes

- Source map: `.scratch/mercado-publico-v2-reconstruction/implementation-sdlc-map.md`;
  Group: G5.
- Source implementation issues: 32, 33, 34, and 35.
- Precondition: G4 Issue 31 final release record explicitly approves G5. Until
  then, this change is planned but operationally blocked.
- Boundary: the existing partial umbrella change remains evidence only and is
  not modified, split, superseded, or continued by this change.
- Human decision: G5 does not split shared services. It removes only unused
  V1/CSV branches and retains shared services that V2 consumes.
- Human decision: legacy GraphQL operations are internal. G5 removes them after
  G4 approval and zero in-repository consumers; it has no deprecation release.
- Human decision: zero consumers means zero runtime and contract consumers:
  routes, imports, GraphQL, DI, jobs, scheduler, and CLI. Historical tests and
  evidence may remain as non-executable references.
- Human decision: `retirement-evidence.md` is the single change-local candidate
  manifest and final certification record. Human approval is required after its
  automated evidence is green.
