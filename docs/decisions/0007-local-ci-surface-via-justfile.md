---
type: decision
title: Local CI Surface via justfile
description: >-
  ADR 0007 — Establishing a justfile-based local CI command surface that
  mirrors the repository's GitHub Actions workflows.
okf_version: "0.1"
---

# ADR 0007: Local CI Surface via justfile

## Status

Proposed

## Date

2026-07-30

## Purpose

Provide a local, reproducible CI command surface that faithfully mirrors the
repository's GitHub Actions workflows, enabling developers to run CI checks
before pushing without pushing to CI.

## Primary Audience

Engineers, AI agents, and reviewers interacting with the licitai/Twenty
monorepo CI surface.

## Executive Summary

The repository has 22 GitHub Actions workflows but no single local command to
run CI checks. Developers must remember and sequence 5+ disparate `npx nx`
commands. A `justfile` already exists for Docker service orchestration and
provides a natural home for CI commands. The decision is to extend the
existing justfile with CI recipes that map 1:1 to GitHub Actions jobs,
organized in two mutually exclusive local modes (DEV for app runtime, CI for
test infrastructure).

## Context

**Problem**: 22 GitHub Actions workflows exist with no local equivalent.
Developers rely on CI feedback loops (push → wait → see failure → fix) instead
of local pre-push verification. The command surface is fragmented: lint uses
`lint:diff-with-main`, typecheck uses `tsgo`, tests use `jest` with specific
configs, migration validation requires PostgreSQL, and integration tests need
PostgreSQL, Redis, and ClickHouse.

**Discovery**: The full application `docker-compose.yml` does not expose Redis
to the host machine (only the dev compose `docker-compose.dev.yml` does). This
means integration tests cannot run against the application compose. A separate
infrastructure mode is required for CI.

**Constraints**:
- Windows is the primary local development platform (`windows-shell: cmd.exe`).
- `npx wait-on` is already a project dependency (used in root `yarn start`).
- The existing `justfile` already wraps `docker run` commands for PostgreSQL,
  Redis, ClickHouse, Grafana, and OpenTelemetry.
- Nx provides automatic dependency ordering (`dependsOn: ["^build"]`), so
  justfile recipes do not need to reproduce the full dependency graph.
- Background process management is unreliable in `cmd.exe` (no `nohup`, `&`
  disown, or reliable PID capture). Server-starting recipes document the
  two-terminal workflow instead.

## Decision

1. **Two-mode local architecture**:

   - **DEV mode**: `just dev-up` / `just dev-down` wrap the full application
     compose (`docker-compose.yml`). Migrations run automatically on server
     boot. Server occupies port 3000.
   - **CI mode**: `just ci-infra-up` / `just ci-infra-down` use the dev
     compose (`docker-compose.dev.yml`) plus a ClickHouse container. PostgreSQL
     and Redis are host-accessible. Port 3000 is free for local `npx nx
     start:ci` if needed.

   The two modes are mutually exclusive because both bind host port 5432.

2. **GitHub Actions mirroring**: Each local command corresponds to a specific
   GHA job. Static checks (lint, typecheck) use `lint:diff-with-main` matching
   CI. Builds, tests, and validation follow the same step order as the
   workflow they mirror.

3. **Health checking**: All infrastructure readiness uses `npx wait-on`
   (already a project dependency). No custom retry loops. No `timeout`
   commands with fragile exit code handling.

4. **Security**: The `ci-security` command runs `yarn npm audit --severity
   high`, scans staged changes for secrets, and generates an SBOM. Image
   vulnerability scanning (Trivy) is an optional separate command.

5. **Missing tool handling**: `commitlint` and `cyclonedx-npm` are not
   installed. The gate and security recipes detect their absence and skip
   gracefully rather than failing.

6. **Server-starting recipes**: `ci-server-validate` documents the
   two-terminal workflow (terminal 1 starts server, terminal 2 runs
   validation) rather than managing background processes from `cmd.exe`.
   The helper `_ensure-server-healthy` checks port 3000 healthz and fails with
   a clear message if no server is running.

## Consequences

### Positive

- Single `just ci-prepush` replaces 5+ manual commands for pre-push verification.
- CI failures reproduce deterministically on the developer's machine.
- Two-mode architecture documents and enforces the Redis exposure constraint
  that was previously implicit.
- `just dev-up` / `just dev-down` provide cleaner aliases for the developer's
  existing compose workflow.
- Health checks use a single, well-known tool (`wait-on`) consistently across
  all recipes.

### Costs

- The justfile grows from ~55 lines to ~230 lines. New commands require
  understanding of the two-mode architecture.
- `ci-infra-up` must be run before any integration test command. This is an
  explicit manual step not present in GHA (where service containers are
  declared declaratively).
- When the dev compose container name changes (e.g., `twenty-dev-db-1`),
  the `ci-infra-up` recipe's `docker compose exec -T db` call may need
  adjustment if the service name differs. Using `docker compose exec` with the
  service name (`db`) rather than the container name avoids this issue.
- Server-starting recipes require a second terminal. This is a Windows
  limitation; Linux/macOS could use `nohup` or a `trap` for cleanup.

### Constraints

- Modes are mutually exclusive. Running `just ci-full` while the app compose
  is up will fail with a port conflict error.
- The two-terminal workflow for `ci-server-validate` means server must be
  manually killed afterward.
- `ci-server-validate` depends on `ci-infra-up` being running; it does not
  auto-start infrastructure.
- The `_ensure-env` helper copies `.env.example` only if `.env` is missing.
  This diverges from GHA's `reset:env` (which always overwrites). The
  local behavior is intentional: a developer's `.env` may contain real
  secrets. GHA environments are ephemeral so overwriting is safe.

## Alternatives Considered

### Alternative A: Root package.json scripts

- **What**: Add `"ci"`, `"ci:check"`, `"ci:test"` scripts to root
  `package.json`.
- **Why rejected**: npm scripts lack declarative composition (no
  `depends_on` between scripts), have no private helpers, and cannot wrap
  Docker infrastructure commands. The justfile already existed for Docker
  orchestration; extending it is additive rather than introducing a second
  surface.

### Alternative B: Custom Nx targets

- **What**: Create Nx executors or targets for CI stages.
- **Why rejected**: Nx targets are for build/test/lint within the monorepo
  graph. Docker infrastructure is outside Nx's scope. Mixing infra
  orchestration with the build graph creates circular dependencies and unclear
  boundaries.

### Alternative C: Act (run GitHub Actions locally)

- **What**: Use [nektos/act](https://github.com/nektos/act) to execute
  `.github/workflows/` locally.
- **Why rejected**: Act requires Docker-in-Docker, does not reliably support
  Windows, and each run requires re-installing dependencies (no persistent
  cache). The 22-workflow fan-out is slow even in CI; local reproduction
  without caching is impractical.

## Related Documents

- `docs/operations/ci.md` — CI operations guide with pipeline theory and
  justfile command reference.
- `docs/operations/command-surface.md` — Developer CLI contract.
- `docs/operations/local-development.md` — Local environment setup.
- `docs/governance/domain-operating-model.md` — CI/CD ownership and gate
  enforcement.
- `docs/governance/ai-assisted-delivery.md` — Agent guardrails (Guardrail 5:
  CI workflow changes require approval).
