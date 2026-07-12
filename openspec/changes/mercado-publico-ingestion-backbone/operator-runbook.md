# Mercado Publico Phase-1 Operator Runbook

Manual, internal execution only. This runbook is change-local guidance; it does
not add or replace the repository-wide Nx/Yarn command surface, a scheduler, or
a public API.

## Preconditions

- Configure Mercado Publico tickets, base URLs, CSV source URLs, storage root,
  and `MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED` through the normal Twenty config
  environment. Never put tickets or credentials in payloads, fixtures, or this
  document.
- Primary path: run the full application, server, worker, PostgreSQL, and Redis
  with Compose. Fill the variables in `packages/twenty-docker/.env` first:

```bash
docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml up -d
```

- `packages/twenty-docker/docker-compose.dev.yml` starts only PostgreSQL and
  Redis for the host-source fallback. It does not run the application.

- Host-source fallback only: apply pending instance commands before the first
  run:

```bash
yarn nx run twenty-server:database:migrate
```

- Host-source fallback only: start backend and worker in separate terminals:

```bash
yarn nx run twenty-server:start
```

```bash
yarn nx run twenty-server:worker
```

## Trigger One Process

Run one command at a time. The command enqueues work to the existing internal
Mercado Publico queue; it does not execute the process inline.

```bash
docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml exec server yarn command:prod mercado-publico:run --job-name <job_name> --payload '<json_object>'
```

### API V1

| Job | Payload example |
| --- | --- |
| `api-v1-licitaciones-by-date` | `{"date":"2026-06-30"}` |
| `api-v1-licitaciones-by-state` | `{"estado":"publicada"}` |
| `api-v1-licitacion-detail-by-codigo` | `{"codigoExterno":"<codigo_externo>"}` |
| `api-v1-oc-by-date` | `{"date":"2026-06-30"}` |
| `api-v1-oc-by-state` | `{"estado":"aceptada"}` |
| `api-v1-oc-detail-by-codigo` | `{"codigo":"<codigo_oc>"}` |

V1 date payloads use ISO dates. The client formats them for the source API.
Replace placeholders with source values; do not guess state codes or business
keys.

### API V2 Compra Agil

| Job | Payload example |
| --- | --- |
| `api-v2-compra-agil-incremental` | `{"ttl_cambio_ms":5000,"tamano_pagina":50,"numero_pagina":1}` |
| `api-v2-compra-agil-by-publication-window` | `{"publicado_desde":"2026-06-01T00:00:00Z","publicado_hasta":"2026-06-30T23:59:59Z","tamano_pagina":50,"numero_pagina":1}` |
| `api-v2-compra-agil-detail-by-codigo` | `{"codigo":"<codigo_compra_agil>"}` |

`id` and `q` are mutually exclusive when supplied. Keep
`tamano_pagina <= 50` and `numero_pagina >= 1`.

### CSV Pipeline

Run download first, then use the resulting `raw_csv_file_id` for each
single-file process.

| Job | Payload example |
| --- | --- |
| `csv-oc-download` | `{"source_period":"2026-06","source_modality":"<optional_modality>"}` |
| `csv-licitaciones-download` | `{"source_period":"2026-06","source_modality":"<optional_modality>"}` |
| `csv-file-profile` | `{"raw_csv_file_id":"<uuid>"}` |
| `csv-raw-load` | `{"raw_csv_file_id":"<uuid>"}` |
| `csv-staging-projection` | `{"raw_csv_file_id":"<uuid>"}` |
| `csv-canonical-refresh` | `{"raw_csv_file_id":"<uuid>"}` |

Find the file id after download with a read-only query:

```sql
SELECT id, source_dataset, source_period, source_file_name, downloaded_at
FROM mp.raw_csv_file
ORDER BY downloaded_at DESC
LIMIT 20;
```

Do not run profile, raw load, staging, or canonical refresh until the previous
stage has completed successfully for the same file.

### Reconciliation

Run after the relevant API and CSV canonical refreshes:

```bash
docker compose --env-file packages/twenty-docker/.env -f packages/twenty-docker/docker-compose.yml exec server yarn command:prod mercado-publico:run --job-name reconciliation-refresh
```

No payload is required.

## Observe A Run

Use read-only SQL against the deployment database. `stg_job_run` is the phase-1
source of truth for execution history; there is no public GraphQL, REST, or MCP
execution/read surface in this change.

```sql
SELECT job_name, status, started_at, finished_at, records_fetched,
       records_written, records_failed, error_summary
FROM mp.stg_job_run
ORDER BY started_at DESC
LIMIT 30;
```

```sql
SELECT source, used, reset_at, last_429_at
FROM mp.gold_api_quota_usage
ORDER BY source;
```

Interpret `success`, `soft_miss`, `param_error`, `retryable_failed`, and
`failed` using the job outcome and `error_summary`. Retry only after fixing a
parameter, source, config, or infrastructure cause. The queue applies the
configured bounded retry and fixed backoff policy.

## Safety Boundaries

- Phase 1 is manual. Do not add cron, scheduler, public triggers, or CRM record
  creation as an operator workaround.
- Do not expose raw `mp` tables to frontend or apps.
- Keep API tickets in secret config. Redacted logs and job metadata are safe to
  share; request headers and secret values are not.
- Keep each command independent so a failed stage is visible and rerunnable.

## Handoff

- The phase-1 implementation lives under
  `packages/twenty-server/src/engine/core-modules/mercado-publico/` and remains
  manual/internal-only. No scheduler, public endpoint, or CRM projection was
  added.
- API and CSV jobs create their `mp.stg_job_run` record before validating the
  payload. Invalid payloads finalize as `param_error`; file-bound CSV stages
  also retain the guarded `stg_job_run.raw_csv_file_id` link when the schema
  supports it.
- Focused verification passed: 13 Mercado Publico service suites, 79 tests;
  server-scoped oxlint reported 0 warnings and 0 errors; no
  Mercado-Publico-owned tsgo errors remain.
- Full DB-backed integration validation remains a CI handoff: run the
  disposable Linux server-integration job with database reset. Do not use the
  default live Docker database for reset/migration testing or trigger real API
  and CSV ingestion during this handoff.
- Follow-up consumer phases can build on the persisted canonical/read
  contracts after that isolated integration gate is green.
