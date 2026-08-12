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

## Headless Login

The E2E Playwright configuration always runs Chromium headless. Do not switch
`headless` off to troubleshoot login; use the setup test and its trace output.

### Local prerequisites

Playwright builds and serves the frontend preview at `http://localhost:3001/`.
Leave that port available, then start and verify the backend before running
tests:

```powershell
cd packages/twenty-docker
docker compose up -d --force-recreate server
docker compose ps
curl.exe --fail http://localhost:3000/healthz
```

`packages/twenty-docker/.env` must contain:

```env
DISABLE_DB_MIGRATIONS=true
DISABLE_CRON_JOBS_REGISTRATION=true
```

These values target the persisted local `mp-local` database used by this E2E
baseline. The server container must be recreated after changing them. A plain
`docker compose restart server` keeps the old container environment and can
leave startup blocked in migrations or cron registration.

### Development credentials

Use the local disposable dev seed only:

| User | Email | Password | Workspace |
| --- | --- | --- | --- |
| Default admin | `tim@apple.dev` | `tim@apple.dev` | Apple |
| Analyst | `jane.austen@apple.dev` | `tim@apple.dev` | Apple |
| Operator | `phil.schiler@apple.dev` | `tim@apple.dev` | Apple |

The UI flow is: open `/`, click `Continue with Email`, submit email, click
`Continue`, submit password, then click `Sign in`. The `--light` development
seed creates only the Apple workspace, so no workspace picker is normally
shown.

### Seed and login smoke

Run the light seed when the disposable database needs its development users:

```powershell
docker exec twenty-server-1 yarn command:prod workspace:seed:dev --light
```

Run the login setup from this package. It regenerates ignored
`.auth/user.json`; stale storage state is not a reason to run headed mode:

```powershell
npx playwright test tests/login.setup.ts --project=setup
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

No supported idempotent V2 E2E fixture provisioner exists yet. Do not run the
populated-state acceptance tests against persisted Compose data and call them
isolated. Set `MERCADO_PUBLICO_V2_E2E_CODIGO` and
`MERCADO_PUBLICO_V2_E2E_BUYER_CODE` to the seeded identities when they differ
from the defaults.

Run the real login and test target:

```powershell
node scripts/provision-baseline.mjs --flag on
npx playwright test tests/mercado-publico/history-and-buyers.spec.ts --project=chrome
```

The spec checks desktop `1440x900`, laptop `1280x900`, and mobile `390x844`
viewports. It uses real GraphQL responses and browser history. It does not mock
GraphQL.

### Failure diagnosis

| Symptom | Check |
| --- | --- |
| Frontend loads but login hangs | `curl.exe --fail http://localhost:3000/healthz` and `docker compose ps` |
| Server is unhealthy and logs stop at cron registration | Set `DISABLE_CRON_JOBS_REGISTRATION=true`, then use `--force-recreate` |
| Login returns invalid credentials | Run `workspace:seed:dev --light` and retry with the credentials above |
| Authenticated tests cannot find token | Run `tests/login.setup.ts --project=setup`; it must create `.auth/user.json` |

Never use these development credentials outside the disposable local
environment. Never commit `.env` or `.auth/user.json`.

## Q&A

#### Why there's `path.resolve()` everywhere?
That's thanks to differences in root directory when running tests using commands and using IDE. When running tests with commands, 
the root directory is `twenty/packages/twenty-e2e-testing`, for IDE it depends on how someone sets the configuration. This way, it
ensures that no matter which IDE or OS Shell is used, the result will be the same.
