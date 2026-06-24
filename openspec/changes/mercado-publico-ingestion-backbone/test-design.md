# Test Design: mercado-publico-ingestion-backbone

## Purpose

Phase 1 test design artifact. Defines the tracer-bullet path, public test surface, and unit test specifications for the Mercado Publico ingestion backbone. Non-implementing — specifies behavior to verify through public interfaces, persisted rows, job outcomes, and read contracts (per `design.md` Phase 1, `proposal.md` Preferred Execution Shape, AGENTS.md rule 11). Actual test files written in Phase 2 alongside implementation as vertical TDD slices.

## Routing Declaration

Surface: `openspec/`. Consulted: `proposal.md`, `design.md`, `specs/.../spec.md`, `tasks.md`, `investigation.md`, `docs/business/mercado-publico-source-contract.md`, `docs/business/mercado-publico-ingestion-context.md`, `docs/standards/testing-standard.md`. Pattern inventory from `investigation.md` §0.2.

Test philosophy (per `testing-standard.md` + AGENTS.md rule 11):
- Test behavior, not implementation.
- Verify through public interfaces, persisted rows, job outcomes, read contracts — not private collaborator calls.
- Naming: `should [behavior] when [condition]`.
- Clear mocks between tests: `jest.clearAllMocks()` in `beforeEach`.
- Unit specs co-located beside source (`*.spec.ts`). Integration specs in `test/integration/mercado-publico/suites/`.
- DB-backed verification preferred for persistence behavior. `SyncDriver` for queue tests (per `create-app.ts:38,71`).
- Phase-1 read contracts stay internal backend services — test via service methods, not HTTP/GraphQL endpoints (per `spec.md:429-433`).
- Column names referenced in test asserts are authoritative in `schema-catalog.md`. If a test references a column not in the catalog, the catalog must be updated first.

---

## 1.1 Tracer-Bullet Path and Risk-Ordered Slices

### Tracer-Bullet Slice

**Path**: `api-v1-licitaciones-by-date` end-to-end, narrowest vertical proving the full backbone stack on one path.

```
[manual trigger @Command]
  → enqueue @Processor(MessageQueue.mercadoPublicoQueue) job
    → format date as ddmmaaaa (format-v1-date.util.ts)
    → call V1 Licitaciones by-date via SecureHttpClientService
    → classify HTTP failure (classify-http-failure.util.ts)
    → persist raw payload to mp.raw_api_payload (dedupe by request_fingerprint + payload_checksum)
    → project to mp.stg_api_v1_licitacion
    → refresh mp.licitacion canonical (non-null-over-null protection)
    → record job run in mp.stg_job_run
  → read contract: listDetectedProcesses() returns minimum shape from gold/mp.licitacion
```

**Why this slice**: touches every architectural seam once — schema creation (instance command), static `mp` datasource, config vars, secure HTTP, queue/worker, raw persistence, staging, canonical refresh, read contract. Smallest end-to-end path that falsifies or confirms the backbone shape. Per `investigation.md` §0.5.

**Scope of tracer-bullet impl** (minimum to pass slice tests):
- Instance command: `mp` schema + `raw_api_payload` + `stg_api_v1_licitacion` + `stg_job_run` + `licitacion` tables only.
- Config: `MERCADO_PUBLICO_API_TICKET`, `MERCADO_PUBLICO_API_V1_BASE_URL`, `MERCADO_PUBLICO_HTTP_TIMEOUT_MS`, `MERCADO_PUBLICO_HTTP_MAX_RETRIES` (4 of 12).
- Client: V1 Licitaciones by-date method only.
- Job: by-date only.
- Canonical: licitacion header only (no items/offers/adjudicaciones yet).
- Read contract: `listDetectedProcesses` with fields `{processType, processCode, canonicalState, sourcePriority, lastSeenAt}` (5 of 13 minimum per `spec.md:439`).

### Risk-Ordered Slice Map

Ordered by risk × dependency. Each slice = vertical cut through the layers it touches.

| # | Slice | Risk addressed | Depends on |
| --- | --- | --- | --- |
| 1 | `api-v1-licitaciones-by-date` (tracer bullet) | proves schema + config + HTTP + queue + raw + canonical + read stack end-to-end | foundation blockers (2.1-2.5, 3.1-3.2) |
| 2 | `api-v1-licitacion-detail-by-codigo` | non-null-over-null protection on canonical refresh; detail rehydrate path | slice 1 |
| 3 | `api-v1-licitaciones-by-state` | raw state code + label preservation; list-snapshot-not-detail-truth | slice 1 |
| 4 | `api-v1-oc-by-date` + `api-v1-oc-detail-by-codigo` | second source family; `CodigoLicitacion` nullable handling | slice 1 |
| 5 | `api-v1-oc-by-state` | raw OC state + raw provider state preservation | slice 4 |
| 6 | `api-v2-compra-agil-incremental` | V2 param guards (`tamano_pagina<=50`, `numero_pagina>=1`, `id`/`q` mutex); paginated listing; `ttl_cambio_ms` | slice 1 |
| 7 | `api-v2-compra-agil-detail-by-codigo` | Compra Agil↔OC linkage via `id_orden_compra`/`id_oc` (never `codigo_orden_compra`) | slice 6 |
| 8 | `api-v2-compra-agil-by-publication-window` | `publicado_desde`/`publicado_hasta` | slice 6 |
| 9 | `csv-oc-download` + `csv-file-profile` + `csv-raw-load` | CSV parser dep; encoding/delimiter/quotechar detection; latin-1; raw row preservation; unknown columns preserved | slice 1 (schema) |
| 10 | `csv-licitaciones-download` + profile + raw-load | second CSV family; item/supplier/offer grain; repeated `CodigoExterno` | slice 9 |
| 11 | `csv-canonical-refresh` (OC + licitacion) | comma decimals; `1900-01-01` sentinel; `NA`/blank normalization; non-null protection on CSV-sourced fields | slice 9, 10 |
| 12 | `reconciliation-refresh` | exact-key joins (`CodigoLicitacion=CodigoExterno`, `id_orden_compra`); idempotent event dedupe; heuristic-candidate-not-truth | slices 2, 4, 7, 11 |
| 13 | read contracts: `getDetectedProcessDetail`, `getPipelineHealth`, `getApiQuotaUsage`, `getCsvFileHealth` | gold table population; cadence-relative freshness; `last429At`; CSV file health | slices 1-12 |
| 14 | resilience + quota: bounded retry, 429/401/403/404/500/503 classification | HTTP failure matrix; daily quota reset in `America/Santiago` | slice 1 |

---

## 1.2 Public Test Surface

### Behavior-Verified Through Public Interfaces

Tests target these public surfaces only (no private method spies, no internal collaborator mocks unless boundary):

| Module | Public interface | Test type |
| --- | --- | --- |
| `format-v1-date.util.ts` | `formatV1Date(date: Date): string` | unit |
| `classify-http-failure.util.ts` | `classifyHttpFailure(error: unknown): FailureClass` | unit |
| V2 param guard util | `validateCompraAgilListParams(params): void \| ValidationError[]` | unit |
| `detect-encoding.util.ts` | `detectEncoding(buffer: Buffer): DetectedEncoding` | unit |
| `detect-delimiter.util.ts` | `detectDelimiter(buffer: Buffer, encoding: string): DetectedDelimiter` | unit |
| `normalize-scalar.util.ts` | `normalizeDecimal(raw)`, `normalizeDate(raw)`, `normalizeNullLike(raw)` | unit |
| `MercadoPublicoApiClientService` | `fetchV1LicitacionesByDate(date)`, `fetchV1LicitacionDetail(codigo)`, `fetchV1OcByDate(date)`, `fetchV1OcDetail(codigo)`, `fetchV1LicitacionesByState(state)`, `fetchV1OcByState(state)`, `fetchV2CompraAgilList(params)`, `fetchV2CompraAgilDetail(codigo)` | unit (mocked SecureHttpClient) + integration |
| `MercadoPublicoCsvService` | `profileFile(stream): CsvFileProfile`, `parseRows(stream, opts): AsyncIterable<ParsedRow>` | unit (fixture streams) |
| `MercadoPublicoCanonicalRefreshService` | `refreshLicitacionFromRaw(rawPayloadId)`, `refreshOcFromRaw(rawPayloadId)`, `refreshCompraAgilFromRaw(rawPayloadId)`, `refreshCsvLicitacion(rawCsvFileId)`, `refreshCsvOc(rawCsvFileId)` | integration (DB-backed) |
| `MercadoPublicoReconciliationService` | `refreshReconciliation()`, `getReconciliationSummary(processType, code)` | integration (DB-backed) |
| `MercadoPublicoReadContractService` | `listDetectedProcesses(filters)`, `getDetectedProcessDetail(type, code)`, `getPipelineHealth()`, `getApiQuotaUsage()`, `getCsvFileHealth()` | integration (DB-backed) |
| `@Processor` job classes | job handler invoked via `SyncDriver` queue | integration (DB-backed, SyncDriver) |
| `@Command` trigger classes | CLI enqueue job | unit (mocked MessageQueueService) |

### What Is NOT Tested via Public Surface (out of scope or deferred)

- Private helper methods inside services — tested indirectly via public methods.
- TypeORM entity decorator metadata — verified via DB integration (tables exist, constraints work), not decorator introspection.
- BullMQ driver internals — repo's own responsibility, not MP change.
- Public GraphQL/REST/MCP endpoints — none added in phase 1 (per `spec.md:429-433`).
- Frontend — out of scope (task 3.36).

### Fixture Strategy

- **API mocks**: co-located `src/modules/mercado-publico/drivers/api/mocks/*.example.ts`. Synthetic JSON payloads shaped per source contract. NO real tickets.
- **CSV fixtures**: `src/modules/mercado-publico/csv/mocks/fixtures/*.{csv,csv.gz}`. Small synthetic files covering observed June 2026 formats (latin-1, `;`, `"`, comma decimals, `NA`, `1900-01-01`, repeated keys). ≤10 rows each for unit speed.
- **DB fixtures**: integration tests use `createApp` + `rawDataSource` (per `setup-test.ts:8-21`), insert raw payloads directly, then invoke services. No pre-seeded `mp` data files.
- **Queue fixtures**: `SyncDriver` processes jobs synchronously (per `create-app.ts:38,71`).

### Test File Layout

```
packages/twenty-server/src/modules/mercado-publico/
  drivers/api/utils/format-v1-date.util.spec.ts
  drivers/api/utils/classify-http-failure.util.spec.ts
  drivers/api/utils/validate-compra-agil-params.util.spec.ts
  drivers/api/mocks/*.example.ts
  drivers/api/mercado-publico-api-client.service.spec.ts
  csv/utils/detect-encoding.util.spec.ts
  csv/utils/detect-delimiter.util.spec.ts
  csv/utils/normalize-scalar.util.spec.ts
  csv/mocks/fixtures/*.csv
  csv/mercado-publico-csv.service.spec.ts
  services/mercado-publico-canonical-refresh.service.spec.ts
  services/mercado-publico-reconciliation.service.spec.ts
  services/mercado-publico-read-contract.service.spec.ts
  jobs/*.job.spec.ts
  commands/*.command.spec.ts

packages/twenty-server/test/integration/mercado-publico/suites/
  schema-creation.integration-spec.ts
  raw-api-persistence-idempotency.integration-spec.ts
  raw-csv-file-and-row-idempotency.integration-spec.ts
  api-v1-licitaciones-by-date.integration-spec.ts
  api-v1-licitacion-detail-non-null-protection.integration-spec.ts
  api-v1-oc-by-date-and-detail.integration-spec.ts
  api-v2-compra-agil-list-and-detail.integration-spec.ts
  csv-oc-profile-and-raw-load.integration-spec.ts
  csv-licitaciones-profile-and-raw-load.integration-spec.ts
  csv-canonical-refresh.integration-spec.ts
  reconciliation-refresh.integration-spec.ts
  read-contract-list-detected-processes.integration-spec.ts
  read-contract-pipeline-health.integration-spec.ts
  read-contract-api-quota-usage.integration-spec.ts
  read-contract-csv-file-health.integration-spec.ts
```

---

## 1.3 Unit Test Specs: V1 `ddmmaaaa` Date Formatting + V2 Compra Agil Parameter Guards

### `format-v1-date.util.spec.ts`

Target: `formatV1Date(date: Date): string` — formats a Date as `ddmmaaaa` (per `source-contract.md:46`, `spec.md:55-58`).

| Test name | Input | Expected |
| --- | --- | --- |
| `should format first day of year as ddmmaaaa` | `new Date('2026-01-01')` | `'01012026'` |
| `should format single-digit day and month with leading zeros` | `new Date('2026-03-07')` | `'07032026'` |
| `should format double-digit day and month without extra padding` | `new Date('2026-12-31')` | `'31122026'` |
| `should format mid-month date` | `new Date('2026-06-15')` | `'15062026'` |
| `should format february 29 in leap year` | `new Date('2024-02-29')` | `'29022024'` |
| `should format march 1 in non-leap year` | `new Date('2023-03-01')` | `'01032023'` |
| `should throw when input is invalid date` | `new Date('invalid')` | throws `RangeError` |

Note: V1 date format is `ddmmaaaa` (day, month, 4-digit year, no separators) per `source-contract.md:46`. Test pins exact string output. No timezone drift — use UTC-anchored Date construction or explicit timezone handling in the util (decision for impl: util should format in `America/Santiago` to match source operational timezone; tests construct dates accordingly and assert the formatted string).

### `validate-compra-agil-params.util.spec.ts`

Target: `validateCompraAgilListParams(params: CompraAgilListParams): ValidationError[]` — enforces V2 bounds (per `source-contract.md:154-177`, `spec.md:99-103`).

| Test name | Input | Expected |
| --- | --- | --- |
| `should return no errors when params are within documented bounds` | `{ tamano_pagina: 25, numero_pagina: 1 }` | `[]` |
| `should return no errors when tamano_pagina is exactly 50` | `{ tamano_pagina: 50, numero_pagina: 1 }` | `[]` |
| `should return error when tamano_pagina exceeds 50` | `{ tamano_pagina: 51, numero_pagina: 1 }` | `[{ field: 'tamano_pagina', code: 'exceeds_max' }]` |
| `should return error when tamano_pagina is zero or negative` | `{ tamano_pagina: 0, numero_pagina: 1 }` | `[{ field: 'tamano_pagina', code: 'out_of_range' }]` |
| `should return error when numero_pagina is zero` | `{ tamano_pagina: 25, numero_pagina: 0 }` | `[{ field: 'numero_pagina', code: 'must_start_at_1' }]` |
| `should return error when numero_pagina is negative` | `{ tamano_pagina: 25, numero_pagina: -1 }` | `[{ field: 'numero_pagina', code: 'must_start_at_1' }]` |
| `should return error when both id and q are provided` | `{ id: 'ABC123', q: 'search text', tamano_pagina: 25, numero_pagina: 1 }` | `[{ field: 'id_q', code: 'mutually_exclusive' }]` |
| `should return no errors when only id is provided` | `{ id: 'ABC123', tamano_pagina: 25, numero_pagina: 1 }` | `[]` |
| `should return no errors when only q is provided` | `{ q: 'search text', tamano_pagina: 25, numero_pagina: 1 }` | `[]` |
| `should return no errors when neither id nor q is provided` | `{ tamano_pagina: 25, numero_pagina: 1 }` | `[]` |
| `should accumulate multiple errors` | `{ tamano_pagina: 100, numero_pagina: 0, id: 'X', q: 'Y' }` | 3 errors (tamano_pagina, numero_pagina, id_q) |
| `should return no errors for default empty params` | `{}` | `[]` (defaults applied: tamano_pagina=15, numero_pagina=1) |

Note: V2 `id` and `q` mutually exclusive per `source-contract.md:174`. `tamano_pagina` default 15, max 50 per `source-contract.md:167`. `numero_pagina` starts at 1 per `source-contract.md:168`. Tests pin boundary behavior — off-by-one at 50/51, 0/1, and the mutex rule.

### `classify-http-failure.util.spec.ts` (adjacent, supports V1 + V2)

Target: `classifyHttpFailure(error: unknown): 'param_error' \| 'hard_fail' \| 'soft_miss' \| 'retryable_failed'` — per `design.md:398-405`, `spec.md:304-329`.

| Test name | Input | Expected |
| --- | --- | --- |
| `should classify 400 as param_error` | axios error with `response.status: 400` | `'param_error'` |
| `should classify 401 as hard_fail` | axios error with `response.status: 401` | `'hard_fail'` |
| `should classify 403 as hard_fail` | axios error with `response.status: 403` | `'hard_fail'` |
| `should classify 404 as soft_miss` | axios error with `response.status: 404` | `'soft_miss'` |
| `should classify 429 as retryable_failed` | axios error with `response.status: 429` | `'retryable_failed'` |
| `should classify 500 as retryable_failed` | axios error with `response.status: 500` | `'retryable_failed'` |
| `should classify 503 as retryable_failed` | axios error with `response.status: 503` | `'retryable_failed'` |
| `should classify timeout as retryable_failed` | axios error with `code: 'ETIMEDOUT'` | `'retryable_failed'` |
| `should classify ECONNABORTED as retryable_failed` | axios error with `code: 'ECONNABORTED'` | `'retryable_failed'` |
| `should classify network error as retryable_failed` | axios error with `code: 'ERR_NETWORK'` | `'retryable_failed'` |
| `should classify unknown status as hard_fail` | axios error with `response.status: 418` | `'hard_fail'` (safe default) |
| `should classify non-axios error as hard_fail` | `new Error('boom')` | `'hard_fail'` |

Note: classification drives job retry behavior. 429/500/503/timeout = retryable (bounded backoff). 401/403 = hard fail, no retry. 400 = param error, no retry, record. 404 = soft miss, auditable, no retry. Tests pin the full matrix. `isAxiosError` used for type narrowing (per `http-tool.ts:3` pattern).

---

## 1.4 Unit Test Specs: CSV Profiling (Encoding, Delimiter, Quotechar, Latin-1)

### `detect-encoding.util.spec.ts`

Target: `detectEncoding(buffer: Buffer): { encoding: 'utf-8' \| 'utf-8-sig' \| 'latin-1'; fallbackUsed: boolean }` — per `source-contract.md:227-232`, `spec.md:137-143`.

| Test name | Input fixture | Expected |
| --- | --- | --- |
| `should detect utf-8 when buffer is valid utf-8 without BOM` | UTF-8 buffer, no BOM, ascii-only content | `{ encoding: 'utf-8', fallbackUsed: false }` |
| `should detect utf-8-sig when buffer has BOM` | buffer with `EF BB BF` prefix | `{ encoding: 'utf-8-sig', fallbackUsed: false }` |
| `should detect latin-1 when utf-8 decode fails on accented text` | latin-1 encoded `José Martínez` (byte `0xE9` for é) | `{ encoding: 'latin-1', fallbackUsed: true }` |
| `should detect latin-1 for observed June 2026 CSV accented text` | latin-1 fixture with `Dirección`, `Martínez`, `uña` | `{ encoding: 'latin-1', fallbackUsed: true }` |
| `should detect utf-8 for valid accented utf-8 text` | utf-8 encoded `José Martínez` (2-byte é) | `{ encoding: 'utf-8', fallbackUsed: false }` |
| `should prefer utf-8-sig over utf-8 when BOM present` | BOM + valid utf-8 body | `{ encoding: 'utf-8-sig', fallbackUsed: false }` |
| `should mark fallbackUsed false when utf-8 succeeds` | plain ascii buffer | `{ encoding: 'utf-8', fallbackUsed: false }` |

Note: detection order per `source-contract.md:229-231`: try UTF-8 and UTF-8-SIG first, latin-1 fallback. `fallbackUsed: true` only when latin-1 was needed. Tests pin the observed June 2026 latin-1 requirement (`source-contract.md:244`) without making it a universal guarantee.

### `detect-delimiter.util.spec.ts`

Target: `detectDelimiter(buffer: Buffer, encoding: string): { delimiter: ';' \| ',' \| '\t' \| '\|'; confidence: number }` — per `source-contract.md:220-225`, `spec.md:131-135`.

| Test name | Input fixture | Expected |
| --- | --- | --- |
| `should detect semicolon delimiter from observed June 2026 OC CSV` | `Codigo;FechaEnvio;Estado\n...` | `{ delimiter: ';', confidence: >0.9 }` |
| `should detect comma delimiter` | `Codigo,FechaEnvio,Estado\n...` | `{ delimiter: ',', confidence: >0.9 }` |
| `should detect tab delimiter` | `Codigo\tFechaEnvio\tEstado\n...` | `{ delimiter: '\t', confidence: >0.9 }` |
| `should detect pipe delimiter` | `Codigo\|FechaEnvio\|Estado\n...` | `{ delimiter: '\|', confidence: >0.9 }` |
| `should detect semicolon when comma appears inside quoted decimal values` | `"Monto";"1,5";"Estado"\n...` (comma decimal inside quotes) | `{ delimiter: ';', confidence: >0.8 }` |
| `should detect delimiter by frequency on multi-line sample` | 5-line sample, 4 `;` per line, 1 `,` per line | `{ delimiter: ';' }` |
| `should handle empty buffer gracefully` | empty buffer | throws or returns null (impl decision; test pins behavior) |

Note: detection by counting candidate occurrences outside quoted regions, per `source-contract.md:220-225`. Comma-decimal edge case (`source-contract.md:249`) is critical — delimiter detection must not misidentify comma decimals as delimiter. Tests pin the observed `;` behavior without hardcoding it as universal.

### CSV Profiling Integration (within `mercado-publico-csv.service.spec.ts`)

Target: `profileFile(stream: Readable): CsvFileProfile` — combines encoding + delimiter + quotechar + header capture + schema fingerprint (per `spec.md:127-135`, `source-contract.md:347-369`).

| Test name | Fixture | Asserts |
| --- | --- | --- |
| `should profile latin-1 semicolon CSV with quotechar` | June 2026 OC fixture (latin-1, `;`, `"`) | `encoding='latin-1'`, `delimiter=';'`, `quotechar='"'`, `header_raw` preserved, `observed_columns` count matches, `column_count` correct, `schema_fingerprint` stable across reruns |
| `should capture header_raw exactly as observed including unusual column names` | licitaciones fixture with `Nombre producto genrico`, `DescripcionCriteriosRequisitosSociales.1`, `Monto Estimado Adjudicado` | those exact strings present in `observed_columns` |
| `should preserve unknown columns without dropping them` | fixture with extra `UnknownCol_X` column | `UnknownCol_X` in `observed_columns` |
| `should compute deterministic schema_fingerprint for same header` | same fixture profiled twice | fingerprints equal |
| `should compute different schema_fingerprint for different headers` | two fixtures with different column sets | fingerprints differ |
| `should preserve quotechar in profile` | fixture using `"` quotechar | `quotechar='"'` |
| `should record column_count matching observed_columns length` | fixture with 78 columns (OC shape per `source-contract.md:265`) | `column_count === observed_columns.length` |

Note: `profileFile` is the public entry for CSV profiling. Tests use small fixture files (≤10 rows) for unit speed. `schema_fingerprint` = hash of normalized header (exact column names + order). Per `source-contract.md:255-257`, raw column names preserved exactly including misspellings and spaces.

---

## 1.5 Unit Test Specs: Comma Decimal, `1900-01-01` Sentinel, Null-Like Normalization

### `normalize-scalar.util.spec.ts`

Target: three pure functions per `source-contract.md:329-339`, `spec.md:203-209`, `design.md:202-204`.

#### `normalizeDecimal(raw: string): { value: number \| null; parseError: string \| null }`

| Test name | Input | Expected |
| --- | --- | --- |
| `should parse comma decimal into number` | `'20700794,94'` | `{ value: 20700794.94, parseError: null }` |
| `should parse small comma decimal` | `'0,1'` | `{ value: 0.1, parseError: null }` |
| `should parse integer string without comma` | `'12345'` | `{ value: 12345, parseError: null }` |
| `should parse negative comma decimal` | `'-1,5'` | `{ value: -1.5, parseError: null }` |
| `should return null value with parseError for non-numeric` | `'abc'` | `{ value: null, parseError: 'not_numeric' }` |
| `should return null value for empty string` | `''` | `{ value: null, parseError: null }` (empty = null, not error) |
| `should return null value for NA` | `'NA'` | `{ value: null, parseError: null }` (NA = null-like, not error) |
| `should return null value for whitespace-only` | `'   '` | `{ value: null, parseError: null }` |
| `should record parseError for multiple commas` | `'1,2,3'` | `{ value: null, parseError: 'multiple_commas' }` |
| `should not mutate raw storage` | (verified at integration: raw row `raw_row_json` retains `'20700794,94'` string) | integration assert, not unit |

Note: comma decimal conversion per `source-contract.md:336-338`. Raw decimal strings preserved in raw storage; conversion only in validated numeric canonical fields. Tests pin the observed June 2026 format (`source-contract.md:249`: `20700794,94` and `0,1`). `NA`/blank/whitespace = null-like (no error), non-numeric = error.

#### `normalizeDate(raw: string): { value: Date \| null; isSentinel1900: boolean; parseError: string \| null }`

| Test name | Input | Expected |
| --- | --- | --- |
| `should parse YYYY-MM-DD date` | `'2026-06-15'` | `{ value: Date(2026-06-15), isSentinel1900: false, parseError: null }` |
| `should mark 1900-01-01 as sentinel with null value` | `'1900-01-01'` | `{ value: null, isSentinel1900: true, parseError: null }` |
| `should parse date outside file month without assuming file month` | `'2026-05-20'` (file period 2026-06) | `{ value: Date(2026-05-20), isSentinel1900: false, parseError: null }` (per `source-contract.md:341-345`) |
| `should return parseError for invalid date string` | `'not-a-date'` | `{ value: null, isSentinel1900: false, parseError: 'invalid_format' }` |
| `should return parseError for malformed date` | `'2026/06/15'` (wrong separator) | `{ value: null, isSentinel1900: false, parseError: 'invalid_format' }` |
| `should return null value without error for NA` | `'NA'` | `{ value: null, isSentinel1900: false, parseError: null }` |
| `should return null value without error for empty` | `''` | `{ value: null, isSentinel1900: false, parseError: null }` |
| `should return null value without error for whitespace` | `'   '` | `{ value: null, isSentinel1900: false, parseError: null }` |
| `should preserve raw date string in raw storage` | (integration: `raw_row_json.FechaEnvio === '1900-01-01'` after canonical normalization) | integration assert |

Note: `1900-01-01` sentinel handling per `source-contract.md:328-333`, `spec.md:209`. Must NOT treat as normal business date. Sentinel flag set, value null. Raw string preserved in raw storage (integration verify). Monthly partition caution per `source-contract.md:341-345`: business dates parsed independently of file `source_period`.

#### `normalizeNullLike(raw: string): string \| null`

| Test name | Input | Expected |
| --- | --- | --- |
| `should return null for NA` | `'NA'` | `null` |
| `should return null for empty string` | `''` | `null` |
| `should return null for whitespace-only` | `'   '` | `null` |
| `should return null for tab-only` | `'\t'` | `null` |
| `should return trimmed value for non-null-like string` | `'  hello  '` | `'hello'` |
| `should return original string for non-null-like with content` | `'Aceptada'` | `'Aceptada'` |
| `should return numeric string unchanged` | `'12345'` | `'12345'` |
| `should return comma decimal string unchanged` | `'1,5'` | `'1,5'` (null-like only trims; decimal conversion is `normalizeDecimal`'s job) |
| `should return date string unchanged` | `'1900-01-01'` | `'1900-01-01'` (sentinel handling is `normalizeDate`'s job) |
| `should not treat 0 as null-like` | `'0'` | `'0'` |
| `should not treat false as null-like` | `'false'` | `'false'` |

Note: `NA`/empty/whitespace = null-like per `source-contract.md:248,257`, `spec.md:207-208`. `normalizeNullLike` is the base null-check used by other normalizers and canonical refresh. It trims and returns null for null-likes, otherwise returns trimmed string. It does NOT convert decimals, dates, or booleans — those are separate functions. Tests pin the boundary: `0`, `false`, `'1900-01-01'`, `'1,5'` are NOT null-like.

### Raw Preservation Verification (integration-level, referenced here for completeness)

These are integration asserts (covered in Phase 2 slice tests 9, 11), but specified here to anchor the unit contract:

- After `normalizeDecimal('20700794,94')` produces `20700794.94` in canonical, `mp.raw_csv_row.raw_row_json.MontoTotalOC_PesosChilenos === '20700794,94'` (raw preserved).
- After `normalizeDate('1900-01-01')` sets `is_sentinel_1900=true` and canonical value null, `mp.raw_csv_row.raw_row_json.FechaEnvio === '1900-01-01'` (raw preserved).
- After `normalizeNullLike('NA')` sets canonical null, `mp.raw_csv_row.raw_row_json.SomeField === 'NA'` (raw preserved).

Per `source-contract.md:255-258`: raw does not correct spelling, rename columns, convert dates, convert decimals, normalize booleans, or collapse `NA` to null.

---

## 1.6 Unit Test Specs: State Normalization, Unknown Raw Type, Non-Null-Over-Null Protection, Reconciliation Rules

Note: HTTP failure classification was specified in §1.3 (`classify-http-failure.util.spec.ts`, 12 cases) — not duplicated here. This section covers the remaining behaviors from task 1.6: state normalization, unknown raw type handling, non-null-over-null protection, and reconciliation rules.

### `normalize-licitacion-state.util.spec.ts`

Target: `normalizeLicitacionState(rawCode: string \| number): { canonicalState: string; rawStateCode: string; rawStateLabel: string }` — per `source-contract.md:74-84`, `spec.md:62-63,192-201`.

Documented V1 Licitacion states (`source-contract.md:76-84`):

| Code | State |
| ---: | --- |
| 5 | Publicada |
| 6 | Cerrada |
| 7 | Desierta |
| 8 | Adjudicada |
| 18 | Revocada |
| 19 | Suspendida |

| Test name | Input | Expected |
| --- | --- | --- |
| `should map code 5 to Publicada` | `'5'` | `{ canonicalState: 'publicada', rawStateCode: '5', rawStateLabel: 'Publicada' }` |
| `should map code 6 to Cerrada` | `'6'` | `{ canonicalState: 'cerrada', rawStateCode: '6', rawStateLabel: 'Cerrada' }` |
| `should map code 7 to Desierta` | `'7'` | `{ canonicalState: 'desierta', rawStateCode: '7', rawStateLabel: 'Desierta' }` |
| `should map code 8 to Adjudicada` | `'8'` | `{ canonicalState: 'adjudicada', rawStateCode: '8', rawStateLabel: 'Adjudicada' }` |
| `should map code 18 to Revocada` | `'18'` | `{ canonicalState: 'revocada', rawStateCode: '18', rawStateLabel: 'Revocada' }` |
| `should map code 19 to Suspendida` | `'19'` | `{ canonicalState: 'suspendida', rawStateCode: '19', rawStateLabel: 'Suspendida' }` |
| `should accept numeric code input` | `5` (number) | `{ canonicalState: 'publicada', rawStateCode: '5', rawStateLabel: 'Publicada' }` |
| `should preserve unknown raw code and label as unknown` | `'999'` | `{ canonicalState: 'unknown_raw_state', rawStateCode: '999', rawStateLabel: '999' }` |
| `should preserve empty raw code as unknown` | `''` | `{ canonicalState: 'unknown_raw_state', rawStateCode: '', rawStateLabel: '' }` |
| `should preserve null raw code as unknown` | `null` | `{ canonicalState: 'unknown_raw_state', rawStateCode: '', rawStateLabel: '' }` |

Note: raw `CodigoEstado` and raw state label preserved alongside canonical per `spec.md:62-63`, `source-contract.md:78-84`. Unknown codes map to `unknown_raw_state` (not `unknown_raw_type` — that's for licitacion types, see below). Canonical state uses lowercase snake_case. Raw code preserved as string even when input is number.

### `normalize-oc-state.util.spec.ts`

Target: `normalizeOcState(rawCode: string \| number): { canonicalState: string; rawStateCode: string; rawStateLabel: string }` — per `source-contract.md:120-131`, `spec.md:82-86`.

Documented V1 OC states (`source-contract.md:122-131`):

| Code | State |
| ---: | --- |
| 4 | Enviada a proveedor |
| 5 | En proceso |
| 6 | Aceptada |
| 9 | Cancelada |
| 12 | Recepcion Conforme |
| 13 | Pendiente de Recepcionar |
| 14 | Recepcionada Parcialmente |
| 15 | Recepcion Conforme Incompleta |

| Test name | Input | Expected |
| --- | --- | --- |
| `should map code 4 to enviada_a_proveedor` | `'4'` | `{ canonicalState: 'enviada_a_proveedor', rawStateCode: '4', rawStateLabel: 'Enviada a proveedor' }` |
| `should map code 5 to en_proceso` | `'5'` | `{ canonicalState: 'en_proceso', rawStateCode: '5', rawStateLabel: 'En proceso' }` |
| `should map code 6 to aceptada` | `'6'` | `{ canonicalState: 'aceptada', rawStateCode: '6', rawStateLabel: 'Aceptada' }` |
| `should map code 9 to cancelada` | `'9'` | `{ canonicalState: 'cancelada', rawStateCode: '9', rawStateLabel: 'Cancelada' }` |
| `should map code 12 to recepcion_conforme` | `'12'` | `{ canonicalState: 'recepcion_conforme', rawStateCode: '12', rawStateLabel: 'Recepcion Conforme' }` |
| `should map code 13 to pendiente_de_recepcionar` | `'13'` | `{ canonicalState: 'pendiente_de_recepcionar', rawStateCode: '13', rawStateLabel: 'Pendiente de Recepcionar' }` |
| `should map code 14 to recepcionada_parcialmente` | `'14'` | `{ canonicalState: 'recepcionada_parcialmente', rawStateCode: '14', rawStateLabel: 'Recepcionada Parcialmente' }` |
| `should map code 15 to recepcion_conforme_incompleta` | `'15'` | `{ canonicalState: 'recepcion_conforme_incompleta', rawStateCode: '15', rawStateLabel: 'Recepcion Conforme Incompleta' }` |
| `should preserve unknown raw OC code as unknown` | `'999'` | `{ canonicalState: 'unknown_raw_state', rawStateCode: '999', rawStateLabel: '999' }` |

Note: `spec.md:84-86` also requires raw provider state preserved when available — that is an integration-level assert (raw payload has `EstadoProveedor` in JSON, canonical refresh copies it to `mp.orden_compra.raw_provider_state`). Unit test covers state code mapping; integration covers provider state passthrough.

### `normalize-licitacion-type.util.spec.ts`

Target: `normalizeLicitacionType(rawCodigoTipo: string): { canonicalType: string; rawCodigoTipo: string }` — per `source-contract.md:86-90`, `spec.md:197-201`.

| Test name | Input | Expected |
| --- | --- | --- |
| `should map known licitacion type code to canonical` | `'LP'` (Licitacion Publica, if in versioned dimension) | `{ canonicalType: 'licitacion_publica', rawCodigoTipo: 'LP' }` |
| `should map another known type code to canonical` | `'LE'` (Licitacion Especial, if in dimension) | `{ canonicalType: 'licitacion_especial', rawCodigoTipo: 'LE' }` |
| `should map unknown raw type to unknown_raw_type` | `'ZZ'` (undocumented code) | `{ canonicalType: 'unknown_raw_type', rawCodigoTipo: 'ZZ' }` |
| `should preserve empty raw type as unknown` | `''` | `{ canonicalType: 'unknown_raw_type', rawCodigoTipo: '' }` |
| `should preserve null raw type as unknown` | `null` | `{ canonicalType: 'unknown_raw_type', rawCodigoTipo: '' }` |
| `should not validate against a single closed list` | `'NEW_CODE_2026'` | `{ canonicalType: 'unknown_raw_type', rawCodigoTipo: 'NEW_CODE_2026' }` (accepted, not rejected) |

Note: per `source-contract.md:88-90`, licitacion types are NOT validated against a single closed list. Known types map through a versioned canonical dimension (`mp.estado_dim` / `mp.modalidad_dim` per `design.md:108-109`). Unknown types accepted as `unknown_raw_type` for review. The known-type test cases depend on the versioned dimension seeded in impl — tests should mock or seed the dimension. Critical rule: unknown raw types are PRESERVED, never rejected or dropped.

### Non-Null-Over-Null Protection (`mercado-publico-canonical-refresh.service.spec.ts` subset)

Target: `refreshLicitacionFromRaw(rawPayloadId)` and `refreshOcFromRaw(rawPayloadId)` behavior — per `design.md:195`, `spec.md:192-195`, `ingestion-context.md:189`. Unit-level test via service with mocked repository (DB-backed integration in §1.8).

| Test name | Setup | Action | Assert |
| --- | --- | --- | --- |
| `should not overwrite existing non-null canonical field with null from detail payload` | canonical licitacion row has `title='Licitacion A'`; raw detail payload has `title=null` | invoke `refreshLicitacionFromRaw` | canonical `title` remains `'Licitacion A'` |
| `should overwrite existing null canonical field with non-null from detail payload` | canonical licitacion row has `title=null`; raw detail payload has `title='Licitacion A'` | invoke `refreshLicitacionFromRaw` | canonical `title` becomes `'Licitacion A'` |
| `should overwrite existing non-null canonical field with new non-null from detail payload` | canonical licitacion row has `title='Old'`; raw detail payload has `title='New'` | invoke `refreshLicitacionFromRaw` | canonical `title` becomes `'New'` |
| `should not overwrite existing non-null state with null state` | canonical `canonical_state='adjudicada'`; raw detail `CodigoEstado=null` | invoke refresh | canonical `canonical_state` remains `'adjudicada'` |
| `should preserve existing non-null when list snapshot has less detail than canonical` | canonical has full detail fields; raw list snapshot has sparse fields (nulls) | invoke refresh from list snapshot | canonical detail fields remain, list-snapshot fields update |
| `should apply non-null protection per-field not per-row` | canonical has `title='A'`, `buyerName='B'`; raw has `title=null`, `buyerName='C'` | invoke refresh | `title` stays `'A'`, `buyerName` becomes `'C'` |

Note: protection is field-level, not row-level (`design.md:195`, `spec.md:192-195`). Each canonical field evaluated independently: null raw never overwrites non-null canonical; non-null raw always overwrites (whether canonical was null or non-null). Tests pin per-field semantics explicitly to prevent row-level skip bugs.

### Reconciliation Rules (`mercado-publico-reconciliation.service.spec.ts` subset)

Target: `refreshReconciliation()` behavior — per `source-contract.md:446-489`, `design.md:239-261`, `spec.md:211-261`. Unit-level with mocked repos; full DB-backed in §1.8.

#### Exact key joins

| Test name | Setup | Assert |
| --- | --- | --- |
| `should record exact_codigo_externo when API and CSV licitacion share CodigoExterno` | API licitacion `CodigoExterno='L1'`, CSV licitacion `CodigoExterno='L1'` | `reconciliation_public_market_entities` row with `match_type='exact_codigo_externo'`, `match_confidence='high'` |
| `should record exact_codigo_licitacion when OC.CodigoLicitacion matches licitacion.CodigoExterno` | OC `CodigoLicitacion='L1'`, licitacion `CodigoExterno='L1'` | `match_type='exact_codigo_licitacion'`, `match_confidence='high'` |
| `should record exact_compra_agil_id_orden_compra when Compra Agil has id_orden_compra` | Compra Agil `orden_compra.id_orden_compra='OC-123'` | `match_type='exact_compra_agil_id_orden_compra'`, `match_confidence='high'` |
| `should record exact match using id_oc when id_orden_compra is null` | Compra Agil `orden_compra.id_orden_compra=null`, `id_oc='OC-456'` | `match_type='exact_compra_agil_id_orden_compra'`, `match_confidence='high'` |
| `should NOT join Compra Agil to licitacion via CodigoLicitacion` | Compra Agil has `CodigoLicitacion='L1'` | NO reconciliation row with `match_type` referencing licitacion via `CodigoLicitacion` (per `spec.md:245-249`) |
| `should not depend on codigo_orden_compra for Compra Agil to OC linkage` | Compra Agil `codigo_orden_compra=null`, `id_oc='OC-789'` | exact match recorded via `id_oc` |
| `should not depend only on state oc_emitida for OC linkage` | Compra Agil `estado='oc_emitida'` but `id_orden_compra=null` and `id_oc=null` | NO exact match recorded (per `spec.md:121-122`, `source-contract.md:192-193`) |

#### Source priority

| Test name | Setup | Assert |
| --- | --- | --- |
| `should prefer API for recent operational lifecycle state within 30-day window` | API state='cerrada', CSV state='adjudicada', `now(America/Santiago) <= max(FechaCierre, FechaPublicacion) + 30 days` | canonical state from API; reconciliation event records mismatch auditable |
| `should prefer CSV for historical state outside 30-day window` | API state='cerrada', CSV state='adjudicada', record older than 30 days | canonical state from CSV; reconciliation event records API disagreement |
| `should preserve CSV offer evidence absent from API` | CSV has offer rows, API has no offers | CSV offers preserved in canonical; not discarded |
| `should emit reconciliation event when API and CSV disagree on state` | API and CSV same `CodigoExterno`, different state | `reconciliation_event` row created with `event_type='state_mismatch'` |
| `should dedupe reconciliation event on rerun by logical fingerprint` | same mismatch detected in second `refreshReconciliation()` call | no new `reconciliation_event` row (idempotent by fingerprint) |

#### Heuristic candidates

| Test name | Setup | Assert |
| --- | --- | --- |
| `should record candidate_supplier_amount for supplier-amount heuristic match` | no exact key, supplier+amount match | `match_type='candidate_supplier_amount'`, `match_confidence='medium'` |
| `should record candidate_item_amount for item-amount heuristic match` | no exact key, item+amount match | `match_type='candidate_item_amount'`, `match_confidence='medium'` |
| `should record unmatched when no exact or heuristic match` | no exact key, no heuristic | `match_type='unmatched'`, `match_confidence='unknown'` |
| `should record manual_review_required for ambiguous heuristic` | multiple candidate matches | `match_type='manual_review_required'`, `match_confidence='low'` |
| `should NOT auto-promote heuristic candidate to exact truth` | candidate match exists | `match_type` remains `candidate_*`, never becomes `exact_*` without explicit review (per `spec.md:257-261`) |

#### CSV re-download conflict

| Test name | Setup | Assert |
| --- | --- | --- |
| `should keep both raw files when same source_period re-downloaded with different checksum` | file A (period 2026-06, checksum X) loaded, then file B (period 2026-06, checksum Y) loaded | both `mp.raw_csv_file` rows exist; neither deleted |
| `should recompute canonical from newer raw file after re-download` | file A then file B loaded, canonical refresh runs | canonical reflects file B data (newer `downloaded_at`) |
| `should emit reconciliation event when business-key outcomes change after re-download` | file A canonical had state='publicada', file B canonical has state='cerrada' for same `CodigoExterno` | `reconciliation_event` row with `event_type='source_period_rerun_mismatch'` |
| `should preserve older raw rows after re-download` | file A rows loaded, file B loaded | file A `raw_csv_row` rows still present (not deleted) |

Note: reconciliation rules are the highest-regression canonical rules (per `tasks.md` 1.6 footnote). Exact joins always win over heuristics. Heuristics produce candidates only, never silent truth. Reconciliation events idempotent by logical mismatch fingerprint (`design.md:260`, `spec.md:298-302`). CSV re-download keeps both raw files, recomputes from newer, emits event on business-key change (`ingestion-context.md:183`, `design.md:249-253`, `spec.md:152-158`).

---

## 1.7 Integration and DB Verification: Schema Creation and Raw-Layer Idempotency

### `schema-creation.integration-spec.ts`

Target: instance command creates `mp` schema + all required tables. DB-backed (per `setup-test.ts:8-21`, `create-app.ts:43-107`). Run via `npx nx run twenty-server:test:integration:with-db-reset`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should create mp schema after instance commands run` | DB reset + migrations applied | `SELECT schema_name FROM information_schema.schemata WHERE schema_name='mp'` returns row |
| `should create mp.raw_api_payload with required columns and unique constraint` | migrations applied | table exists with columns `id, source, endpoint, request_fingerprint, payload_checksum, request_params, http_status, fetched_at, raw_payload, schema_fingerprint`; UK on `(source, endpoint, request_fingerprint, payload_checksum)` |
| `should create mp.raw_csv_file with required columns and unique constraint` | migrations applied | table exists with columns per `design.md:67-70`; UK on `(source_dataset, source_period, file_checksum)` |
| `should create mp.raw_csv_row with required columns and unique constraint` | migrations applied | table exists with columns per `design.md:72-74`; UK on `(raw_csv_file_id, row_number, row_checksum)` |
| `should create mp.stg_api_v1_licitacion, stg_api_v1_orden_compra, stg_api_v2_compra_agil, stg_csv_licitacion, stg_csv_orden_compra, stg_job_run` | migrations applied | all staging tables exist |
| `should create canonical tables with natural-key unique constraints` | migrations applied | `mp.licitacion` UK `CodigoExterno`; `mp.orden_compra` UK `Codigo`; `mp.compra_agil` UK `codigo`; `mp.licitacion_item` UK `(CodigoExterno, Codigoitem)`; `mp.orden_compra_item` UK `IDItem`; etc per `design.md:117-125` |
| `should create mp.reconciliation_public_market_entities and mp.reconciliation_event` | migrations applied | both tables exist with required columns and UK constraints per `design.md:139-146` |
| `should create gold tables` | migrations applied | `mp.gold_detected_process`, `mp.gold_pipeline_health`, `mp.gold_api_quota_usage`, `mp.gold_csv_file_health`, `mp.gold_conciliacion_licitacion_oc` exist |
| `should not interfere with core, metadata, or workspace_<id> schemas` | migrations applied | `core`, `metadata` schemas intact; workspace schemas still created on workspace creation |
| `should be reversible via down` | run `down` on MP instance commands | `mp` schema dropped (or tables dropped if down only drops tables) — verify `DROP SCHEMA IF EXISTS mp CASCADE` semantics |

### `raw-api-persistence-idempotency.integration-spec.ts`

Target: raw API payload dedupe by `(source, endpoint, request_fingerprint, payload_checksum)` — per `design.md:388-389`, `spec.md:281-284`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should persist raw API payload with request fingerprint and checksum` | insert raw payload | row in `mp.raw_api_payload` with all required fields |
| `should deduplicate raw API payload on same fingerprint and checksum` | insert same payload twice | one row, not two (UK enforced) |
| `should keep separate raw payloads when fingerprint differs` | insert payload A (params date=01012026), payload B (params date=02012026) | two rows |
| `should keep separate raw payloads when checksum differs` | insert payload A (checksum X), payload B (same request, checksum Y — API returned different data) | two rows |
| `should keep separate raw payloads for different endpoints` | insert licitaciones-by-date payload, OC-by-date payload | two rows (different `endpoint`) |
| `should keep separate raw payloads for different sources` | insert V1 payload, V2 Compra Agil payload | two rows (different `source`) |
| `should record http_status and fetched_at on each raw payload` | insert payload | `http_status=200`, `fetched_at` set to current timestamp |
| `should record schema_fingerprint on raw payload` | insert payload | `schema_fingerprint` non-null (hash of expected response shape) |

### `raw-csv-file-and-row-idempotency.integration-spec.ts`

Target: raw CSV file dedupe by `(source_dataset, source_period, file_checksum)` + raw row dedupe by `(raw_csv_file_id, row_number, row_checksum)` — per `design.md:390-391`, `spec.md:286-290`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should persist raw CSV file with all metadata fields` | insert raw_csv_file row | all fields per `design.md:67-70` populated |
| `should deduplicate raw CSV file on same source_dataset, source_period, file_checksum` | insert same file metadata twice | one row |
| `should keep separate raw CSV files when checksum differs for same source_period` | insert file A (period 2026-06, checksum X), file B (period 2026-06, checksum Y) | two rows (re-download conflict case, per `spec.md:152-158`) |
| `should keep separate raw CSV files for different source_period` | file A (period 2026-06), file B (period 2026-05) | two rows |
| `should persist raw CSV rows with row_number, raw_row_text, raw_row_json, row_checksum` | insert rows | all fields populated per `design.md:72-74` |
| `should deduplicate raw CSV rows on same file, row_number, row_checksum` | insert same row twice | one row |
| `should keep separate rows for same row_number when checksum differs` | row 1 version A (checksum X), row 1 version B (checksum Y) | two rows |
| `should preserve raw_row_text exactly as observed including unusual column names` | row with `Nombre producto genrico` column | `raw_row_json` key is exactly `Nombre producto genrico` (misspelling preserved) |
| `should preserve unknown columns in raw_row_json` | row with `UnknownCol_X` column | `raw_row_json.UnknownCol_X` present |
| `should not enforce uniqueness on Codigo in raw OC CSV rows` | insert two rows with same `Codigo='OC-1'`, different `IDItem` | both rows persisted (no UK on `Codigo`) |
| `should not enforce uniqueness on CodigoExterno in raw licitaciones CSV rows` | insert two rows with same `CodigoExterno='L1'`, different `Codigoitem` | both rows persisted (per `source-contract.md:217`) |
| `should set parse_status success when raw_row_json parsed` | row parses cleanly | `parse_status='success'`, `parse_error=null` |
| `should set parse_status error and parse_error message when row fails parsing` | malformed row | `parse_status='error'`, `parse_error` contains error message |

---

## 1.8 Integration and DB Verification: List-to-Detail, Canonical Refresh, Reconciliation Visibility, Gold/Read Contract Correctness

### `api-v1-licitaciones-by-date.integration-spec.ts` (tracer bullet)

Target: end-to-end V1 Licitaciones by-date job — per `spec.md:52-58`, slice 1 from §1.1.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should ingest V1 licitaciones by date end-to-end` | mock V1 API returns list fixture; enqueue by-date job via `SyncDriver` | raw payload persisted, staging row created, canonical licitacion rows created, job run recorded |
| `should format date as ddmmaaaa in request params` | enqueue job with date 2026-06-15 | `raw_api_payload.request_params` contains `fecha='15062026'` |
| `should persist list snapshot as raw auditable payload` | job completes | `mp.raw_api_payload` row with `source='api-v1-licitaciones'`, `endpoint='by-date'`, `raw_payload` = full JSON |
| `should project list snapshot to staging` | job completes | `mp.stg_api_v1_licitacion` rows for each list item |
| `should create canonical licitacion rows keyed by CodigoExterno` | list fixture has `CodigoExterno='L1','L2'` | `mp.licitacion` rows with `CodigoExterno='L1'` and `'L2'` |
| `should preserve raw CodigoEstado and raw state label in canonical` | list fixture item has `CodigoEstado=5`, `Estado='Publicada'` | `mp.licitacion.raw_state_code='5'`, `mp.licitacion.raw_state_label='Publicada'`, `mp.licitacion.canonical_state='publicada'` |
| `should record job run in stg_job_run with success status` | job completes | `mp.stg_job_run` row with `job_name='api-v1-licitaciones-by-date'`, `status='success'`, counters populated |
| `should be idempotent on rerun` | enqueue same by-date job twice | raw payload deduped (if same checksum), canonical rows not duplicated |

### `api-v1-licitacion-detail-non-null-protection.integration-spec.ts`

Target: detail rehydrate + non-null protection — per `spec.md:64-69`, slice 2.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should rehydrate canonical licitacion from detail payload by CodigoExterno` | existing canonical `L1` (sparse from list); detail job fetches `L1` detail | canonical `L1` updated with detail fields (title, buyer, dates populated) |
| `should not overwrite non-null canonical title with null from detail` | canonical `L1` has `title='Licitacion A'`; detail payload has `title=null` | canonical `title` remains `'Licitacion A'` |
| `should not overwrite non-null canonical state with null from detail` | canonical `L1` has `canonical_state='adjudicada'`; detail `CodigoEstado=null` | canonical state remains `'adjudicada'` |
| `should overwrite null canonical fields with non-null from detail` | canonical `L1` has `buyerName=null`; detail has `buyerName='Municipio X'` | canonical `buyerName='Municipio X'` |
| `should update non-null canonical fields with new non-null from detail` | canonical `L1` has `title='Old'`; detail has `title='New'` | canonical `title='New'` |
| `should handle detail fetch for non-existent CodigoExterno as soft miss` | detail job for `L-NOEXIST` returns 404 | job records soft miss, no canonical row created, `stg_job_run.status='soft_miss'` |
| `should persist detail payload as raw separate from list payload` | list job ran (raw row A), detail job ran (raw row B) | two `mp.raw_api_payload` rows (different `endpoint`: 'by-date' vs 'detail-by-codigo') |

### `api-v1-oc-by-date-and-detail.integration-spec.ts`

Target: V1 OC by-date + detail — per `spec.md:75-92`, slices 4-5.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should ingest V1 OC by date with ddmmaaaa format` | mock V1 OC API; enqueue OC by-date job | raw payload persisted with `fecha='15062026'`, canonical `mp.orden_compra` rows created |
| `should preserve raw OC state and raw provider state` | OC fixture has `CodigoEstado=6`, `Estado='Aceptada'`, `EstadoProveedor='Recibida'` | canonical `raw_state_code='6'`, `raw_state_label='Aceptada'`, `raw_provider_state='Recibida'` |
| `should treat CodigoLicitacion as optional in OC` | OC fixture has `CodigoLicitacion=''` (blank) | canonical `mp.orden_compra.licitacion_codigo_externo=null` (not required, no error) |
| `should link OC to licitacion when CodigoLicitacion matches CodigoExterno` | OC `CodigoLicitacion='L1'`, licitacion `CodigoExterno='L1'` exists | reconciliation row `match_type='exact_codigo_licitacion'` |
| `should not fail OC detail when CodigoLicitacion is null` | detail payload for OC `OC-1` has `CodigoLicitacion=null` | canonical `OC-1` updated, no error |
| `should rehydrate OC canonical from detail by Codigo` | detail job for `OC-1` | canonical `OC-1` updated with detail fields |

### `api-v2-compra-agil-list-and-detail.integration-spec.ts`

Target: V2 Compra Agil — per `spec.md:94-122`, slices 6-8.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should reject V2 list params when tamano_pagina exceeds 50` | enqueue job with `tamano_pagina=51` | job records param error, no API call made, `stg_job_run.status='param_error'` |
| `should reject V2 list params when numero_pagina is 0` | enqueue job with `numero_pagina=0` | job records param error |
| `should reject V2 list params when both id and q provided` | enqueue job with `id='X', q='Y'` | job records param error |
| `should paginate V2 Compra Agil list` | mock API returns page 1 (tamano_pagina=15, numero_pagina=1) with `tieneMasResultados=true` | job fetches page 2, raw payloads for both pages persisted |
| `should support ttl_cambio_ms in incremental job` | enqueue incremental job with `ttl_cambio_ms=3600000, cambio_desde, cambio_hasta` | raw payload `request_params` contains those values |
| `should support publicado_desde and publicado_hasta in publication window job` | enqueue publication-window job with date range | raw payload `request_params` contains `publicado_desde`, `publicado_hasta` |
| `should record exact Compra Agil to OC match via id_orden_compra` | Compra Agil detail fixture has `orden_compra.id_orden_compra='OC-123'`, OC `Codigo='OC-123'` exists | reconciliation row `match_type='exact_compra_agil_id_orden_compra'` |
| `should record exact Compra Agil to OC match via id_oc when id_orden_compra null` | detail fixture `id_orden_compra=null, id_oc='OC-456'` | reconciliation row with `match_type='exact_compra_agil_id_orden_compra'` |
| `should not record exact match when both id_orden_compra and id_oc null` | detail fixture both null | no exact reconciliation row for OC linkage |
| `should not join Compra Agil to licitacion via CodigoLicitacion` | Compra Agil fixture has `CodigoLicitacion='L1'` | NO reconciliation row linking Compra Agil to licitacion (per `spec.md:245-249`) |
| `should persist Compra Agil detail with all fields optional` | detail fixture with many null fields | canonical `mp.compra_agil` row created, null fields stay null |

### `csv-oc-profile-and-raw-load.integration-spec.ts`

Target: CSV OC ingestion end-to-end — per `spec.md:123-171`, slices 9.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should profile OC CSV file detecting latin-1, semicolon, quotechar` | load latin-1 `;`-delimited OC fixture | `mp.raw_csv_file.detected_encoding='latin-1'`, `detected_delimiter=';'`, `quotechar='"'` |
| `should capture header_raw and observed_columns for OC CSV` | 78-column OC fixture | `header_raw` preserved, `observed_columns` length=78, `column_count=78` |
| `should compute deterministic schema_fingerprint for OC CSV header` | profile same fixture twice | same `schema_fingerprint` |
| `should preserve unknown columns in OC CSV raw rows` | fixture with `UnknownCol_X` | `raw_row_json.UnknownCol_X` present |
| `should preserve exact raw column names including misspellings in OC CSV` | fixture with `NombreroductoGenerico` (misspelled) | `raw_row_json` key is exactly `NombreroductoGenerico` |
| `should accept repeated Codigo in OC CSV rows` | fixture with 3 rows `Codigo='OC-1'`, different `IDItem` | all 3 rows persisted in `mp.raw_csv_row` |
| `should accept blank CodigoLicitacion in OC CSV rows` | fixture row with `CodigoLicitacion=''` | row persisted, no error |
| `should detect Compra Agil OC rows via EsCompraAgil=Si` | fixture row with `EsCompraAgil='Si'` | staging row flagged as Compra Agil |
| `should detect Compra Agil OC rows via CodigoAbreviadoTipoOC=AG` | fixture row with `CodigoAbreviadoTipoOC='AG'` | staging row flagged as Compra Agil |
| `should set parse_status success for valid OC rows` | well-formed row | `parse_status='success'` |
| `should set parse_status error for malformed OC rows` | malformed row | `parse_status='error'`, `parse_error` populated |
| `should record row_count in raw_csv_file matching loaded rows` | fixture with 10 rows | `mp.raw_csv_file.row_count=10` |

### `csv-licitaciones-profile-and-raw-load.integration-spec.ts`

Target: CSV licitaciones ingestion — per `spec.md:160-178`, slice 10.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should profile licitaciones CSV detecting latin-1, semicolon, quotechar` | latin-1 `;`-delimited licitaciones fixture | `detected_encoding='latin-1'`, `detected_delimiter=';'`, `quotechar='"'` |
| `should capture 110-column header for licitaciones CSV` | 110-column fixture (per `source-contract.md:294`) | `column_count=110` |
| `should preserve unusual column names in licitaciones CSV` | fixture with `Nombre producto genrico`, `DescripcionCriteriosRequisitosSociales.1`, `Monto Estimado Adjudicado` | exact strings in `observed_columns` |
| `should accept repeated CodigoExterno across Codigoitem rows` | fixture with 3 rows `CodigoExterno='L1'`, different `Codigoitem` | all rows persisted |
| `should accept repeated CodigoExterno across supplier/offer rows` | fixture with rows `CodigoExterno='L1'`, same `Codigoitem`, different `CodigoProveedor` | all rows persisted (grain = licitacion+item+supplier/offer per `source-contract.md:297-298`) |
| `should preserve raw Oferta seleccionada before boolean normalization` | fixture row with `Oferta seleccionada='Si'` | `raw_row_json['Oferta seleccionada']='Si'` (raw); canonical may have boolean `true` separately |
| `should record parse_status for each licitaciones row` | mixed valid/invalid rows | valid rows `parse_status='success'`, invalid `parse_status='error'` |

### `csv-canonical-refresh.integration-spec.ts`

Target: CSV canonical refresh + scalar normalization — per `spec.md:180-209`, slice 11.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should convert comma decimals in validated numeric canonical fields` | raw row `MontoTotalOC_PesosChilenos='20700794,94'` | canonical `mp.orden_compra_item.monto_total=20700794.94` |
| `should preserve raw decimal string in raw_row_json` | same row | `mp.raw_csv_row.raw_row_json.MontoTotalOC_PesosChilenos='20700794,94'` |
| `should mark 1900-01-01 as sentinel in canonical date field` | raw row `FechaEnvio='1900-01-01'` | canonical `is_sentinel_1900=true`, `fecha_envio=null` |
| `should preserve raw 1900-01-01 string in raw_row_json` | same row | `raw_row_json.FechaEnvio='1900-01-01'` |
| `should normalize NA to null in canonical without error` | raw row `SomeField='NA'` | canonical field `null`, no parse error |
| `should normalize blank to null in canonical without error` | raw row `SomeField=''` | canonical field `null` |
| `should normalize whitespace-only to null in canonical without error` | raw row `SomeField='   '` | canonical field `null` |
| `should preserve raw NA string in raw_row_json` | same row | `raw_row_json.SomeField='NA'` |
| `should parse business date outside file month without assuming file month` | file period 2026-06, row `FechaEnvio='2026-05-20'` | canonical `fecha_envio=Date(2026-05-20)` (not null, not forced to June) |
| `should not drop unknown columns during canonical refresh` | raw row has `UnknownCol_X='val'` | unknown col not in canonical (expected — canonical maps known fields only) but `raw_row_json` preserves it |
| `should dedup OC header by Codigo in canonical` | 3 raw rows `Codigo='OC-1'`, different `IDItem` | one `mp.orden_compra` row for `OC-1`, three `mp.orden_compra_item` rows |
| `should dedup licitacion header by CodigoExterno in canonical` | 3 raw rows `CodigoExterno='L1'`, different `Codigoitem` | one `mp.licitacion` row, multiple `mp.licitacion_item` rows |

### `reconciliation-refresh.integration-spec.ts`

Target: reconciliation visibility — per `spec.md:211-261`, slice 12.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should create reconciliation row for exact CodigoExterno match API+CSV` | API licitacion `L1`, CSV licitacion `L1` | `mp.reconciliation_public_market_entities` row `match_type='exact_codigo_externo'` |
| `should create reconciliation row for exact OC-CodigoLicitacion match` | OC `CodigoLicitacion='L1'`, licitacion `CodigoExterno='L1'` | `match_type='exact_codigo_licitacion'` |
| `should create reconciliation row for Compra Agil id_orden_compra match` | Compra Agil `id_orden_compra='OC-1'`, OC `Codigo='OC-1'` | `match_type='exact_compra_agil_id_orden_compra'` |
| `should create reconciliation event for state mismatch` | API state='publicada', CSV state='cerrada' for same `CodigoExterno` | `mp.reconciliation_event` row `event_type='state_mismatch'` |
| `should dedupe reconciliation event on rerun` | run `refreshReconciliation()` twice with same mismatch | one `reconciliation_event` row (idempotent by fingerprint) |
| `should prefer API state within 30-day recent window` | API state vs CSV state disagree, record within 30 days of `max(FechaCierre, FechaPublicacion)` | canonical state from API; event records mismatch |
| `should prefer CSV state outside 30-day window` | record older than 30 days | canonical state from CSV; event records API disagreement |
| `should keep heuristic candidate as candidate not exact` | supplier+amount heuristic match | `match_type='candidate_supplier_amount'`, `match_confidence='medium'` (not promoted to exact) |
| `should record unmatched when no match found` | orphan record | `match_type='unmatched'`, `match_confidence='unknown'` |
| `should keep both raw files and emit event on CSV re-download mismatch` | file A then file B (same period, different checksum), canonical state changed | both `raw_csv_file` rows, `reconciliation_event` with `event_type='source_period_rerun_mismatch'` |

### `read-contract-list-detected-processes.integration-spec.ts`

Target: `listDetectedProcesses(filters)` — per `spec.md:435-439`, `design.md:483-508`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should return detected processes from gold layer` | seed `mp.gold_detected_process` with 3 rows | `listDetectedProcesses({})` returns 3 rows |
| `should return minimum list shape fields` | seed gold row | each row has `processType, processCode, title, canonicalState, rawStateCode, rawStateLabel, buyerCode, buyerName, publishedAt, closingAt, sourcePriority, reconciliationStatus, lastSeenAt` |
| `should filter by processTypes` | seed licitacion + OC + Compra Agil rows | `listDetectedProcesses({processTypes:['licitacion']})` returns only licitacion rows |
| `should filter by states` | seed rows with states publicada + cerrada | `listDetectedProcesses({states:['publicada']})` returns only publicada |
| `should filter by buyerCode` | seed rows with different buyers | filter by `buyerCode='B1'` returns only B1 rows |
| `should filter by publishedFrom/publishedTo date range` | seed rows with different `publishedAt` | date range filter returns only rows in range |
| `should filter by changedSince` | seed rows with different `lastSeenAt` | `changedSince` filter returns only rows updated after timestamp |
| `should paginate with page and limit` | seed 25 rows | `listDetectedProcesses({page:2, limit:10})` returns rows 11-20 |
| `should sort by requested field` | seed rows with varied `publishedAt` | `sort: { field: 'publishedAt', direction: 'desc' }` returns newest first |
| `should not expose raw persistence details` | query list | response contains no `raw_payload`, `raw_row_json`, `request_fingerprint` fields (read contract decouples from raw) |

### `read-contract-pipeline-health.integration-spec.ts`

Target: `getPipelineHealth()` — per `spec.md:447-450`, `design.md:521-528`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should return latest run status by job` | seed `stg_job_run` with by-date success, by-state failure | `getPipelineHealth()` returns per-job latest status |
| `should return last success timestamp per job` | seed runs | `lastSuccessAt` populated per job |
| `should return last failure timestamp per job` | seed runs | `lastFailureAt` populated per job |
| `should return lag since last success` | seed run with `finished_at` 2 hours ago | `lagSinceLastSuccessMs` populated |
| `should return failure counters` | seed 3 failures, 5 successes | failure counter = 3 |
| `should report freshness healthy when last success under 1.5x cadence` | high-freq job (1h cadence), last success 30min ago | `freshness='healthy'` (30min < 1.5h) |
| `should report freshness degraded when last success over 1.5x and under 3x cadence` | 1h cadence, last success 2h ago | `freshness='degraded'` (1.5h < 2h < 3h) |
| `should report freshness stale when last success over 3x cadence` | 1h cadence, last success 4h ago | `freshness='stale'` (4h > 3h) |
| `should not require fixed scheduled cadence in phase 1` | no cron registered, only manual runs | health still reports based on actual run history (per `spec.md:375-379`) |

### `read-contract-api-quota-usage.integration-spec.ts`

Target: `getApiQuotaUsage()` — per `spec.md:341-346`, `design.md:529-537`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should return daily quota usage with source, dailyLimit, used, remaining` | seed quota tracking | response has `source, dailyLimit, used, remaining` |
| `should return resetAt with timezone-aware reset` | config `MERCADO_PUBLICO_QUOTA_TIMEZONE='America/Santiago'` | `resetAt` = next midnight America/Santiago |
| `should return last429At when 429 observed` | seed a 429 response event | `last429At` populated |
| `should return null last429At when no 429 observed` | no 429 events | `last429At=null` |

### `read-contract-csv-file-health.integration-spec.ts`

Target: `getCsvFileHealth()` — per `spec.md:447-450`, `design.md:539-551`.

| Test name | Setup | Assert |
| --- | --- | --- |
| `should return CSV file health with profiling outcomes` | seed `raw_csv_file` rows | response has `sourceDataset, sourcePeriod, sourceFileName, fileChecksum, detectedEncoding, detectedDelimiter, schemaFingerprint, rowCount, parseStatus, lastLoadedAt` |
| `should return last successful file processing state` | seed file with `parse_status='success'` | `parseStatus='success'` |
| `should return parse failures in health` | seed file with some `parse_status='error'` rows | error count reflected |
| `should report freshness for CSV files` | seed file loaded 2 days ago, cadence 24h | `freshness='degraded'` (2 days > 1.5 days, < 3 days) |

---

## 1.9 API Fixture Placement and Coverage

### Placement

Per `investigation.md` §0.2 "Existing API Client Modules" — mocks co-located in `src/modules/mercado-publico/drivers/api/mocks/`. Synthetic JSON, NO real tickets or secrets.

### Required API Fixtures (per `design.md:446-455`, `source-contract.md:490-516`)

| Fixture file | Shape | Covers |
| --- | --- | --- |
| `v1-licitacion-list.example.ts` | V1 Licitaciones list response JSON | `CodigoExterno`, `CodigoEstado` (5,6,7,8,18,19), `Estado` label, `FechaCierre`, `FechaPublicacion`, `CodigoTipo`, buyer fields; ≥3 items covering different states |
| `v1-licitacion-detail.example.ts` | V1 Licitacion detail response JSON | full detail: title, buyer, items, dates, `CodigoTipo`; some fields null to test non-null protection |
| `v1-licitacion-detail-with-null-fields.example.ts` | detail with `title=null`, `buyerName=null` | non-null-over-null protection test data |
| `v1-oc-list.example.ts` | V1 OC list response JSON | `Codigo`, `CodigoEstado` (4,5,6,9,12,13,14,15), `Estado`, `EstadoProveedor`, `CodigoLicitacion` (some blank), `MontoTotalOC_PesosChilenos` |
| `v1-oc-detail.example.ts` | V1 OC detail response JSON | full detail: items, `CodigoLicitacion` present |
| `v1-oc-detail-without-codigo-licitacion.example.ts` | detail with `CodigoLicitacion=null` | optional relationship test (per `spec.md:91-92`) |
| `v2-compra-agil-list-with-oc.example.ts` | V2 Compra Agil list response JSON | `codigo`, `estado` (publicada/cerrada/etc), `orden_compra.id_orden_compra` present, pagination fields `tieneMasResultados` |
| `v2-compra-agil-list-without-oc.example.ts` | V2 list where `orden_compra` is null or `id_orden_compra`/`id_oc` both null | OC linkage absent case |
| `v2-compra-agil-list-paginated.example.ts` | V2 list page 1 + page 2 | pagination behavior (page 1 `tieneMasResultados=true`, page 2 `false`) |
| `v2-compra-agil-detail-with-oc-via-id-orden.example.ts` | detail with `orden_compra.id_orden_compra='OC-123'`, `id_oc=null` | exact match via `id_orden_compra` |
| `v2-compra-agil-detail-with-oc-via-id-oc.example.ts` | detail with `id_orden_compra=null`, `id_oc='OC-456'` | exact match via `id_oc` fallback |
| `v2-compra-agil-detail-without-oc.example.ts` | detail with both `id_orden_compra` and `id_oc` null | no exact OC linkage |
| `v2-compra-agil-detail-with-codigo-licitacion.example.ts` | detail with `CodigoLicitacion='L1'` present | proves Compra Agil does NOT join to licitacion via this field (per `spec.md:245-249`) |
| `http-error-400.example.ts` | axios error shape with `response.status=400` | param error classification |
| `http-error-401.example.ts` | `response.status=401` | hard fail |
| `http-error-403.example.ts` | `response.status=403` | hard fail |
| `http-error-404.example.ts` | `response.status=404` | soft miss |
| `http-error-429.example.ts` | `response.status=429`, headers with retry window | retryable + quota |
| `http-error-500.example.ts` | `response.status=500` | retryable |
| `http-error-503.example.ts` | `response.status=503` | retryable |
| `http-error-timeout.example.ts` | axios error `code='ETIMEDOUT'` | retryable timeout |

### Coverage Verification (task 1.9 footnote: no real tickets or sensitive data)

- Grep all fixture files for `ticket` key or query param → must be placeholder like `'TICKET_PLACEHOLDER'` or absent, never a real ticket string.
- Grep for patterns resembling base64 tickets or long alphanumeric tokens → none.
- Fixtures cover: V1 licitacion list+detail, V1 OC list+detail, V2 list+detail (with/without OC linkage, both `id_orden_compra` and `id_oc` paths), pagination, HTTP error matrix (400/401/403/404/429/500/503/timeout).
- Fixtures cover all documented states: V1 Licitacion codes 5,6,7,8,18,19; V1 OC codes 4,5,6,9,12,13,14,15; V2 states publicada, cerrada, desierta, cancelada, proveedor_seleccionado, oc_emitida.

---

## 1.10 CSV Fixture Placement and Coverage

### Placement

Per `investigation.md` §0.2 — CSV fixtures in `src/modules/mercado-publico/csv/mocks/fixtures/`. Small synthetic files (≤10 rows each for unit speed). Binary-safe encoding (latin-1 bytes preserved).

### Required CSV Fixtures (per `design.md:456-468`, `source-contract.md:490-516`)

| Fixture file | Format | Covers |
| --- | --- | --- |
| `oc-minimal-latin1-semicolon.csv` | latin-1, `;` delimiter, `"` quotechar, 5 rows | baseline OC parsing: `Codigo`, `FechaEnvio`, `Estado`, `CodigoLicitacion`, `MontoTotalOC_PesosChilenos` with comma decimals |
| `oc-repeated-codigo-with-iditem.csv` | latin-1, `;`, 6 rows where `Codigo='OC-1'` repeats across 3 `IDItem` values | repeated OC header key, item-level grain (per `source-contract.md:267-272`) |
| `oc-blank-codigo-licitacion.csv` | latin-1, `;`, rows with `CodigoLicitacion` blank | nullable licitacion relationship (per `source-contract.md:273`) |
| `oc-compra-agil-detected.csv` | latin-1, `;`, rows with `EsCompraAgil='Si'` and separate rows with `CodigoAbreviadoTipoOC='AG'` | Compra Agil OC detection (per `source-contract.md:274`) |
| `oc-78-columns-with-unknown.csv` | latin-1, `;`, 78 observed columns + 1 unknown `UnknownCol_X` | unknown column preservation, full column count (per `source-contract.md:265`) |
| `oc-misspelled-column-names.csv` | latin-1, `;`, includes `NombreroductoGenerico` (misspelled), `Descripcion/Obervaciones` (misspelled), `Forma de Pago` | exact raw column name preservation (per `source-contract.md:278-287`) |
| `licitaciones-minimal-latin1-semicolon.csv` | latin-1, `;`, `"` quotechar, 5 rows | baseline licitaciones parsing |
| `licitaciones-repeated-codigo-externo-with-codigoitem.csv` | latin-1, `;`, 6 rows where `CodigoExterno='L1'` repeats across 3 `Codigoitem` values | repeated licitacion header key, item-level grain (per `source-contract.md:297-302`) |
| `licitaciones-repeated-codigo-externo-with-supplier-offer.csv` | latin-1, `;`, rows with same `CodigoExterno`+`Codigoitem`, different `CodigoProveedor`/`Nombre de la Oferta` | supplier/offer grain (per `source-contract.md:297-298`) |
| `licitaciones-110-columns-with-unusual-names.csv` | latin-1, `;`, 110 observed columns including `Nombre producto genrico`, `DescripcionCriteriosRequisitosSociales.1`, `Monto Estimado Adjudicado`, `Tipo de Adquisicion`, `Moneda Adquisicion`, `FechaSoporteFisico`, `FechaEstimadaFirma`, `FechaVisitaTerreno`, `DireccionVisita`, `FechaEntregaAntecedentes`, `DireccionEntrega`, `PeriodoTiempoRenovacion`, `Nombre linea Adquisicion`, `Descripcion linea Adquisicion`, `Nombre de la Oferta`, `Estado Oferta`, `Cantidad Ofertada`, `Moneda de la Oferta`, `Valor Total Ofertado`, `Oferta seleccionada` | exact unusual column name preservation (per `source-contract.md:305-327`) |
| `comma-decimal-samples.csv` | latin-1, `;`, `MontoTotalOC_PesosChilenos='20700794,94'` and `'0,1'` | comma decimal parsing (per `source-contract.md:249`) |
| `na-blank-whitespace-null-samples.csv` | rows with `NA`, empty fields, whitespace-only fields | null-like normalization (per `source-contract.md:248`) |
| `sentinel-1900-01-01-date-samples.csv` | rows with `FechaEnvio='1900-01-01'`, `FechaEstimadaFirma='1900-01-01'` | sentinel date handling (per `source-contract.md:251`) |
| `date-outside-file-month-samples.csv` | file period 2026-06, row with `FechaEnvio='2026-05-20'` | monthly partition caution (per `source-contract.md:341-345`) |
| `utf8-semicolon-sample.csv` | utf-8, `;`, accented text `José Martínez` (2-byte utf-8) | utf-8 detection path |
| `utf8-sig-bom-sample.csv` | utf-8 with BOM (`EF BB BF`), `;` | utf-8-sig detection path |
| `comma-delimited-sample.csv` | utf-8, `,` delimiter | comma delimiter detection |
| `tab-delimited-sample.csv` | utf-8, tab delimiter | tab delimiter detection |
| `pipe-delimited-sample.csv` | utf-8, `\|` delimiter | pipe delimiter detection |
| `quotechar-double-sample.csv` | latin-1, `;`, `"` quotechar, quoted fields with `;` inside quotes | quotechar handling, delimiter inside quoted field |
| `oferta-seleccionada-raw-preserved.csv` | rows with `Oferta seleccionada='Si'` and `'No'` | raw `Oferta seleccionada` preserved before boolean normalization (per `spec.md:178`) |
| `mixed-parse-status.csv` | 10 rows, 8 well-formed, 2 malformed | `parse_status` success/error mix |
| `empty.csv` | empty file or header-only | graceful handling (no rows, no crash) |

### Coverage Verification (task 1.10 footnote)

- Grep all CSV fixtures for real ticket strings or auth tokens → none.
- CSV fixtures cover: latin-1, `;` delimiter, `"` quotechar, comma decimals, `NA`/blank/whitespace nulls, `1900-01-01` sentinel, repeated OC `Codigo` with `IDItem`, blank `CodigoLicitacion`, Compra Agil OC markers (`EsCompraAgil=Si`, `CodigoAbreviadoTipoOC=AG`), repeated licitacion `CodigoExterno` with `Codigoitem` and supplier/offer grain, exact unusual raw column names (`Nombre producto genrico`, `DescripcionCriteriosRequisitosSociales.1`, `Monto Estimado Adjudicado`), date outside file month, utf-8/utf-8-sig/`,`/tab/`|` delimiter variants, quotechar with delimiter inside quotes, `Oferta seleccionada` raw preservation, mixed parse status, empty file.
- All fixtures ≤10 rows for unit test speed (except column-count fixtures which may have 1 row with full column set).

---

## Test Design Summary (Phase 1, tasks 1.1-1.10)

- **Tracer bullet** (1.1): `api-v1-licitaciones-by-date` end-to-end — proves all 7 backbone seams. 14 risk-ordered slices.
- **Public test surface** (1.2): utils, API client, CSV service, canonical/recon/read services, jobs (`SyncDriver`), commands. No private spies. No public API endpoint tests.
- **Unit specs** (1.3-1.6): V1 `ddmmaaaa` (7), V2 param guards (12), HTTP failure classification (12), CSV encoding (7), CSV delimiter (7), CSV profiling (7), comma decimal (10), `1900-01-01` sentinel (9), null-like (11), licitacion state normalization (10), OC state normalization (9), licitacion type + unknown raw type (6), non-null-over-null protection (6), reconciliation exact joins (7), source priority (5), heuristic candidates (5), CSV re-download conflict (4).
- **Integration/DB specs** (1.7-1.8): schema creation (10), raw API idempotency (8), raw CSV file/row idempotency (13), V1 licitaciones by-date end-to-end (8), V1 detail non-null protection (7), V1 OC by-date+detail (6), V2 Compra Agil list+detail (11), CSV OC profile+raw-load (12), CSV licitaciones profile+raw-load (7), CSV canonical refresh (12), reconciliation refresh (10), read contracts — list (10), pipeline health (9), API quota (4), CSV file health (4).
- **API fixtures** (1.9): 21 fixture files covering V1 lic/OC list+detail, V2 Compra Agil list+detail (with/without OC, both linkage paths), pagination, HTTP error matrix, all documented states. No real tickets.
- **CSV fixtures** (1.10): 22 fixture files covering latin-1, `;`, `"`, comma decimals, `NA`/blank/whitespace, `1900-01-01`, repeated keys, Compra Agil markers, unusual column names, date outside file month, encoding/delimiter variants, `Oferta seleccionada` raw, mixed parse status, empty file. ≤10 rows each for unit speed.
- **No implementation code written in this phase** (per Phase 1 contract). Test files written in Phase 2 as vertical TDD slices alongside implementation.
