---
type: operations-guide
title: CI Operations Guide
description: >-
  Continuous Integration fundamentals, pipeline architecture, and the
  licitai/Twenty monorepo CI implementation. Pedagogical reference that maps
  canonical CI theory to concrete GitHub Actions workflows and local justfile
  commands.
okf_version: "0.1"
---

# CI Operations Guide

## Purpose

Explain the Continuous Integration (CI) architecture of the licitai/Twenty
monorepo. Link canonical CI theory to the repository's 22 GitHub Actions
workflows and the local justfile command surface. Serve as both an onboarding
reference and a daily operations guide.

**Audience**: engineers, AI agents, and reviewers working on this codebase.

## 1. CI Fundamentals

Continuous Integration, as defined by Martin Fowler and the DORA research
program, is the practice of merging all developer work into a shared mainline
at least daily, with every merge verified by an automated build and test suite.

### The 11 CI Practices

| # | Practice | What It Means |
|---|----------|---------------|
| 1 | **Single source repository** | Everything needed to build the product lives in one repo. Mainline (`main`) is the canonical source of truth. |
| 2 | **Automate the build** | A single command turns source code into a running system. No manual steps. |
| 3 | **Make the build self-testing** | Automated tests run on every build. A failing test = a failing build. |
| 4 | **Everyone pushes to mainline daily** | No code sits unintegrated for more than a few hours. Small batches, frequent integration. |
| 5 | **Every push triggers a build** | A CI Service monitors the mainline and builds every commit in a reference environment. |
| 6 | **Fix broken builds immediately** | A broken build is the team's highest priority. Revert the offending commit if not fixed in minutes. |
| 7 | **Keep the build fast (< 10 min)** | Rapid feedback. Split slow tests into a deployment pipeline if needed. |
| 8 | **Hide work-in-progress** | Use feature flags, keystone interfaces, or branch-by-abstraction to merge incomplete features safely. |
| 9 | **Test in a clone of production** | The test environment must match production. Infrastructure as code. |
| 10 | **Everyone can see what is happening** | Full visibility of build status. No hidden failures. |
| 11 | **Automate deployment** | Deploying to production should be a routine, low-risk operation. |

### Core principle: fail fast, fail cheap

```
Each stage is a FILTER. If it fails, the pipeline stops immediately.
Expensive later stages never run for code known to be broken.

STAGE 0: Gate              (10s)  ─┐
STAGE 1: Static Analysis    (2m)   │  CHEAP — run first,
STAGE 2: Build              (3m)   │  fail fast
STAGE 3: Unit Tests         (3m)   │
                                    │
STAGE 4: Validation         (2m)   │
STAGE 5: Security           (2m)   │  MEDIUM
                                    │
STAGE 6: Integration Tests  (8m)   │  EXPENSIVE — run only
STAGE 7: E2E Tests         (15m)  ─┘  if everything above passed
```

## 2. Canonical Pipeline Order

The stages below represent the industry-standard CI pipeline order, endorsed by
Fowler (martinfowler.com), DORA (dora.dev), GitLab, and Google Cloud.

```
                        ┌──────────────────────────┐
                        │     DEVELOPER PUSH        │
                        └────────────┬─────────────┘
                                     │
     ╔══════════════════════════════ ═╗  ╔════════════════════════════════╗
     ║ STAGE 0: GATE             10s ║  ║  lockfile integrity check       ║
     ║                              ║  ║  commit message convention       ║
     ╚══════════════════════════════ ═╝  ╚════════════════════════════════╝
                                     │
     ╔══════════════════════════════ ═╗  ╔════════════════════════════════╗
     ║ STAGE 1: STATIC ANALYSIS   2m ║  ║  lint (oxlint)                 ║
     ║   (no build required)         ║  ║  typecheck (tsgo)              ║
     ║                              ║  ║  format check (oxfmt)           ║
     ╚══════════════════════════════ ═╝  ╚════════════════════════════════╝
                                     │
     ╔══════════════════════════════ ═╗  ╔════════════════════════════════╗
     ║ STAGE 2: BUILD             3m ║  ║  compile all packages           ║
     ║   (depends on static passing)  ║  ║  generate artifacts             ║
     ║                              ║  ║  cache outputs for later stages  ║
     ╚══════════════════════════════ ═╝  ╚════════════════════════════════╝
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
     ╔════════╩════════╗  ╔══════════╩══════════╗  ╔════════╩══════════╗
     ║ STAGE 3:        ║  ║ STAGE 4:           ║  ║ STAGE 5:         ║
     ║ UNIT TESTS    3m ║  ║ VALIDATION       2m ║  ║ SECURITY       2m ║
     ║  fast, isolated  ║  ║  migration check    ║  ║  npm audit        ║
     ║  in-memory DB    ║  ║  GraphQL codegen    ║  ║  secret scan      ║
     ║  Jest / Vitest   ║  ║  schema contract    ║  ║  SBOM generation  ║
     ╚══════════╤═══════╝  ╚══════════╤══════════╝  ╚════════╤══════════╝
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     │
     ╔══════════════════════════════ ═╗  ╔════════════════════════════════╗
     ║ STAGE 6: INTEGRATION TESTS 8m ║  ║  real PostgreSQL + Redis        ║
     ║   (depends on unit passing)    ║  ║  real ClickHouse                ║
     ║                              ║  ║  cross-module contracts          ║
     ╚══════════════════════════════ ═╝  ╚════════════════════════════════╝
                                     │
     ╔══════════════════════════════ ═╗  ╔════════════════════════════════╗
     ║ STAGE 7: E2E TESTS        15m ║  ║  full stack running             ║
     ║   (full system)               ║  ║  Playwright browser tests       ║
     ║                              ║  ║  user-flow simulation            ║
     ╚══════════════════════════════ ═╝  ╚════════════════════════════════╝
```

### The cost pyramid

```
         ▲               ┌──────────┐
         │               │   E2E    │  few, very slow, expensive
      C  │             ┌─┴──────────┴─┐
      O  │             │  Integration  │  few, slow, expensive
      S  │           ┌─┴───────────────┴─┐
      T  │           │    Unit Tests     │  many, fast, cheap
         │         ┌─┴───────────────────┴─┐
         │         │       Build           │  runs once, produces artifacts
         │       ┌─┴───────────────────────┴─┐
         │       │    Static Analysis         │  many rules, instant, free
         ▼       └────────────────────────────┘
```

**Rule**: run cheap stages first. If they fail, stop. Never pay for expensive
stages on broken code.

## 3. This Repository's CI Architecture

### Overview

22 GitHub Actions workflows, organized by package scope. Each workflow follows
the same structural pattern:

```
                    ┌──────────────────────┐
                    │  changed-files-check  │  GATE (path-based skip)
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  ┌──────▼──────┐    ┌────────▼────────┐   ┌────────▼────────┐
  │ ci-server   │    │    ci-front     │   │   ci-shared     │
  │   lint      │    │     lint        │   │   lint          │
  │   build     │    │     typecheck   │   │   typecheck     │
  │   typecheck │    │     test        │   │   test          │
  │   test      │    │     build       │   └─────────────────┘
  │   validate  │    │     storybook   │
  │   integ     │    └─────────────────┘
  └─────────────┘
          │
  ┌───────▼──────┐    ┌────────────────┐
  │  ci-e2e-main │    │  ci-new-ui     │
  │  ci-sdk      │    │  ci-docs       │
  │  ci-emails   │    │  ci-zapier     │
  │  ci-docker   │    │  ci-utils      │
  └──────────────┘    └────────────────┘
```

### Key patterns

| Pattern | How It Works |
|---------|-------------|
| **Path-based gating** | `changed-files.yaml` reusable workflow checks which files changed. Skipping entire workflows when irrelevant. |
| **nx-affected** | Runs `npx nx affected --exclude="*,!tag:<scope>"` to execute only the tasks relevant to changed packages. |
| **3-layer caching** | `node_modules` cache (yarn-install), Nx task cache (restore/save-cache), optional build-output cache per workflow. |
| **Status-check aggregation** | Every workflow ends with a `ci-*-status-check` job that depends on all other jobs. Branch protection uses a single check per workflow. |
| **Service containers** | PostgreSQL (`postgres:18`), Redis (`redis`), and ClickHouse (`clickhouse/clickhouse-server:25.8.8`) run as GitHub Actions service containers. |
| **Shard parallelization** | Integration tests sharded into 16 runners. Storybook tests into 4. Fail-fast disabled to collect full results. |

### Workflow inventory

| Workflow | Trigger | What It Validates |
|----------|---------|-------------------|
| `ci-server.yaml` | PR | Build, lint, typecheck, unit tests, integration tests (16 shards with DB/Redis/ClickHouse), migration check, GraphQL codegen check |
| `ci-front.yaml` | PR + push main | Lint, typecheck, unit tests, build, Storybook build & test (4 shards), bundle analysis |
| `ci-shared.yaml` | PR | Lint, typecheck, unit tests |
| `ci-new-ui.yaml` | PR + push main | Lint, typecheck, unit tests, Storybook build & test |
| `ci-sdk.yaml` | PR | Lint, typecheck, unit tests, integration tests, E2E tests against live server |
| `ci-e2e-main.yaml` | PR + merge queue + push main | Every PR runs the Mercado Publico UI-contract smoke. Merge queue and main run generic E2E plus the Mercado Publico release gate. |
| `ci-test-docker-compose.yaml` | PR | docker compose up, docker build of app-dev target, health checks |
| `ci-breaking-changes.yaml` | PR | GraphQL + REST API schema diff (main vs branch) |
| `ci-docs.yaml` | PR + push main | Lint |
| `ci-emails.yaml` | PR + push main | Build, start server, curl health check |
| `ci-zapier.yaml` | PR | Build, lint, typecheck, tests against live server |
| `ci-utils.yaml` | `pull_request_target` | Danger.js PR review bot |
| Additional 10 | Various | Codex plugin, example apps, People Data Labs, meeting bot, website |

All workflows are under `.github/workflows/`. A full inventory with exact
job graphs and service configurations is maintained in
`.github/workflows/`.

## 4. Local CI and the Existing Runtime

The existing full Docker Compose project is the first and routine local runtime.
It is checked read-only with `just runtime-check`; that command never starts or
creates containers. Source-only lint, typecheck, and unit-test commands can run
on the host because the production-shaped runtime image does not contain Nx or
Jest.

```
┌──────────────────────────────────────────────────────────────────┐
│                 CANONICAL LOCAL RUNTIME                            │
│                                                                  │
│   just runtime-check                                               │
│     existing full Compose: server + worker + db + redis            │
│     read-only config/status/health check                            │
│                                                                  │
│   If it fails: inspect status/logs and report the existing stack. │
│   `just dev-up` is an explicitly authorized recovery action.      │
│                                                                  │
│   Alternate CI infrastructure (`docker-compose.dev.yml` +         │
│   ClickHouse) is blocked by default. It requires                    │
│   ALLOW_EXTRA_CONTAINERS=1 and explicit human authorization.       │
└──────────────────────────────────────────────────────────────────┘
```

The full runtime is deliberately preferred even when a source-only test lane is
used. A separate infrastructure stack is an exceptional compatibility path,
not an automatic fallback.

### Which command should I run?

```
I changed only frontend code ──────────► just ci-front

I changed only backend code ───────────► just ci-server

I changed both front and backend ──────► just ci

I am about to push ────────────────────► just ci-prepush

I want full pre-PR verification ───────► just ci-full
  (integration infrastructure is an explicit exception)

CI failed in GitHub Actions
and I want to reproduce locally ───────► just runtime-check first
                                          then request alternate infra if needed

I just cloned the repo or
changed application code ──────────────► just runtime-check first
                                          then request dev-up-build if needed

Application is already built,
I just want to run it ─────────────────► just runtime-check
```

## 5. justfile Command Surface

Local commands cover selected GitHub Actions jobs and combine them into useful
developer lanes. They do not mirror every workflow step: Storybook, SDK
integration/E2E, and several policy or infrastructure gates remain separate.
The mapping is documented in `docs/operations/command-surface.md`. Below is the
CI pipeline command dependency tree:

```
                            just ci
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
  ci-check               ci-build               ci-test
       │                      │                      │
       ├─ ci-server-lint     ├─ ci-server-build     ├─ ci-server-test
       ├─ ci-front-lint      └─ ci-front-build      └─ ci-front-test
       ├─ ci-front-typecheck
       ├─ ci-shared
       ├─ ci-ui
       ├─ ci-sdk
       └─ ci-docs

                            just ci-full
                              │
             ci + ci-server-lint-full + ci-server-validate + ci-security
                         + ci-integration + ci-emails
                         │             │                  │
                    (see above)   _ensure-           ci-server-integration
                                   server-healthy     (needs gated alternate infra)
                                  migrations + codegen
```

### Daily workflows

| Scenario | Command | Time |
|----------|---------|------|
| Pre-commit | `just ci-prepush` | ~8 min |
| Pre-PR (commit-build) | `just ci` | ~8 min |
| Pre-PR + validate + integration | `just ci-full` | ~18 min |
| Start app from an existing local image | `just dev-up` | See observed local timings below |
| Rebuild app | `just dev-up-build` | Several minutes; no cold-build benchmark is recorded yet |
| Stop app | `just dev-down` | 5s |

### Full local CI requires CI mode

`just ci-full` checks its prerequisites before it runs the static suite. It
does not start or stop containers. Run it only when the application Compose
stack is not using the CI ports.

```text
Terminal 1
set ALLOW_EXTRA_CONTAINERS=1 && just ci-infra-up
just ci-server-start

Terminal 2
just ci-full
```

The server in Terminal 1 must run from the current source. The application
Compose image cannot provide the GraphQL schema used by local code generation.

### Observed local startup timings

The timings below are observations, not a service-level objective. They were
recorded on 2026-07-31 on a Windows workstation with
`twentycrm/twenty:mp-local` already present, PostgreSQL and Redis already
healthy, and no pending migrations. Timing ended when `GET /healthz` returned
success.

| Action | Observed time |
| --- | ---: |
| `docker compose ... up -d` from the existing local image; server and worker recreated | 72.1 s |
| `docker compose ... up -d` after applying a freshly rebuilt local image | 39.1 s |

The explicit build completed with the available Docker and Yarn caches, but it
was not measured as a cold rebuild. Do not interpret these figures as the cost
of `just dev-up-build`; record a separate cold-build benchmark before assigning
that command an exact duration.

## 6. Migrations and Safety

### Automatic migrations on dev-up

The server container runs instance commands at startup. The application compose
does not set `DISABLE_DB_MIGRATIONS` on the server service (only on the worker),
so migrations apply automatically on boot.

`just dev-up` waits for the server health endpoint (`/healthz`) before
reporting success. Since the server only becomes healthy *after* applying
pending migrations, this guarantees migrations are complete.

### Instance command guarantees

- Instance commands are **immutable** once committed. CI enforces this via
  `ci-server.yaml`'s `server-previous-version-upgrade-mutation-guard`.
- All migrations are **forward-only**. There is no rollback mechanism.
- New entity changes require a new instance command via
  `npx nx run twenty-server:database:migrate:generate` before the PR can pass CI.

### Manual migration trigger inside the running container

```bash
# Run migrations explicitly (rarely needed — auto on boot):
docker compose exec server yarn database:migrate:prod
```

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Port 3000 in use` | The canonical app Compose is already running. | Run `just runtime-check`; do not tear it down for a different local stack. See [local port ownership](local-development.md#local-port-ownership). |
| `Redis not reachable on :6379` | The canonical Redis is internal to the app Compose network. | Use runtime/API checks through the server; request alternate CI infrastructure only if the test genuinely requires host Redis. |
| `node_modules not found` | `yarn install` never run or `git clean` was used. | `yarn install` |
| `lint:diff-with-main` fails with "unknown revision" | Local `main` branch stale. | `git fetch origin main` |
| `Uncommitted generated changes` | GraphQL schema changed but `graphql:generate` not run. | Run the three generate commands and commit. |
| `Playwright browsers missing` | `ci-front-sb-test` needs Chromium. | `npx playwright install chromium` (auto-installed by `ci-front-sb-test`) |
| `commitlint: no config found, skipping` | Expected. The repo does not use commitlint yet. | No action needed. Add `commitlint.config.mjs` if desired. |
| `PostgreSQL not reachable on :5432` | The canonical stack is not healthy or is not exposing that port. | Run `just runtime-check` and inspect `just dev-logs`; do not create another database container. |
| `Server did not become healthy` | Compose failed to start or migrations failed. | `just dev-logs` to inspect. |
| CI integration tests fail locally but pass in GHA | The local runtime and GHA service topology differ. | Keep local diagnostics on the canonical Compose; use the gated alternate CI infrastructure only with explicit authorization. |
| `graphql:generate` fails with "No schema found" | Codegen introspects the running server. Requires CURRENT SOURCE server, not the `dev-up` Docker image (stale code). | Start source server in a second terminal: `npx nx start:ci twenty-server` |
| `yarn npm audit` reports `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Node does not trust the local system CA chain. | `ci-security` uses Node 24 `--use-system-ca`; for a manual audit, set `NODE_OPTIONS=--use-system-ca` first. |
| `ci-gate` fails with YN0028 | `yarn.lock` is stale (e.g., after switching branches or rebasing). | Run `yarn install` to regenerate the lockfile. |

## 8. What Is Not Covered Locally

Some GitHub Actions workflows are intentionally not mirrored in local commands.
Reasons are documented below.

| Workflow | Why Not Local |
|----------|---------------|
| `ci-breaking-changes.yaml` | Builds both `main` and current branch servers, diffs GraphQL + OpenAPI schemas. Requires pristine checkout of `origin/main` and full `rm -rf node_modules` reinstall. Too destructive for a developer workspace. |
| `ci-e2e-main.yaml` | Policy-gated artifact uploads and full Playwright setup. The final status reports `PASS`, `FAIL`, or `SKIPPED_BY_POLICY`; a policy skip is not full acceptance. |
| `ci-test-docker-compose.yaml` | Builds and starts containers. It changes Docker state and remains an explicit GitHub-only gate until a separately authorized local Compose command is added. |
| `ci-utils.yaml` | Uses `pull_request_target` with GitHub API tokens. Danger.js is a GitHub-native code review bot. |
| `ci-codex-plugin.yaml` | Internal tooling package. Not relevant to CI pipeline concerns. |

## 9. CI Governance

- **Ownership**: CI workflow structure is governed by
  `docs/governance/domain-operating-model.md`. CI pipelines fall under
  repository infrastructure ownership.
- **Change gates**: Architecture review is required for CI/CD changes per the
  domain operating model.
- **AI agent guardrails**: `docs/governance/ai-assisted-delivery.md` Guardrail 5
  states: "Do not change nx.json or CI workflows without explicit approval."

Related documents:
- `docs/operations/command-surface.md` — Developer CLI contract
- `docs/decisions/0007-local-ci-surface-via-justfile.md` — ADR for this local CI surface decision
- `docs/governance/domain-operating-model.md` — Ownership and enforcement rules
- `docs/governance/ai-assisted-delivery.md` — Agent delivery guardrails
