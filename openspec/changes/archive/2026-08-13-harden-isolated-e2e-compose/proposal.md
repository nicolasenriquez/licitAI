## Why

The Mercado Publico V2 provisioner correctly creates a disposable Compose
project, but it does not reject the canonical `twenty` project or a concurrent
E2E provisioner. A second execution can race over the fixed E2E project and
the frontend files that the provisioner configures.

This change makes the isolated E2E lifecycle explicit and safe without
duplicating the canonical Compose stack.

## Investigation / Current State

- `packages/twenty-docker/docker-compose.yml` is the canonical `twenty` local
  runtime with server, worker, PostgreSQL, and Redis.
- `packages/twenty-docker/docker-compose.e2e.yml` is an override, not an
  independent stack. It builds the current source, replaces server data
  volumes, and disables the worker by profile.
- `packages/twenty-e2e-testing/scripts/provision-baseline.mjs` owns the E2E
  lifecycle. It uses the fixed `twenty-mp-e2e` project, tears down stale E2E
  volumes before provisioning, and intentionally leaves failed environments
  available for diagnosis.
- The fixture truncates deployment-local `mp` tables. It must not use persisted
  data from the canonical runtime.
- Current CI runs E2E and Docker checks on ephemeral runners. It does not run
  this Mercado Publico provisioner concurrently on one Docker daemon.

## What Changes

- Accept only `twenty-mp-e2e` as the local E2E Compose project before any
  Compose operation. Reject `twenty` and every other override.
- Reject provisioning when the fixed E2E project's `server` service is already
  running; require an explicit human cleanup before retrying.
- Preserve existing cleanup-before-provisioning and preserve the E2E project
  after a provisioning failure for local diagnosis.
- Document the E2E provisioner as a destructive, isolated exception to the
  canonical runtime, including its supported cleanup command.
- Make the generic Playwright project depend only on the standard local login;
  keep role-specific setup projects limited to role-specific tests.
- Run operator and analyst assertions only under their matching Playwright
  project.
- Remove ad hoc Playwright probes that bypass the configured login and target
  selection.
- Keep the base Compose file, Dockerfile, images, service topology, and CI
  configuration unchanged.

## Capabilities

### New Capabilities

- `isolated-e2e-compose`: Safe ownership, exclusivity, and lifecycle rules for
  the Mercado Publico isolated Compose fixture.

### Modified Capabilities

- None.

## Change Profile

- Profile: `mixed-change`.
- Why this profile fits: one script gains runtime guards and repository
  operations documentation gains the matching exception contract.

## Out Of Scope

- Parallel E2E provisioners on one Docker daemon.
- Dynamic Compose project names, distributed locking, or CI-specific project
  naming.
- Automatic cleanup after a failed local provision.
- Changes to `docker-compose.yml`, the Dockerfile, Docker images, Playwright,
  dependencies, database schema, or production behavior.

## Ownership and Test Seam

- Highest existing Seam: the provisioner invokes `docker compose -p` for every
  E2E lifecycle operation.
- Owning Module: `packages/twenty-e2e-testing/scripts/provision-baseline.mjs`.
- Interface: environment variables plus the provisioner CLI arguments.
- Highest test Seam: provisioner preflight before its first destructive Compose
  command, with a small pure preflight decision tested through Node's built-in
  test runner.
- Adapter: Docker Compose CLI.
- Depth / Leverage / Locality: one preflight protects every lifecycle command
  without changing the canonical runtime or Compose base configuration.

## Prior Art and First Proof

- Prior art: `just runtime-check` validates the canonical Compose runtime
  without creating resources; `provision-baseline.mjs` already centralizes E2E
  Compose commands through `run()`.
- First failing behavior or contract proof: the provisioner currently accepts
  `twenty` as its project name and does not stop when `twenty-mp-e2e` server is
  already running.

## Execution Order Decision

- Required: yes.
- Why: contract coverage must prove each rejection before the provisioner
  changes, while documentation follows verified behavior.

## Impact

- Affects `packages/twenty-e2e-testing/scripts/provision-baseline.mjs`.
- Adds one local preflight module and one `node:test` spec under
  `packages/twenty-e2e-testing/scripts/`.
- Affects `packages/twenty-e2e-testing/package.json` only to expose the focused
  Node test command, and `playwright.config.ts` to narrow setup dependencies.
- Removes obsolete `packages/twenty-e2e-testing/probe-*` diagnostics.
- Affects `packages/twenty-e2e-testing/README.md`,
  `docs/operations/command-surface.md`, and
  `docs/operations/local-development.md`.
- Does not affect the canonical `twenty` runtime, its data, or its Compose
  definition.

## Verification Policy

- Add fail-first `node:test` coverage at the provisioner preflight boundary.
- Verify project rejection and concurrent-project rejection before any
  destructive Compose operation.
- Verify the merged E2E Compose configuration without starting containers.
- Do not substitute broad Playwright coverage for lifecycle contract proof.

## Notes

- Context: Docker Compose project names isolate deployments; Compose override
  files centralize environment-specific configuration.
- Assumptions: one local Mercado Publico E2E provisioner at a time is enough;
  current CI does not require same-daemon parallelism.
- Boundaries: failed local E2E environments remain available until a human
  executes documented cleanup or starts the next provisioner run.
