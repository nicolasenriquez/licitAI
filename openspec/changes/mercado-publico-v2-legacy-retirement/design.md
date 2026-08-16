## Context

G5 is a contraction change after reversible G4 cutover. Its safe seam is the
actual consumer boundary, not the `mercado-publico` directory. A candidate can
appear in a route, import, GraphQL resolver, provider registration, job, CLI,
test, story, fixture, or generated artifact. The module, router, and isolated
harness therefore provide the highest useful seams for removal proof.

## Goals / Non-Goals

**Goals**
- Remove only G4-approved, V2-replaced legacy consumers in dependency-reverse order.
- Keep each destructive batch independently observable and reversible through
  the retained rollback reference and version control.
- End with evidence that no active displaced consumer remains.

**Non-Goals**
- Replace V1/CSV with new behavior.
- Delete committed migrations or V2/G3 evidence.
- Retire any candidate that G4 needs for rollback or that the inventory cannot
  prove unused.

## Boundary and Ownership

### Candidate inventory

The inventory is a planning and proof adapter. Its Interface records, for every
candidate, owner, V2 replacement, active consumers, test/evidence consumers,
removal batch, and rollback constraint. It has high Locality because it turns a
wide destructive search into small explicit decisions. A candidate with an
unknown replacement or consumer remains retained.

### Runtime contraction

`MercadoPublicoModule` owns service, driver, command, job, and resolver
registration. `AppRouter` owns routed composition. Generated GraphQL output is
an Adapter derived from source contracts, never an independently deleted
contract. The removal Interface is: source registrations and consumers are
removed only after their replacement and zero-consumer proof pass.

### Certification

The isolated authenticated harness owns browser-visible proof. The final record
is `retirement-evidence.md` in this change. It links the candidate manifest,
tests, graph/search output, codegen, visual evidence, G4 approval and rollback
reference, and preserved historical artifacts. A human approves it only after all
automated evidence is green. It does not assert cloud evidence without the
required explicit authority.

## Decisions

1. Use four sequential, evidence-gated retirement slices.

   Rationale: routes and GraphQL consumers are the outer dependency layer;
   visual artifacts follow; V1/CSV services are last; certification can then
   attest the complete result.

   Alternatives considered:
   - One repository-wide deletion.
     - Rejected because a green compile cannot prove rollback or zero consumers.
   - Delete V1/CSV services first.
     - Rejected because routes, tests, jobs, and GraphQL can still depend on them.

2. Keep the G4 gate-close decision as an external hard gate.

   Rationale: only G4 has authority to prove parity, rollback, daily cycles,
   and human visual review before irreversible retirement.

   Alternatives considered:
   - Re-run a reduced G4 check in G5.
     - Rejected because it weakens the defined release authority and duplicates proof.

3. Preserve all committed migrations and V2 evidence.

   Rationale: migration history is immutable and V2 evidence remains required
   for audit and recovery after legacy removal.

   Alternatives considered:
   - Clean historical migrations with the legacy source.
     - Rejected because it rewrites deployed history and widens data risk.

4. Retain shared services that V2 still consumes.

   Rationale: splitting shared services would widen retirement into a V2
   refactor. G5 removes only unused V1/CSV branches after consumer proof.

   Alternatives considered:
   - Split every shared service to remove V1/CSV names.
     - Rejected because it adds new runtime behavior to a contraction change.
   - Retain every shared module and defer V1/CSV retirement.
     - Rejected because unused branches remain maintainable debt.

5. Retire legacy GraphQL as an internal contract.

   Rationale: G5 uses G4 approval and zero in-repository consumers as its
   removal boundary. It does not add a deprecation release for legacy GraphQL.

   Alternatives considered:
   - Keep a deprecation release.
     - Rejected because it retains a second contract without a consumer need.
   - Exclude legacy GraphQL from G5.
     - Rejected because it leaves a displaced runtime consumer.

6. Define zero consumers at runtime and contract seams.

   Rationale: route, import, GraphQL, DI, job, scheduler, and CLI consumers
   can execute or expose legacy behavior. Historical tests and evidence remain
   non-executable references and do not block retirement.

7. Require human approval for final certification.

   Rationale: destructive retirement needs an accountable final decision after
   automated evidence proves the technical gates.

   Alternatives considered:
   - Use automated evidence alone.
     - Rejected because it cannot approve release authority.
   - Reuse G4 approval with no G5 approval.
     - Rejected because G4 does not attest final deletions.

## Blast Radius

### Touched runtime areas
- G4-approved legacy frontend routes and consumers.
- Legacy GraphQL source consumers and regenerated client/server contracts.
- V1/CSV provider registrations, jobs, scheduler, CLI, tests, stories, styles,
  fixtures, and prototypes that the inventory proves displaced.

### Untouched runtime areas
- V2 `mp` schema, durable evidence/projections, SyncRun control and audit,
  provider access policy, committed migrations, and the G4 gate-close record.

## Verification Strategy

- Create a candidate manifest from import, graph, route, GraphQL, provider, job,
  CLI, test, story, fixture, and search evidence before every batch.
- Add failing candidate-specific assertions before removal. Regenerate GraphQL
  only from retained source and check consumer compatibility.
- After each batch, run focused affected tests, codegen when applicable,
  authenticated smoke, and visual/a11y checks. Stop and retain the candidate on
  any unresolved consumer or failed proof.
- Run the complete local harness after the final batch and publish certification
  that links G4 and preserves historical artifacts as evidence.
