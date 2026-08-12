## ADDED Requirements

### Requirement: Isolated E2E provisioning protects the canonical project
The Mercado Publico E2E provisioner SHALL reject a Compose project named
`twenty` before it invokes Docker Compose. It SHALL report that `twenty` is the
canonical local runtime and SHALL not start, stop, remove, build, or recreate
resources in that project.

#### Scenario: Caller selects canonical project
- **WHEN** `MERCADO_PUBLICO_V2_E2E_COMPOSE_PROJECT` equals `twenty`
- **THEN** the provisioner fails before its first Docker Compose operation and
  reports the canonical-project restriction

### Requirement: Isolated E2E provisioning is locally exclusive
The Mercado Publico E2E provisioner SHALL use one fixed local project by
default and SHALL reject a new provision when that project's `server` service
is already running. It SHALL report the supported cleanup command and SHALL
not remove the active project automatically.

#### Scenario: E2E server is already running
- **WHEN** the configured E2E project's `server` service is running
- **THEN** the provisioner fails before cleanup or startup and reports the
  explicit cleanup command

### Requirement: E2E provisioning keeps fixture state isolated and diagnosable
Before starting a new permitted E2E provision, the provisioner SHALL remove
only resources owned by its configured E2E project, including named volumes and
orphans. It SHALL build the source-matched server image with `GIT_SHA` and use
the E2E Compose override's dedicated server and database volumes. If build,
startup, seeding, or fixture provisioning fails, it SHALL preserve E2E
resources for local diagnosis.

#### Scenario: Previous E2E provision is stopped
- **WHEN** the configured E2E project has no running server
- **THEN** the provisioner removes only that project's stale resources before
  building and starting a new fixture

#### Scenario: Fixture provisioning fails
- **WHEN** a build, startup, seed, or fixture command fails
- **THEN** the provisioner exits with failure and leaves the E2E project
  available for inspection

### Requirement: Operations documentation distinguishes E2E from local runtime
Repository operations documentation SHALL identify the Mercado Publico E2E
provisioner as a destructive, isolated exception to the canonical `twenty`
runtime. It SHALL document the supported provision command, its project
ownership restriction, and explicit cleanup command.

#### Scenario: Engineer prepares Mercado Publico E2E fixture
- **WHEN** an engineer reads the E2E or operations guidance
- **THEN** the engineer can distinguish the isolated E2E project from the
  canonical runtime and find the supported cleanup action
