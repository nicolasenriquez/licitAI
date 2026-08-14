## 0. Investigation and Scope Lock

- [x] 0.1 Re-read `docker-compose.yml`, `docker-compose.e2e.yml`, and
  `provision-baseline.mjs` to confirm that all E2E lifecycle calls pass through
  the provisioner and that the canonical runtime remains `twenty`.
  Traceability: locks the owning Module and prevents a guard from widening into
  the canonical Compose runtime.
  Notes: Verified 2026-08-13. The provisioner owns every E2E Compose command;
  base Compose declares canonical project `twenty` and the override disables
  the worker with dedicated E2E volumes.

- [x] 0.2 Confirm the current E2E cleanup command and the Docker Compose
  service-state command that can distinguish a running E2E `server` from a
  stopped project.
  Traceability: closes the preflight command-contract gap before implementation.
  Notes: Verified 2026-08-13. `docker compose -p twenty-mp-e2e -f
  docker-compose.yml -f docker-compose.e2e.yml ps --status running --services
  server` distinguishes the server; `down --volumes --remove-orphans` is the
  explicit cleanup command.

## 1. Contract Coverage (Failing First)

- [x] 1.1 Add a focused `node:test` spec for a local pure preflight module,
  proving that project `twenty` fails before the provisioner invokes Docker
  Compose.
  Traceability: proves the canonical-runtime protection required by
  `isolated-e2e-compose` before runtime guards are added.
  Notes: Verified 2026-08-13 with four `node:test` cases, including rejected
  canonical project before Docker access.

- [x] 1.2 Extend that `node:test` spec to prove that a running
  `twenty-mp-e2e` server rejects a second provision without issuing cleanup.
  Traceability: proves the local exclusivity and failure-diagnosis contract
  before lifecycle behavior changes.
  Notes: Verified 2026-08-13. The focused test rejects a running E2E server and
  includes explicit cleanup guidance.

## 2. Implementation

- [x] 2.1 Add one local pure preflight module and its `node:test` command, then
  call it from `packages/twenty-e2e-testing/scripts/provision-baseline.mjs`
  for canonical project rejection and running E2E server rejection. Keep every
  existing Compose invocation routed through `run()`.
  Traceability: implements project ownership and locally exclusive provisioning
  at the existing lifecycle seam.
  Notes: Implemented `e2e-compose-preflight.mjs`; the provisioner accepts only
  `twenty-mp-e2e` and checks its server through the existing Compose adapter.

- [x] 2.2 Preserve the existing cleanup-before-provisioning behavior only after
  preflight succeeds. Keep failed build, startup, seed, and fixture resources
  intact and print the supported human cleanup command in rejection guidance.
  Traceability: implements deterministic fixture reset without deleting active
  or failed diagnostic state.
  Notes: Verified 2026-08-13 against the active E2E server. The provisioner
  failed before cleanup, build, or `.env` writes; pre/post SHA-256 hashes of
  both shared configuration files were unchanged.

- [x] 2.3 Remove ad hoc Playwright probes that bypass configured projects,
  authentication state, and backend selection.
  Traceability: keeps the configured Playwright projects as the sole local E2E
  test path and prevents hard-coded one-off diagnostics from drifting.
  Notes: Removed five `probe-*` files after validating the configured generic
  and role-specific Playwright project matrix.

## 3. Verification

- [x] 3.1 Run focused `node:test` provisioner contract coverage and verify
  rejected paths issue no destructive Docker Compose command.
  Traceability: proves canonical project protection and local exclusivity at
  the owning seam.
  Notes: `yarn --cwd packages/twenty-e2e-testing test:e2e-compose-preflight`
  passed 4/4. The live active-server guard produced no Docker mutation.

- [x] 3.2 Render the merged base and E2E Compose configuration with a supplied
  diagnostic `GIT_SHA`; verify its services and volumes remain E2E-specific.
  Traceability: proves the override continues to reuse the canonical base while
  isolating fixture data.
  Notes: `docker compose -p twenty-mp-e2e ... config --quiet` passed without a
  manual `GIT_SHA`; the provisioner still supplies the source revision for build.

## 4. Release Hygiene and Closeout

- [x] 4.1 Update `packages/twenty-e2e-testing/README.md` with the isolated
  provision command, sequential-use restriction, preserved-failure behavior,
  and explicit cleanup command.
  Traceability: documents the supported lifecycle for E2E fixture users.
  Notes: Documented the fixed project, explicit cleanup, standard local account
  configuration, and `docker compose exec` command path.

- [x] 4.2 Update `docs/operations/command-surface.md` and
  `docs/operations/local-development.md` to define the E2E provisioner as a
  destructive, isolated exception without weakening `twenty` as canonical
  local runtime. Update `playwright.config.ts` so generic, operator, and
  analyst projects each depend only on their matching setup.
  Traceability: removes the documented runtime-contract ambiguity.
  Notes: Documented the isolated exception and no-`compose run` rule. Playwright
  now gives generic, operator, and analyst projects only matching setup and tests.

- [x] 4.3 Run changed-file formatting, applicable lint or Node test command,
  `git diff --check`, and `openspec validate harden-isolated-e2e-compose`.
  Traceability: confirms code, documentation, and OpenSpec artifacts stay
  aligned before implementation closeout.
  Notes: Focused `oxfmt --check`, E2E preflight tests, Playwright `--list`,
  Compose config, Docker-first docs check, `git diff --check`, and OpenSpec
  validation all passed on 2026-08-13.

## Execution Order

### Slice 1 — Provisioner ownership guard
- Tasks: `0.1 -> 0.2 -> 1.1 -> 1.2 -> 2.1 -> 2.2 -> 3.1 -> 3.2`
- Checkpoint: canonical project and active E2E server are rejected before any
  destructive Compose command; merged configuration retains E2E volumes.
- Blocks: Slice 2

### Slice 2 — Operations contract
- Tasks: `2.3 -> 4.1 -> 4.2 -> 4.3`
- Checkpoint: E2E documentation identifies its lifecycle and does not redefine
  the canonical runtime.
- Blocked by: Slice 1
- Blocks: None
