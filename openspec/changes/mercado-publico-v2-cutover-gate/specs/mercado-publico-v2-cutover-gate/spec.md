## ADDED Requirements

### Requirement: Canonical Mercado Publico route is an atomic composition choice
The system SHALL use `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` to select exactly
one complete authenticated composition at `/mercado-publico`. When enabled, it
SHALL mount Mercado Publico V2. When disabled, it SHALL mount the retained
legacy command-center composition. It SHALL NOT combine legacy and V2 components
in one routed view.

#### Scenario: V2 cutover build serves canonical Activas
- **WHEN** an authenticated user opens `/mercado-publico` in a build with the
  V2 flag enabled
- **THEN** the user receives V2 Activas and no legacy command-center component
  is mounted in that route

#### Scenario: Rollback build serves canonical legacy
- **WHEN** an authenticated user opens `/mercado-publico` after deployment with
  the V2 flag disabled
- **THEN** the user receives retained legacy command center and V2 subroutes are
  not mounted

### Requirement: Private legacy alias remains available during G4 observation
The system SHALL mount retained historical `MercadoPublicoCommandCenterPage` at
authenticated private `/mercado-publico/legacy` in enabled and disabled builds.
It SHALL restore only that selected legacy module and its compilation-required
dependencies. It SHALL NOT restore or redesign broader legacy Browse, V1/CSV, or
GraphQL surfaces.

#### Scenario: Release operator performs parity smoke
- **WHEN** an authenticated release operator opens canonical V2 and the private
  legacy alias in an enabled build
- **THEN** V2 passes its defined smoke checks and legacy completes one read-only
  journey by opening Compra Ágil, opening one process detail, and closing it
  without losing list context; browser evidence is captured separately and no
  V1-to-V2 field comparison occurs

### Requirement: Legacy alias uses only the historical read contract
The retained legacy alias SHALL expose its seven historical read-only GraphQL
queries: detected processes, process detail, job runs, API call log, pipeline
health, API quota usage, and CSV file health. It SHALL NOT restore a legacy
mutation.

#### Scenario: Legacy control tab is opened
- **WHEN** an authenticated user opens the historical Centro de Control tab
- **THEN** each required read query is available and no legacy mutation exists

### Requirement: Route rollback preserves V2 durable evidence
The system SHALL roll back by deploying the disabled complete route composition.
It SHALL NOT run a data migration, transform V1/CSV data, or delete `mp` V2
evidence, projections, SyncRuns, commands, attempts, or audit records.

#### Scenario: Release operator rolls back after V2 cutover
- **WHEN** the release operator deploys the disabled build and runs authenticated
  canonical and alias smoke
- **THEN** canonical legacy is restored and recorded evidence confirms retained
  V2 data and G3 operational records are unchanged

### Requirement: G4 release gate requires complete local evidence
The system SHALL not authorize G5 retirement until local evidence records:
authenticated parity smoke; complete local harness passing lifecycle, evidence,
analytics, security, navigation, and cutover gates; rollback demonstration; two
consecutive correct daily V2 cycles; and human review of every visual-baseline
change. Cloud smoke SHALL run only with explicit URL, identity, authorization,
and allowed data.

#### Scenario: Daily observation gate completes
- **WHEN** one correct V2 cycle completes on each of two consecutive
  `America/Santiago` calendar dates with correct cohort,
checkpoint, projection, and watermark evidence and all local gates pass
- **THEN** the release record contains sufficient evidence to approve or reject
G5 retirement without claiming cloud validation

### Requirement: G5 rollback uses the approved G4 release reference
The final G4 release record SHALL identify one immutable approved release tag.
The private legacy alias and its retained dependency closure SHALL
remain available through G4 observation. When G5 starts, its rollback procedure
SHALL deploy that approved tag instead of retaining a live legacy route.

#### Scenario: G5 retirement fails after legacy removal
- **WHEN** G5 requires rollback after the live legacy route is removed
- **THEN** the operator deploys the release tag recorded by G4 and follows
  its verified G4 rollback procedure
