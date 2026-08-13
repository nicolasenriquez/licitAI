## Purpose

Define the isolated lifecycle and authentication setup contract for Mercado
Publico E2E fixtures without changing the canonical `twenty` local runtime.

## Requirements

### Requirement: Isolated E2E provisioning owns one project

The Mercado Publico E2E provisioner SHALL accept only Compose project
`twenty-mp-e2e` before it invokes Docker Compose. It SHALL reject `twenty` and
every other override, and SHALL not start, stop, remove, build, or recreate
resources for a rejected project.

#### Scenario: Caller selects canonical project

- **WHEN** `MERCADO_PUBLICO_V2_E2E_COMPOSE_PROJECT` does not equal
  `twenty-mp-e2e`
- **THEN** the provisioner fails before its first Docker Compose operation and
  reports the fixed-project restriction

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
stale resources owned by its configured E2E project, including orphans. It
SHALL keep named volumes unless `--fresh` is passed. It SHALL build the
source-matched server image with `GIT_SHA` and use the E2E Compose override's
dedicated server and database volumes. When a baseline template exists for the
current source revision, it SHALL restore the active database from that
template and skip seeding. Otherwise it SHALL seed the fixture, capture a
per-revision template database, and restart the server. If build, startup,
seeding, fixture provisioning, or template capture fails, it SHALL preserve
E2E resources for local diagnosis.

#### Scenario: Previous E2E provision is stopped

- **WHEN** the configured E2E project has no running server
- **THEN** the provisioner removes that project's stale resources without
  removing named volumes and restores or rebuilds the fixture baseline

#### Scenario: Baseline template exists for the current revision

- **WHEN** a template database for the current `GIT_SHA` exists
- **THEN** the provisioner recreates the active database from the template and
  skips the seed and fixture commands

#### Scenario: Baseline template is missing

- **WHEN** no template database matches the current `GIT_SHA`
- **THEN** the provisioner drops stale templates, seeds the fixture, stops the
  server, captures the template database, and starts the server again

#### Scenario: Full reset is requested

- **WHEN** the provisioner runs with `--fresh`
- **THEN** it removes the E2E project named volumes before provisioning

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

### Requirement: Playwright runs only required authentication setup

The generic Playwright project SHALL depend only on the standard local login.
Role-specific projects SHALL depend only on their matching role login.

#### Scenario: Generic authenticated test runs

- **WHEN** an engineer runs the generic browser project
- **THEN** Playwright runs the standard login setup and does not run operator
  or analyst setup

#### Scenario: Role-specific test runs

- **WHEN** an engineer runs a role-specific test under the operator or analyst
  project
- **THEN** only assertions for that role execute
