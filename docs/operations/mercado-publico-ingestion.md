---
type: operations-guide
title: "Mercado Publico Ingestion"
description: "Durable operator contract for the deployment-local Mercado Publico ingestion jobs."
okf_version: "0.1"
---

# Mercado Publico Ingestion

## Purpose

Define the safe manual operating contract for Mercado Publico API and Datos
Abiertos CSV ingestion. This is an operator runbook, not a source-data copy or
a replacement for the source contract.

For a step-by-step manual or AI-assisted Compra Agil V2 extraction, including
UTC windows, pagination, fallback policy, quota budgeting, and error handling,
read the [Compra Agil V2 user and AI extraction guide](mercado-publico-compra-agil-v2-research.md).

## Runtime boundary

Use the canonical Docker Compose runtime. Do not reset or reseed the database
for an ingestion check.

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml up -d

docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml ps
```

Required operator configuration:

- `MERCADO_PUBLICO_API_TICKET` for API V1.
- `COMPRA_AGIL_API_TICKET` for API V2 Compra Agil.
- `MERCADO_PUBLICO_API_V1_BASE_URL` and `COMPRA_AGIL_API_BASE_URL`.
- `MP_COMPRA_AGIL_MAX_PAGES` (default `250`) as the per-run Compra Agil
  discovery guard.
- `MERCADO_PUBLICO_CSV_STORAGE_ROOT` for operator-provided CSV files.
- `MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED` and CSV source URLs when download jobs
  are enabled, passed through deployment-specific Compose/environment wiring.

Tickets, production identifiers, and source CSVs never belong in git, command
payloads, fixtures, or this document. Current Compose does not pass the CSV
variables or define a repository-owned CSV bind mount; the storage root,
transport, and environment wiring remain deployment-owned prerequisites.

## Trigger a job

Run one job at a time through the server container:

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml exec server \
  yarn command:prod mercado-publico:run \
  --job-name <job_name> --payload '<json_object>'
```

Supported job families:

- API V1: `api-v1-licitaciones-by-date`, `api-v1-licitaciones-by-state`,
  `api-v1-licitacion-detail-by-codigo`, `api-v1-oc-by-date`,
  `api-v1-oc-by-state`, `api-v1-oc-detail-by-codigo`.
- API V2 Compra Agil: `api-v2-compra-agil-incremental`,
  `api-v2-compra-agil-by-publication-window`,
  `api-v2-compra-agil-detail-by-codigo`.
- CSV: `csv-oc-download`, `csv-licitaciones-download`, `csv-file-profile`,
  `csv-raw-load`, `csv-staging-projection`, `csv-canonical-refresh`.
- Reconciliation: `reconciliation-refresh`.

For API V2 list jobs, `tamano_pagina` must be `10..50`, inclusive;
the runner starts at page `1`, follows the provider-declared page count
sequentially, and retains one raw request/response record per page. `id` and
`q` cannot be combined. Use either `ttl_cambio_ms` or the complete
`cambio_desde`/`cambio_hasta` pair; publication windows require the complete
`publicado_desde`/`publicado_hasta` pair. If ordering is supplied, use only the
official `ordenar_por` values `FechaUltimaModificacion` or `FechaPublicacion`.
Date-time bounds must use full ISO-8601 syntax with an explicit offset or `Z`,
and the start must not be after the end. Invalid input fails before the
provider request. For list jobs, the runner persists a secret-free
`manifest_json` summary on `mp.stg_job_run`; it records the requested/effective
window, pages, provider totals, unique codes, fallback, `Retry-After`, and the
final manifest status. A manifest status of `empty` maps to the existing job
status `soft_miss`.
For detail checks, retain raw response evidence. A missing detail is an
auditable failure, not a successful empty result.

## Daily Compra Agil discovery

Deployment operators run the publication-window job once per day. Supply the
intended Chilean day bounds and omit `numero_pagina`; ingestion owns traversal.

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml exec server \
  yarn command:prod mercado-publico:run \
  --job-name api-v2-compra-agil-by-publication-window \
  --payload '{"publicado_desde":"<YYYY-MM-DDT00:00:00Z>","publicado_hasta":"<YYYY-MM-DDT23:59:59Z>","tamano_pagina":50}'
```

Resolve a Chilean business-day window locally, convert its bounds to UTC, and
record both windows. Optional operator metadata is accepted without being sent
to the provider:

```json
{
  "requested_local_window": {
    "from": "2026-08-02T00:00:00",
    "to": "2026-08-02T23:59:59",
    "timezone": "America/Santiago"
  },
  "fallback_used": true,
  "fallback_reason": "requested_day_without_sufficient_data",
  "effective_date": "2026-07-31"
}
```

The `Z` format matches the official V2 examples; it does not make UTC a
provider timezone policy. The code records fallback metadata but does not
invent a Chilean holiday calendar.

If the provider declares more pages than `MP_COMPRA_AGIL_MAX_PAGES`, the job
finalizes with status `partial` and writes an `error_summary` beginning with
`partial:` plus the declared/capped page evidence. It must not be reported as
complete.
Increase the guard only through deployment configuration after reviewing API
quota and runtime impact; there is no scheduler or product UI control.

## Schema precondition and retained-raw backfill

Before the first new V2 ingestion after deployment, run registered instance
commands through the supported upgrade workflow:

```bash
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml exec server \
  yarn database:migrate:prod --force --include-slow
```

The required `2.16.0` sequence includes
`MpCompraAgilV2DatesFastInstanceCommand_1784100000000`,
`MpCompraAgilV2BrowseFieldsFastInstanceCommand_1785354861317`, and the
idempotent retained-evidence backfill
`MpCompraAgilV2BrowseBackfillSlowInstanceCommand_1785354861318`. The backfill
fills missing title, buyer, state/date, canonical, and gold values without
replacing a known canonical value with null. Never expose this command through
the product UI. The manifest column is added by
`MpStgJobRunManifestFastInstanceCommand_1785354861321`; run the registered
upgrade before relying on `manifest_json`.

## Read-only command center

The workspace route `/mercado-publico` exposes three read-only tabs:

- `#compra-agil` — compact six-column Compra Agil browse.
- `#licitaciones` — licitation browse with the same retained-source detail
  contract.
- `#centro-de-control` — ingestion, quota, API-call, CSV-health, and pipeline
  observability reads.

Browse tabs support source-backed filters, sorting, and pagination. Selecting a
process opens the native detail SidePanel; it reads the latest retained raw
record by `fecha_ultimo_cambio`, then `fetched_at`, and projects typed source
fields. The browser never receives stored raw JSON and does not call the
provider on panel open. Source paths are plain text; documents expose only
observed ID and name.

When the source has not supplied data, the UI shows source-pending or
unavailable state. It must not synthesize totals or imply freshness from
partial page data. The workspace remains read-only: ingestion, retries,
backfills, and configuration stay in the CLI/operator boundary documented
above.

## CSV execution order

For each operator-provided file, run:

```text
csv-file-profile          {"raw_csv_file_id":"<file-id>"}
csv-raw-load              {"raw_csv_file_id":"<file-id>"}
csv-staging-projection    {"raw_csv_file_id":"<file-id>"}
csv-canonical-refresh     {"raw_csv_file_id":"<file-id>"}
```

Profile checks must preserve raw columns and values, support observed
Latin-1-compatible text, semicolon delimiters, quoted fields, comma decimals,
null-like values, and `1900-01-01` sentinel dates. A positive file with no
importable rows is `failed`. A disabled CSV download is `skipped` with a
non-empty reason.

## Read-only assertions

Inspect the current run, not global totals:

```sql
SELECT id, job_name, job_run_id, status, started_at, finished_at,
       records_fetched, records_staged, records_canonicalized,
       records_failed, error_summary, manifest_json
FROM mp.stg_job_run
WHERE started_at >= now() - interval '2 hours'
ORDER BY started_at DESC;
```

Valid job statuses are `success`, `partial`, `failed`, `soft_miss`,
`param_error`, `retryable_failed`, and `skipped`. A `partial` run is not
complete and must retain its limiting evidence. Positive complete runs require
`success`, zero `records_failed`, and run-scoped counter reconciliation. The
contract has no `records_written` counter. The manifest may additionally use
`empty` as its own status; the persisted job status remains `soft_miss`.

Repeat each input once. The second run must not create duplicate raw, staging,
or canonical identities. Preserve both raw files when the same source period
arrives with a different checksum.

## Evidence boundary

The implementation has focused test and lint evidence recorded in the active
OpenSpec CUE runbook, but live CUE remains operator-dependent until valid
credentials, known detail codes, and the host CSV directory are supplied.

Related contracts:

- [Compra Agil V2 user and AI extraction guide](mercado-publico-compra-agil-v2-research.md)
- [Mercado Publico source contract](../business/mercado-publico-source-contract.md)
- [Data operations](data-operations.md)
- [Active CUE runbook](../../openspec/changes/mercado-publico-ingestion-cue-hardening/operator-runbook.md)
