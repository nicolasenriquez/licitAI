# Mercado Público CUE Runbook

Manual, no-reset, internal verification for the CUE hardening change. Do not
commit credentials, production identifiers, or source CSVs.

## Preconditions

- Docker and Compose are healthy.
- Operator sets `MERCADO_PUBLICO_API_TICKET` and `COMPRA_AGIL_API_TICKET` in
  the environment; never put them in payloads or this file.
- `HOST_CSV_DIR` contains the four operator-provided profiles under:
  `licitaciones/{2026-06,2026-07}/_default/` and
  `oc/{2026-06,2026-07}/_default/`.
- Apply pending instance commands through the normal runner. Do not reset or
  reseed the database.

## Start CUE Compose

```bash
export HOST_CSV_DIR=/operator/path/mercado-publico
docker compose --env-file packages/twenty-docker/.env \
  -f packages/twenty-docker/docker-compose.yml \
  -f packages/twenty-docker/docker-compose.cue.yml up -d
```

The override mounts `HOST_CSV_DIR` read-only at `/var/mp-csv` in both server
and worker. `MERCADO_PUBLICO_CSV_STORAGE_ROOT` points to that mount. The CUE
path uses the existing storage-root loader; it does not add a path importer.

Preflight:

```bash
docker compose -f packages/twenty-docker/docker-compose.yml \
  -f packages/twenty-docker/docker-compose.cue.yml ps
docker compose -f packages/twenty-docker/docker-compose.yml \
  -f packages/twenty-docker/docker-compose.cue.yml exec server \
  sh -lc 'test -r /var/mp-csv && find /var/mp-csv -type f -name "*.csv" -print'
```

Any missing or unreadable mount is a failed preflight. No successful import may
be recorded in that case.

## Trigger Jobs

Trigger one job at a time through the existing internal command:

```bash
docker compose -f packages/twenty-docker/docker-compose.yml \
  -f packages/twenty-docker/docker-compose.cue.yml exec server \
  yarn command:prod mercado-publico:run --job-name <job_name> \
  --payload '<json_object>'
```

Run API checks first:

```text
api-v1-licitaciones-by-date              {"date":"2026-06-30"}
api-v1-licitaciones-by-state             {"estado":"<source-state>"}
api-v1-licitacion-detail-by-codigo       {"codigoExterno":"<known-code>"}
api-v1-oc-by-date                        {"date":"2026-06-30"}
api-v1-oc-by-state                        {"estado":"<source-state>"}
api-v1-oc-detail-by-codigo                {"codigo":"<known-code>"}
api-v2-compra-agil-incremental            {"ttl_cambio_ms":5000,"tamano_pagina":50,"numero_pagina":1}
api-v2-compra-agil-by-publication-window  {"publicado_desde":"2026-06-01T00:00:00Z","publicado_hasta":"2026-06-30T23:59:59Z","tamano_pagina":50,"numero_pagina":1}
api-v2-compra-agil-detail-by-codigo       {"codigo":"<known-valid-code>"}
```

`tamano_pagina` must be `10..50`; `numero_pagina` starts at `1`; `id` and `q`
are mutually exclusive. Run the known missing-detail code separately and
expect `failed`, `records_failed > 0`, a non-empty `error_summary`, and raw
payload evidence.

For each of the four mounted profiles, run in order:

```text
csv-file-profile          {"raw_csv_file_id":"<file-id>"}
csv-raw-load              {"raw_csv_file_id":"<file-id>"}
csv-staging-projection    {"raw_csv_file_id":"<file-id>"}
csv-canonical-refresh    {"raw_csv_file_id":"<file-id>"}
```

The profile must report semicolon delimiter, quoted-field support,
Latin-1-compatible decoding, comma-decimal/date-sentinel handling, and raw
unknown-column preservation. A positive profile with no importable rows is
`failed`, not `success`. A disabled download job is `skipped` with a reason.

## Read-Only Run Assertions

Capture the job-run identifier, then query only the current run and its linked
rows. Do not use global table totals as proof.

```sql
SELECT id, job_name, job_run_id, status, started_at, finished_at,
       records_fetched, records_staged, records_canonicalized,
       records_failed, error_summary
FROM mp.stg_job_run
WHERE started_at >= now() - interval '2 hours'
ORDER BY started_at DESC;
```

For a positive CSV run, replace `:run_id` with the `stg_job_run.id` value:

```sql
SELECT
  (SELECT count(*) FROM mp.raw_csv_file WHERE ingestion_job_id = :run_id) AS raw_files,
  (SELECT count(*) FROM mp.raw_csv_row WHERE ingestion_job_id = :run_id) AS raw_rows,
  (SELECT count(*)
     FROM mp.raw_csv_row r
     JOIN mp.stg_csv_licitacion s ON s.raw_csv_row_id = r.id
    WHERE r.ingestion_job_id = :run_id) AS licitacion_staged,
  (SELECT count(*)
     FROM mp.raw_csv_row r
     JOIN mp.stg_csv_orden_compra s ON s.raw_csv_row_id = r.id
    WHERE r.ingestion_job_id = :run_id) AS oc_staged;
```

Assertions:

- positive status is `success`;
- `records_failed = 0`;
- `records_staged` and `records_canonicalized` are non-zero and match the
  run-scoped evidence;
- no query or assertion references nonexistent `records_written`;
- raw/API/file/row and canonical natural-key identities remain unique.

Repeat each API/CSV input once. The second run must add no duplicate raw,
staging, or canonical identity. Compare run-scoped deltas, not global totals.

## Implementation Verification Record

Verified on 2026-07-15 without a database reset or live source-data mount:

The two Jest commands below run from `packages/twenty-server`.

- `yarn jest src/engine/core-modules/mercado-publico --runInBand --silent --testPathIgnorePatterns=mercado-publico-runtime-exposure.spec.ts` — 58 suites, 464 tests passed.
- `yarn jest src/engine/core-modules/mercado-publico/services/__tests__/mercado-publico-persistence.service.spec.ts --runInBand --silent` — 11 tests passed, including duplicate raw-payload no-restage coverage.
- Scoped `oxlint --type-aware` over Mercado Público and the new migration — 0 warnings, 0 errors.
- Scoped `oxfmt --check` over changed TypeScript files — passed.
- `openspec validate mercado-publico-ingestion-cue-hardening` — valid.
- Docker Compose override config — valid with a temporary host directory; no source CSV was mounted or imported.

The full server typecheck is currently blocked by unrelated existing errors in
workspace-migration and page-layout-widget files. The unfiltered Mercado
Público Jest sweep also reaches an unrelated `e2b/chalk` ESM parse failure in
`mercado-publico-runtime-exposure.spec.ts`; the 58-suite result above excludes
that baseline environment failure.

## Failure Criteria and Handoff

Fail CUE when Docker or the mount is unhealthy, a positive job is not
`success`, `records_failed` is non-zero, counters do not reconcile, raw detail
evidence is missing, or a zero-record positive run is reported as success.

Record run IDs, observed counters, statuses, and unavailable operator
prerequisites here before considering tasks `3.3` and `4.1` complete. Live CUE
remains incomplete until the operator supplies valid/missing detail codes,
credentials, and the host CSV directory.
