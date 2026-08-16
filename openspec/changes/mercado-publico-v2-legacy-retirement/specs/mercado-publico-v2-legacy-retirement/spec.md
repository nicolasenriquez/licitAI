## ADDED Requirements

### Requirement: Retirement requires explicit G4 authorization and candidate proof
The system SHALL NOT remove a legacy Mercado Publico candidate until the G4
gate-close decision explicitly approves G5. For every proposed
candidate, the retirement record SHALL identify its owner, accepted V2
replacement, active consumers, test/evidence consumers, removal batch, and
rollback constraint. A candidate with an unresolved consumer or replacement
SHALL remain retained.

#### Scenario: G4 has not approved retirement
- **WHEN** G4 lacks a completed gate-close decision that approves G5
- **THEN** no legacy candidate is removed

#### Scenario: Candidate remains in use
- **WHEN** imports, graph, routes, GraphQL, jobs, CLI, tests, stories, fixtures,
  or search show a candidate consumer
- **THEN** the candidate remains retained and the batch stops

#### Scenario: Historical evidence references a removed candidate
- **WHEN** a historical test or evidence record names a removed candidate but
  has no executable runtime or contract consumer
- **THEN** the reference remains as evidence and does not block retirement

### Requirement: UI and GraphQL consumers retire before lower legacy layers
The system SHALL remove only G4-approved displaced UI routes, imports, and
internal GraphQL consumers that have accepted V2 replacements. It SHALL
regenerate derived GraphQL artifacts from retained source. It SHALL remove the
G4 legacy route only after the G4-approved rollback reference is verified as the
G5 rollback procedure.

#### Scenario: Displaced route and GraphQL consumer are removed
- **WHEN** a candidate manifest proves the route and GraphQL consumer are
  replaced and unused
- **THEN** the source is removed, derived artifacts regenerate cleanly, and
  post-removal proof shows no reference to that consumer

### Requirement: Visual retirement preserves shared and evidentiary assets
The system SHALL remove displaced prototypes, stories, styles, and visual assets
only after it proves they have no productive or required test consumer. It SHALL
retain shared Twenty primitives, tokens, and patterns. It SHALL migrate stable
evidence fixtures before their source is removed.

#### Scenario: Stable fixture remains useful
- **WHEN** a displaced story or fixture still provides stable required evidence
- **THEN** the evidence is migrated or retained before its former owner is removed

### Requirement: V1 and CSV runtime retirement preserves data safety
The system SHALL remove V1/CSV drivers, services, jobs, scheduler entries, CLI
paths, GraphQL consumers, and orphaned tests only after zero active consumers
are proven. It SHALL NOT delete or transform V2 evidence or alter committed
migration logic. It SHALL retain a shared service when V2 still consumes it and
remove only its unused V1/CSV branches. It SHALL keep the approved rollback and
data-recovery procedure documented and testable.

#### Scenario: V1/CSV service has no active consumer
- **WHEN** module registration, imports, jobs, CLI, scheduler, GraphQL, and
  search show no consumer of the service
- **THEN** the service and its orphaned tests may be removed while migration and
  V2 evidence invariants remain unchanged

### Requirement: Final certification proves zero displaced consumers
The system SHALL publish a final certification record after all approved batches.
The record SHALL be `retirement-evidence.md` in this change and link graph/search
results, tests, authenticated smoke, visual evidence, GraphQL/codegen
compatibility, G4 approval and rollback reference, PRD, source issues, and prior
OpenSpec evidence. A human SHALL approve the record after all automated evidence
is green. A prior OpenSpec SHALL be marked `superseded` only with the required
human approval.

#### Scenario: Reconstruction closes successfully
- **WHEN** the full local harness passes after retirement and the certification
  record proves zero displaced consumers
- **THEN** the record identifies the retained authorities and no reconstruction
  work remains assigned to a prior OpenSpec

#### Scenario: Automated evidence is green but final approval is absent
- **WHEN** `retirement-evidence.md` contains all automated evidence but no human
  approval
- **THEN** G5 remains uncertified
