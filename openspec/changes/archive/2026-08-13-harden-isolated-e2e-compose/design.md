## Context

`provision-baseline.mjs` is the only Mercado Publico E2E lifecycle owner. It
merges the canonical Compose file with the E2E override, always invokes Docker
Compose through one `run()` helper, and currently tears down the fixed
`twenty-mp-e2e` project before provisioning.

The fixture truncates `mp` tables. The base Compose file remains the canonical
local runtime and must stay untouched. The E2E project is intentionally local
and sequential because the provisioner also updates one frontend build and one
E2E environment file.

## Goals / Non-Goals

**Goals:**

- Accept only fixed project `twenty-mp-e2e` before Docker Compose runs.
- Reject a second local E2E provision while the E2E server is active.
- Preserve existing cleanup-before-provisioning and failure diagnostics.
- State the exception and cleanup contract in operations documentation.

**Non-Goals:**

- Parallel E2E projects, dynamic project names, or distributed locks.
- Automatic cleanup after failures.
- Changes to Compose base, Dockerfile, images, CI, database, or Playwright.

## Boundary and Ownership

### Provisioner lifecycle boundary

`provision-baseline.mjs` owns project selection, Compose invocation, and local
fixture lifecycle. Its interface is CLI flags and environment variables. The
Docker Compose CLI is its adapter. The preflight immediately before `run()` is
the highest existing seam because every destructive action passes through it.

This preserves locality: one guard protects all E2E Compose operations without
altering the canonical runtime. Its leverage is high because the fixture's
destructive data reset cannot reach `twenty` after project validation.

A small local pure preflight module decides whether the selected project is
canonical or already active. The provisioner remains responsible for obtaining
the E2E service state through Docker Compose. This is the smallest test seam:
Node built-in tests cover decisions without mocking Docker, modifying `.env`
files, or creating containers.

## Decisions

1. Keep `twenty-mp-e2e` as the only accepted project.

   Rationale: current CI has no same-daemon provisioner concurrency, while a
   fixed project keeps local cleanup and diagnosis discoverable. Rejecting all
   overrides prevents a destructive provision from creating a third stack or
   targeting the canonical runtime.

   Alternatives considered:
   - Dynamic project names.
     - Rejected because frontend build and `.env` files remain shared and would
       not make provisions safely parallel.
   - Reusing an active E2E project.
     - Rejected because fixture state is destructive and must be deterministic.

2. Detect a running E2E server before cleanup.

   Rationale: a running server proves another provision or diagnosis session
   owns the project. Failing leaves its logs and volumes intact.

   Alternatives considered:
   - Always run `down --volumes`.
     - Rejected because it silently destroys active diagnostic state.
   - Add a lock service or lock file.
     - Rejected because Compose state already provides enough evidence for the
       single-host, sequential contract.

3. Use a pure preflight decision module with `node:test` coverage.

   Rationale: project selection and active-server rejection are branch logic
   that must fail before Docker state changes. A pure module isolates that
   decision without adding a framework or Docker mock harness.

   Alternatives considered:
   - Test the top-level provisioner by replacing the Docker executable.
     - Rejected because it is platform-specific and can modify shared frontend
       environment files before reaching the guard.

4. Keep cleanup only before a permitted new provision; preserve failures.

   Rationale: this retains deterministic starts and allows local failure
   diagnosis. A human performs the documented cleanup after inspection.

   Alternatives considered:
   - Cleanup in a process-exit handler.
     - Rejected because it loses failure evidence and cannot safely cover every
       interrupt path.

5. Document E2E as a narrow exception to canonical runtime guidance.

   Rationale: the repository's Docker-first rule remains true for development.
   This fixture is a test-only, isolated lifecycle with explicit ownership.

6. Make Playwright setup dependencies role-specific.

   Rationale: the standard test account is sufficient for generic tests. The
   operator and analyst setups exist only to prove distinct authorization
   behavior, so they must not run for the generic browser project.

## Risks / Trade-offs

- A stopped but stale E2E project is removed before the next provision -> this
  is required for deterministic fixture data; users must inspect it before
  retrying.
- A manual Docker process could start after preflight -> unsupported concurrent
  use remains a local operational risk; no lock is added for a non-CI workflow.
- `docker compose ps` failures could hide state -> preflight must surface the
  Docker error and stop rather than continue to cleanup.

## Migration Plan

1. Add the tested preflight decision module and call it before the first
   existing Compose lifecycle operation.
2. Update E2E and operations documentation with exact provision and cleanup
   commands.
3. Validate merged Compose configuration and guard behavior.
4. Rollback by removing the guards and documentation additions; no persisted
   schema, runtime resource, or compatibility migration exists.

## Open Questions

None. The user selected preserved failed environments and rejection of a
second local provision.

## Verification Strategy

- First prove canonical-project and active-E2E-project rejection at provisioner
  preflight before production changes.
- Prove permitted provisioning still targets only the E2E project by inspecting
  the merged Compose configuration and command arguments.
- Verify documentation does not redefine the canonical `twenty` runtime.
