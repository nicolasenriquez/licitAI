## 0. Investigation and Scope Lock

- [ ] 0.1 Re-read `docker-compose.yml`, `docker-compose.e2e.yml`, and
  `provision-baseline.mjs` to confirm that all E2E lifecycle calls pass through
  the provisioner and that the canonical runtime remains `twenty`.
  Traceability: locks the owning Module and prevents a guard from widening into
  the canonical Compose runtime.

- [ ] 0.2 Confirm the current E2E cleanup command and the Docker Compose
  service-state command that can distinguish a running E2E `server` from a
  stopped project.
  Traceability: closes the preflight command-contract gap before implementation.

## 1. Contract Coverage (Failing First)

- [ ] 1.1 Add a focused `node:test` spec for a local pure preflight module,
  proving that project `twenty` fails before the provisioner invokes Docker
  Compose.
  Traceability: proves the canonical-runtime protection required by
  `isolated-e2e-compose` before runtime guards are added.

- [ ] 1.2 Extend that `node:test` spec to prove that a running
  `twenty-mp-e2e` server rejects a second provision without issuing cleanup.
  Traceability: proves the local exclusivity and failure-diagnosis contract
  before lifecycle behavior changes.

## 2. Implementation

- [ ] 2.1 Add one local pure preflight module and its `node:test` command, then
  call it from `packages/twenty-e2e-testing/scripts/provision-baseline.mjs`
  for canonical project rejection and running E2E server rejection. Keep every
  existing Compose invocation routed through `run()`.
  Traceability: implements project ownership and locally exclusive provisioning
  at the existing lifecycle seam.

- [ ] 2.2 Preserve the existing cleanup-before-provisioning behavior only after
  preflight succeeds. Keep failed build, startup, seed, and fixture resources
  intact and print the supported human cleanup command in rejection guidance.
  Traceability: implements deterministic fixture reset without deleting active
  or failed diagnostic state.

## 3. Verification

- [ ] 3.1 Run focused `node:test` provisioner contract coverage and verify
  rejected paths issue no destructive Docker Compose command.
  Traceability: proves canonical project protection and local exclusivity at
  the owning seam.

- [ ] 3.2 Render the merged base and E2E Compose configuration with a supplied
  diagnostic `GIT_SHA`; verify its services and volumes remain E2E-specific.
  Traceability: proves the override continues to reuse the canonical base while
  isolating fixture data.

## 4. Release Hygiene and Closeout

- [ ] 4.1 Update `packages/twenty-e2e-testing/README.md` with the isolated
  provision command, sequential-use restriction, preserved-failure behavior,
  and explicit cleanup command.
  Traceability: documents the supported lifecycle for E2E fixture users.

- [ ] 4.2 Update `docs/operations/command-surface.md` and
  `docs/operations/local-development.md` to define the E2E provisioner as a
  destructive, isolated exception without weakening `twenty` as canonical
  local runtime.
  Traceability: removes the documented runtime-contract ambiguity.

- [ ] 4.3 Run changed-file formatting, applicable lint or Node test command,
  `git diff --check`, and `openspec validate harden-isolated-e2e-compose`.
  Traceability: confirms code, documentation, and OpenSpec artifacts stay
  aligned before implementation closeout.

## Execution Order

### Slice 1 — Provisioner ownership guard
- Tasks: `0.1 -> 0.2 -> 1.1 -> 1.2 -> 2.1 -> 2.2 -> 3.1 -> 3.2`
- Checkpoint: canonical project and active E2E server are rejected before any
  destructive Compose command; merged configuration retains E2E volumes.
- Blocks: Slice 2

### Slice 2 — Operations contract
- Tasks: `4.1 -> 4.2 -> 4.3`
- Checkpoint: E2E documentation identifies its lifecycle and does not redefine
  the canonical runtime.
- Blocked by: Slice 1
- Blocks: None
