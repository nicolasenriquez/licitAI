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

`packages/twenty-docker/.env` must contain:

```env
DISABLE_DB_MIGRATIONS=true
DISABLE_CRON_JOBS_REGISTRATION=true
```

These values target the persisted local `mp-local` database used by this E2E
baseline. Recreate the canonical server only as an explicit recovery action;
routine tests must not create another Compose service or one-off container.

### Local test account

Set `DEFAULT_LOGIN` and `DEFAULT_PASSWORD` in the ignored package `.env` for
the standard local test account. Generic tests use only this account.

The operator project uses `DEFAULT_LOGIN`. For an authorization-denial test,
set `ANALYST_LOGIN` in the ignored package `.env` to a seeded user without the
explicit sync-operator assignment. Do not put role-specific account values in
a test, probe, README, or committed environment file.

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
npx playwright test tests/mercado-publico/baseline.spec.ts --project=chrome
```

### Mercado Publico V2 history and buyers

Use a disposable deployment and database. Workspace isolation is not enough
because the `mp` schema is deployment-local. The server image must contain the
same source revision as the frontend so `/metadata` exposes `history` and
`buyers`.

Seed V2 data through the real ingestion and normalization path. The fixture
must contain:

- one opportunity ingested twice with a semantic change;
- one buyer with an amount and one opportunity for that buyer without an
  amount;
- one opportunity without `buyerCode`.

The supported provisioner creates only isolated Compose project `twenty-mp-e2e`
on a Docker-assigned local port,
builds the current source revision, runs migrations, and
seeds the fixture through the server-side durable sync path. It requires the
disposable fixture flags set by `docker-compose.e2e.yml`; it does not use
persisted local Compose data.

Routine provisions reuse the isolated database volume. The provisioner
restores the active `default` database from a per-revision template
(`mp_e2e_template_v2hb_<gitSha>`), so repeat runs skip seeding and fixture
ingestion. A source change creates a new template and drops stale ones. Use
`--fresh` to force a full reset including the named volumes:

```powershell
node scripts/provision-baseline.mjs --flag on --fixture v2-history-and-buyers [--fresh]
```

Run the isolated fixture through its target:

```powershell
npx nx run twenty-e2e-testing:test:mercado-publico
```

The target stops the isolated containers after Playwright completes, including
when a test fails. It preserves the volumes and templates. To inspect a stack,
run the provisioner and then run Playwright with the flag in the process
environment. To discard a manually provisioned stack, run:

```powershell
$env:REACT_APP_MERCADO_PUBLICO_V2_ENABLED = 'true'
npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome
```

Then run:

```powershell
docker compose -p twenty-mp-e2e --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml -f packages/twenty-docker/docker-compose.e2e.yml down --remove-orphans
```

To discard it including volumes and templates, add `--volumes` or run the
provisioner with `--fresh`.

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
