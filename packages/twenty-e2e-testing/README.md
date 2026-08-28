---
type: readme
title: "Twenty end-to-end (E2E) Testing"
description: "Durable README for Twenty E2e Testing."
okf_version: "0.1"
---
# Twenty end-to-end (E2E) Testing

## Prerequisite

Installing the browsers:

```
npx nx setup twenty-e2e-testing
```

### Run end-to-end tests

```
npx nx test twenty-e2e-testing
```

### Author Playwright tests with the local CLI

Use `tests/agent.seed.spec.ts` as the authenticated starting point. Open a
debug session with `--debug=cli`, attach with the reported `tw-session`, and
inspect the page with `snapshot`, `console`, or `requests`. Run the completed
test normally with the Playwright test command.

```powershell
yarn --cwd packages/twenty-e2e-testing playwright test tests/agent.seed.spec.ts --project=chrome --debug=cli
yarn --cwd packages/twenty-e2e-testing playwright cli attach <tw-session>
yarn --cwd packages/twenty-e2e-testing playwright cli -s=<tw-session> snapshot
yarn --cwd packages/twenty-e2e-testing playwright test tests/agent.seed.spec.ts --project=chrome
```

### Start the interactive UI mode

```
npx nx test:ui twenty-e2e-testing
```

### Run test in specific file
```
npx nx test twenty-e2e-testing <filename>
```

Example (location of the test must be specified from the root of `twenty-e2e-testing` package):
```
npx nx test twenty-e2e-testing tests/login.spec.ts
```

### Run the CRM baseline

The CRM baseline reuses two existing suites. It does not duplicate shared
record-view behaviour for every object.

```powershell
yarn --cwd packages/twenty-e2e-testing playwright test tests/crm-dossier-baseline.spec.ts tests/crm-dossier-ui-audit.spec.ts --project=chrome
```

`crm-dossier-baseline.spec.ts` checks the seeded object views and dashboards.
`crm-dossier-ui-audit.spec.ts` checks the application shell, navigation,
settings access, shared record-index controls, dashboards, and optional seeded
objects. Playwright keeps the trace and screenshot only when a test fails.

### Runs the tests in debug mode.
```
npx nx test:debug twenty-e2e-testing
```

### Show report after tests
```
npx nx test:report twenty-e2e-testing
```

## Key feature coverage

Run the deterministic local suite with:

```powershell
npx nx run twenty-e2e-testing:test:key-features
```

| Capability | Command | Scope |
| --- | --- | --- |
| Data model, views, workflows, CSV import/export | `test:key-features` | Local and deterministic. Each test uses a unique name and removes temporary data. |
| Dashboards, permissions, API settings UI | `test:key-features:gated` | Requires disposable seeded users and explicit feature inputs. |
| Mail, calendar, SSO | `test:external-integrations` | Requires an approved disposable provider, mailbox, and identity provider. |
| AI | Manual | No stable acceptance contract or disposable local provider exists. |
| Self-hosting | `ci-test-docker-compose.yaml` | Compose configuration and `/healthz`, not a browser test. |

The gated command fails before Playwright starts unless dashboard, permission,
API UI, and `PERMISSIONS_LOGIN` inputs are configured. The external command
does the same for the disposable provider inputs. It does not skip tests and
does not use personal or production credentials.

The E2E matrix does not claim acceptance coverage for AI, SSO configuration,
audit history, or row-level permissions. REST and GraphQL endpoint behaviour
remains covered by the integration suites in
`packages/twenty-server/test/integration/rest` and
`packages/twenty-server/test/integration/graphql`; Playwright verifies only
that the product exposes the related UI.

## Headless Login

The E2E Playwright configuration always runs Chromium headless. Do not switch
`headless` off to troubleshoot login; use the setup test and its trace output.

### Local prerequisites

Playwright builds and serves the frontend preview at `http://localhost:3001/`.
Leave that port available and verify the canonical runtime before running
generic tests:

```powershell
just runtime-check
curl.exe --fail http://localhost:3000/healthz
```

Mercado Publico tests use the isolated `twenty-mp-e2e` Compose project. The
runner supplies the fixture configuration to the process. It does not change
package or frontend `.env` files.

### Local test account

Set `DEFAULT_LOGIN` and `DEFAULT_PASSWORD` in the ignored package `.env` for
the standard local test account. Generic tests use only this account.

The operator project uses `DEFAULT_LOGIN`. For an authorization-denial test,
the fixture identity is `jane.austen@apple.dev`. It has no sync-operator
assignment. Tim remains the operator fixture.

### Seed and login smoke

Run the light seed when the disposable database needs its development users:

```powershell
docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml exec -T server yarn command:prod workspace:seed:dev --light
```

Run the login setup from this package. It regenerates ignored
`.auth/user.json`; stale storage state is not a reason to run headed mode:

```powershell
npx playwright test tests/login.setup.ts --project=setup-team
```

Then run an authenticated Mercado Publico smoke:

```powershell
yarn nx run twenty-e2e-testing:test:mercado-publico:ui-contract
```

### Mercado Publico V2 history and buyers

Use a disposable deployment and database. Workspace isolation is not enough
because the `mp` schema is deployment-local. The server image must contain the
same source revision as the frontend so `/metadata` exposes `history` and
`buyers`.

Seed V2 data directly into isolated read models. The fixture
must contain:

- one opportunity ingested twice with a semantic change;
- one buyer with an amount and one opportunity for that buyer without an
  amount;
- one opportunity without `buyerCode`.

The supported provisioner owns `prepare`, `status`, and `reset` for the isolated
Compose project `twenty-mp-e2e` on a Docker-assigned local port. It builds the
current source revision when required, runs migrations, and seeds deterministic
fixture-owned rows without provider or queue calls. It
requires disposable seed flags set by `docker-compose.e2e.yml`; it does not use
persisted local Compose data.

Routine provisions reuse the isolated database volume. The provisioner
restores the active `default` database from a per-revision template
(`mp_e2e_template_v2hb_<gitSha>`), so repeat runs skip seeding and fixture
insertion. A clean checkout reuses `twenty-mp-e2e:<gitSha>` only when that image
exists. A dirty checkout always rebuilds it. A source change creates a new
template and drops stale ones.

Prepare and inspect the warm lifecycle through Nx:

```powershell
yarn nx run twenty-e2e-testing:test:mercado-publico:prepare
yarn nx run twenty-e2e-testing:test:mercado-publico:status
```

Add `-- --fresh` to `prepare` to remove named volumes first. CI selects fresh
preparation automatically.

Run the isolated fixture through its target:

```powershell
yarn nx run twenty-e2e-testing:test:mercado-publico
```

The public category targets are:

- `test:mercado-publico:ui-contract`
- `test:mercado-publico:journeys`
- `test:mercado-publico:roles`
- `test:mercado-publico:extended`
- `test:mercado-publico`
- `test:mercado-publico:release-gate`

The fast UI target excludes the responsive Axe matrix tagged `@extended`.
`test:mercado-publico:extended`, the aggregate, and the release gate include it.
The aggregate passes all three test paths to one Playwright invocation.

Normal targets prepare once and stop the isolated containers in `finally`,
including when a test fails. They preserve the database volume and template
cache. A warm target requires a prepared compatible revision and keeps the
stack:

```powershell
yarn nx run twenty-e2e-testing:test:mercado-publico:ui-contract --configuration=warm
yarn nx run twenty-e2e-testing:test:mercado-publico:reset
yarn nx run twenty-e2e-testing:test:mercado-publico:journeys --configuration=warm
yarn nx run twenty-e2e-testing:test:mercado-publico:clean
```

`reset` restores only the prepared database template. It rejects a different
revision and never builds. The runner flags are `--prepared`, `--keep`,
`--reuse-auth`, and `--fresh`. `--reuse-auth` requires every storage state used
by the selected suite and passes Playwright `--no-deps`; otherwise the normal
setup dependencies authenticate users. Lifecycle and test runs emit JSON phase
times for database, image, server, frontend, authentication, tests, and total.

See [local port ownership](../../docs/operations/local-development.md#local-port-ownership)
before running an E2E workflow that binds a local port.

Use `docker compose exec` for commands in an active service. Never use
`docker compose run` in the local or E2E workflow because it creates a separate
one-off container.

The spec checks desktop `1440x900`, laptop `1280x900`, and mobile `390x844`
viewports. It uses real GraphQL responses and browser history. It does not mock
GraphQL.

### Failure diagnosis

| Symptom | Check |
| --- | --- |
| Frontend loads but login hangs | `just runtime-check` for generic tests, or `docker compose -p twenty-mp-e2e ... ps` for the fixture |
| Server is unhealthy and logs stop at cron registration | Set `DISABLE_CRON_JOBS_REGISTRATION=true`, then use `--force-recreate` |
| Login returns invalid credentials | Run `workspace:seed:dev --light` and retry with the credentials above |
| Authenticated tests cannot find token | Run `tests/login.setup.ts --project=setup-team`; it must create `.auth/user.json` |

Never use these development credentials outside the disposable local
environment. Never commit `.env` or `.auth/user.json`.

## Q&A

#### Why there's `path.resolve()` everywhere?
That's thanks to differences in root directory when running tests using commands and using IDE. When running tests with commands, 
the root directory is `twenty/packages/twenty-e2e-testing`, for IDE it depends on how someone sets the configuration. This way, it
ensures that no matter which IDE or OS Shell is used, the result will be the same.
