---
type: schema-catalog
title: "Schema Catalog: mercado-publico-ingestion-backbone"
description: "Schema catalog for Mercado Publico Ingestion Backbone."
okf_version: "0.1"
---
# Schema Catalog: mercado-publico-ingestion-backbone

## Binding Declaration

This catalog is the **BINDING schema** for Phase 2 instance commands (tasks 2.1-2.14). Any deviation from this catalog during implementation requires updating this document first, not just changing the SQL. This enforces `proposal.md:19` ("agents do not invent fields, joins, or CSV schemas during implementation").

## Provenance Markers

Each column is marked with its provenance:

- `[doc]` — directly documented in source-contract, design, or spec
- `[inferred]` — derived from read contract shape, normalization rule, or test assert
- `[new]` — added for operational completeness, not in prior docs

## Routing Declaration

Surface: `openspec/`. Change-local artifact per `openspec/CONTEXT.md`. Consulted: `design.md:50-154,336-385,481-551`, `docs/business/mercado-publico-source-contract.md:38-488`, `docs/business/mercado-publico-ingestion-context.md:92-193`, `docs/standards/database-standard.md:121-136`, `docs/decisions/0005-deployment-local-mercado-publico-schema.md`, `docs/architecture/data-model.md:266-293`, `specs/mercado-publico-ingestion-backbone/spec.md`, `investigation.md §0.2`, `test-design.md`, `packages/twenty-server/src/engine/core-modules/workspace/workspace.entity.ts:64-106`.

---

## Naming Conventions

The `mp` schema uses **snake_case** — NOT the camelCase convention used by `core`/`metadata`/`workspace_<id>` schemas (which follow TypeORM entity metadata). Rationale: `mp` is a deployment-local data backbone, not a metadata-driven workspace entity schema. SQL convention is appropriate.

| Convention | `mp` schema | `core`/`workspace_<id>` schemas |
| --- | --- | --- |
| Column naming | snake_case (`request_fingerprint`) | camelCase (`"requestFingerprint"`) |
| Table naming | snake_case (`raw_api_payload`) | camelCase (`"logicFunction"`) |
| PK type | uuid | uuid |
| Timestamps | timestamptz | timestamptz |
| Raw payloads | jsonb | jsonb |
| Enum strategy | text + CHECK constraint | PG enum type (`_enum` suffix) |

Enum strategy: `mp` uses `text` + `CHECK (col IN (...))` instead of PG enum types. Rationale: PG enums require `CREATE TYPE` + `DROP TYPE` in migrations and are harder to alter. `text` + CHECK is simpler for a schema that may evolve during implementation. Values from `source-contract.md:472-488`.

---

## Type Mapping

Per `docs/standards/database-standard.md:121-136` and `docs/architecture/data-model.md:266-293`:

| Logical type | PostgreSQL type | Used for |
| --- | --- | --- |
| Surrogate PK | uuid | all `id` columns |
| Natural key | text | CodigoExterno, Codigo, codigo, Codigoitem, etc. |
| Raw payload | jsonb | raw_payload, raw_row_json, request_params, observed_columns |
| Free text | text | titles, names, descriptions, error_summary |
| Timestamp | timestamptz | fetched_at, downloaded_at, created_at, matched_at |
| Business date | date | fecha_publicacion, fecha_cierre |
| Integer | integer | http_status, row_number, column_count, row_count |
| Big integer | bigint | file_size_bytes |
| Decimal/monetary | numeric(18,2) | montos, importes |
| Boolean | boolean | is_sentinel_1900, is_oferta_seleccionada |
| Enumerated | text + CHECK | match_type, match_confidence, canonical_state, parse_status |

---

## Raw Layer

### mp.raw_api_payload

Source: `design.md:63-66`, traceability `design.md:338-349`, `source-contract.md:49`.

Purpose: Preserve full API request payloads before normalization.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `source` | text | NOT NULL | — | `[doc]` design.md:66 | 'api-v1-licitaciones', 'api-v1-oc', 'api-v2-compra-agil' |
| `endpoint` | text | NOT NULL | — | `[doc]` design.md:66 | 'by-date', 'by-state', 'detail-by-codigo' |
| `request_fingerprint` | text | NOT NULL | — | `[doc]` design.md:66 | hash of normalized request params |
| `payload_checksum` | text | NOT NULL | — | `[doc]` design.md:66 | SHA256 of raw_payload |
| `request_params` | jsonb | NOT NULL | — | `[doc]` design.md:66 | {fecha, estado, codigo, ...} — ticket stripped |
| `http_status` | integer | NOT NULL | — | `[doc]` design.md:66 | 200, 400, 401, 404, 429, etc. |
| `fetched_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:66 | response time |
| `raw_payload` | jsonb | NOT NULL | — | `[doc]` design.md:66 | full JSON, ticket stripped |
| `schema_fingerprint` | text | NOT NULL | — | `[doc]` design.md:66 | hash of expected response shape |
| `ingestion_job_id` | uuid | NULL | — | `[inferred]` traceability design.md:340 | FK to stg_job_run.id |
| `error_summary` | text | NULL | — | `[doc]` design.md:349 | param_error/hard_fail/soft_miss/retryable_failed |
| `records_fetched` | integer | NULL | — | `[inferred]` design.md:348 "records_*" | list item count |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | insert time |

Constraints:
- PK: `id`
- UK: `(source, endpoint, request_fingerprint, payload_checksum)` — dedupe per `design.md:65`, `spec.md:281-284`
- CHECK: `http_status >= 100 AND http_status < 600`
- FK: `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL

Source mapping:
- `request_params.fecha` ← `formatV1Date(date)` → 'ddmmaaaa' string (`source-contract.md:46`)
- `request_params.ticket` ← NEVER persisted (stripped before raw_payload save, `design.md:442`)
- `raw_payload` ← HTTP response body with ticket param stripped

### mp.raw_csv_file

Source: `design.md:67-70,351-371`, `source-contract.md:347-369`.

Purpose: Preserve downloaded CSV file metadata before parsing.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `source_system` | text | NOT NULL | — | `[doc]` design.md:353 | 'datos-abiertos' |
| `source_dataset` | text | NOT NULL | — | `[doc]` design.md:354 | 'oc', 'licitaciones' |
| `source_url` | text | NOT NULL | — | `[doc]` design.md:355 | download URL |
| `source_file_name` | text | NOT NULL | — | `[doc]` design.md:356 | e.g. '2026-6.csv' |
| `source_period` | text | NOT NULL | — | `[doc]` design.md:357 | e.g. '2026-06' |
| `source_modality` | text | NULL | — | `[doc]` design.md:358 | e.g. 'semestre-1', 'mes-6' |
| `downloaded_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:359 | |
| `file_checksum` | text | NOT NULL | — | `[doc]` design.md:360 | SHA256 |
| `file_size_bytes` | bigint | NOT NULL | — | `[doc]` design.md:361 | |
| `compression_type` | text | NULL | — | `[doc]` design.md:362 | '7z', 'zip', 'gzip', null |
| `detected_encoding` | text | NOT NULL | — | `[doc]` design.md:363 | 'utf-8', 'utf-8-sig', 'latin-1' |
| `detected_delimiter` | text | NOT NULL | — | `[doc]` design.md:364 | ';', ',', '\t', '\|' |
| `quotechar` | text | NULL | — | `[doc]` design.md:365 | '"', null |
| `header_raw` | text | NOT NULL | — | `[doc]` design.md:366 | exact raw header line |
| `observed_columns` | jsonb | NOT NULL | — | `[doc]` design.md:367 | array of exact column names |
| `column_count` | integer | NOT NULL | — | `[doc]` design.md:368 | |
| `schema_fingerprint` | text | NOT NULL | — | `[doc]` design.md:369 | hash of normalized header |
| `row_count` | integer | NOT NULL | — | `[doc]` design.md:370 | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(source_dataset, source_period, source_modality, file_checksum)` — NULL modality is deduplicated as equal per `design.md:69`, `spec.md:286-290`
- CHECK: `detected_encoding IN ('utf-8', 'utf-8-sig', 'latin-1')`
- CHECK: `detected_delimiter IN (';', ',', '\t', '\|')`
- CHECK: `column_count >= 0`
- CHECK: `row_count >= 0`

### mp.raw_csv_row

Source: `design.md:72-74,373-385`, `source-contract.md:371-385`.

Purpose: Preserve every CSV row as raw text plus parsed JSON.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_csv_file_id` | uuid | NOT NULL | — | `[doc]` design.md:74 | FK to raw_csv_file.id |
| `ingestion_job_id` | uuid | NULL | — | `[doc]` design.md:375 | FK to stg_job_run.id |
| `source_dataset` | text | NOT NULL | — | `[doc]` design.md:376 | 'oc', 'licitaciones' |
| `source_file_name` | text | NOT NULL | — | `[doc]` design.md:377 | |
| `source_period` | text | NOT NULL | — | `[doc]` design.md:378 | |
| `row_number` | integer | NOT NULL | — | `[doc]` design.md:379 | 1-based |
| `raw_row_text` | text | NOT NULL | — | `[doc]` design.md:380 | exact raw line |
| `raw_row_json` | jsonb | NULL | — | `[doc]` design.md:381 | parsed key-value, null if parse failed |
| `row_checksum` | text | NOT NULL | — | `[doc]` design.md:382 | SHA256 of raw_row_text |
| `parse_status` | text | NOT NULL | 'pending' | `[doc]` design.md:383 | 'success', 'error', 'pending' |
| `parse_error` | text | NULL | — | `[doc]` design.md:384 | error message when parse_status='error' |
| `created_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:385 | |

Constraints:
- PK: `id`
- UK: `(raw_csv_file_id, row_number, row_checksum)` — dedupe per `design.md:73`, `spec.md:286-290`
- CHECK: `parse_status IN ('success', 'error', 'pending')`
- FK: `raw_csv_file_id` → `mp.raw_csv_file(id)` ON DELETE CASCADE
- FK: `ingestion_job_id` → `mp.stg_job_run(id)` ON DELETE SET NULL
- NO uniqueness on `Codigo`, `ID`, `CodigoExterno`, `Codigoitem` — per `source-contract.md:217-218`, `design.md:198-199`

---

## Staging Layer

> **Note**: `design.md:89-93` described staging purpose but did NOT list columns. All columns below are `[inferred]` from source-contract API/CSV fields, read contract shapes (`design.md:496-551`), and test asserts (`test-design.md §1.8`). Staging stores raw strings (dates as text, not date type) — canonical refresh parses and normalizes. This preserves the raw→canonical boundary (`design.md:191`).

### mp.stg_api_v1_licitacion

Source: `design.md:91`, `source-contract.md:51-90`, `test-design.md §1.8`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_api_payload_id` | uuid | NOT NULL | — | `[inferred]` | FK to raw_api_payload |
| `source` | text | NOT NULL | — | `[inferred]` | 'api-v1-licitaciones' |
| `snapshot_kind` | text | NOT NULL | — | `[doc]` design.md:91 | 'list' or 'detail' |
| `codigo_externo` | text | NOT NULL | — | `[doc]` source-contract.md:72 | natural key |
| `codigo` | text | NULL | — | `[inferred]` source-contract.md:300 | internal id |
| `codigo_estado` | text | NULL | — | `[doc]` source-contract.md:76 | raw state code |
| `estado` | text | NULL | — | `[doc]` source-contract.md:76 | raw state label |
| `codigo_tipo` | text | NULL | — | `[doc]` source-contract.md:87 | raw type code |
| `nombre` | text | NULL | — | `[inferred]` | title |
| `fecha_publicacion` | text | NULL | — | `[inferred]` source-contract.md:411 | raw string, NOT parsed |
| `fecha_cierre` | text | NULL | — | `[inferred]` | raw string |
| `fecha_adjudicacion` | text | NULL | — | `[inferred]` source-contract.md:412 | raw string |
| `codigo_organismo` | text | NULL | — | `[inferred]` source-contract.md:62 | buyer code |
| `nombre_organismo` | text | NULL | — | `[inferred]` | buyer name |
| `fetched_at` | timestamptz | NOT NULL | — | `[inferred]` | from raw_api_payload |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- FK: `raw_api_payload_id` → `mp.raw_api_payload(id)` ON DELETE CASCADE
- CHECK: `snapshot_kind IN ('list', 'detail')`
- No UK: staging may contain multiple snapshots of same licitacion

### mp.stg_api_v1_orden_compra

Source: `design.md:91`, `source-contract.md:92-131`, `test-design.md §1.8`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_api_payload_id` | uuid | NOT NULL | — | `[inferred]` | FK |
| `source` | text | NOT NULL | — | `[inferred]` | 'api-v1-oc' |
| `snapshot_kind` | text | NOT NULL | — | `[doc]` design.md:91 | 'list' or 'detail' |
| `codigo` | text | NOT NULL | — | `[doc]` source-contract.md:112 | natural key |
| `codigo_estado` | text | NULL | — | `[doc]` source-contract.md:122 | raw state code |
| `estado` | text | NULL | — | `[doc]` source-contract.md:122 | raw state label |
| `estado_proveedor` | text | NULL | — | `[doc]` spec.md:85 | raw provider state |
| `codigo_licitacion` | text | NULL | — | `[doc]` source-contract.md:116 | optional, nullable |
| `fecha_envio` | text | NULL | — | `[inferred]` source-contract.md:394 | raw string |
| `monto_total_oc` | text | NULL | — | `[inferred]` source-contract.md:398 | raw string (may have comma decimal) |
| `tipo_moneda_oc` | text | NULL | — | `[inferred]` source-contract.md:397 | |
| `nombre_proveedor` | text | NULL | — | `[inferred]` source-contract.md:402 | |
| `fetched_at` | timestamptz | NOT NULL | — | `[inferred]` | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- FK: `raw_api_payload_id` → `mp.raw_api_payload(id)` ON DELETE CASCADE
- CHECK: `snapshot_kind IN ('list', 'detail')`
- No UK

### mp.stg_api_v2_compra_agil

Source: `design.md:91`, `source-contract.md:133-195`, `test-design.md §1.8`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_api_payload_id` | uuid | NOT NULL | — | `[inferred]` | FK |
| `source` | text | NOT NULL | — | `[inferred]` | 'api-v2-compra-agil' |
| `snapshot_kind` | text | NOT NULL | — | `[doc]` design.md:91 | 'list' or 'detail' |
| `codigo` | text | NOT NULL | — | `[doc]` source-contract.md:165 | natural key |
| `estado` | text | NULL | — | `[doc]` source-contract.md:180-186 | 'publicada','cerrada', etc. |
| `id_orden_compra` | text | NULL | — | `[doc]` source-contract.md:190 | OC linkage, nullable |
| `id_oc` | text | NULL | — | `[doc]` source-contract.md:191 | OC linkage fallback, nullable |
| `codigo_orden_compra` | text | NULL | — | `[doc]` source-contract.md:192 | NOT used for linkage |
| `publicado_desde` | text | NULL | — | `[inferred]` source-contract.md:161 | raw string |
| `publicado_hasta` | text | NULL | — | `[inferred]` source-contract.md:162 | raw string |
| `cambio_desde` | text | NULL | — | `[inferred]` source-contract.md:159 | raw string |
| `cambio_hasta` | text | NULL | — | `[inferred]` source-contract.md:160 | raw string |
| `fetched_at` | timestamptz | NOT NULL | — | `[inferred]` | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- FK: `raw_api_payload_id` → `mp.raw_api_payload(id)` ON DELETE CASCADE
- CHECK: `snapshot_kind IN ('list', 'detail')`
- No UK

### mp.stg_csv_licitacion

Source: `design.md:92`, `source-contract.md:289-327,387-419`, `test-design.md §1.8`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_csv_row_id` | uuid | NOT NULL | — | `[doc]` design.md:92 | FK to raw_csv_row |
| `source_dataset` | text | NOT NULL | — | `[inferred]` | 'licitaciones' |
| `source_period` | text | NOT NULL | — | `[inferred]` | |
| `codigo_externo` | text | NULL | — | `[doc]` source-contract.md:299 | may repeat |
| `codigo` | text | NULL | — | `[doc]` source-contract.md:300 | internal id, may repeat |
| `codigoitem` | text | NULL | — | `[doc]` source-contract.md:301 | item key |
| `codigo_proveedor` | text | NULL | — | `[doc]` source-contract.md:302 | supplier code |
| `rut_proveedor` | text | NULL | — | `[doc]` source-contract.md:302 | supplier RUT |
| `nombre_de_la_oferta` | text | NULL | — | `[doc]` source-contract.md:321 | offer name |
| `estado_oferta` | text | NULL | — | `[doc]` source-contract.md:322 | |
| `oferta_seleccionada` | text | NULL | — | `[doc]` source-contract.md:326 | raw 'Si'/'No', NOT boolean here |
| `cantidad_ofertada` | text | NULL | — | `[doc]` source-contract.md:323 | raw string |
| `valor_total_ofertado` | text | NULL | — | `[doc]` source-contract.md:325 | raw string (comma decimal) |
| `tipo_de_adquisicion` | text | NULL | — | `[doc]` source-contract.md:308 | |
| `fecha_publicacion` | text | NULL | — | `[doc]` source-contract.md:411 | raw string |
| `fecha_adjudicacion` | text | NULL | — | `[doc]` source-contract.md:412 | raw string |
| `estado` | text | NULL | — | `[doc]` source-contract.md:413 | raw state label |
| `nombre_unidad` | text | NULL | — | `[doc]` source-contract.md:414 | buyer unit name |
| `nombre_producto_generico` | text | NULL | — | `[doc]` source-contract.md:415 | |
| `cantidad_adjudicada` | text | NULL | — | `[doc]` source-contract.md:418 | raw string |
| `monto_estimado_adjudicado` | text | NULL | — | `[doc]` source-contract.md:320 | raw string (comma decimal) |
| `all_observed_fields` | jsonb | NULL | — | `[inferred]` design.md:92 "projected observed fields" | full raw_row_json for traceability |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- FK: `raw_csv_row_id` → `mp.raw_csv_row(id)` ON DELETE CASCADE
- No UK: grain is licitacion+item+supplier/offer, keys may repeat

### mp.stg_csv_orden_compra

Source: `design.md:92`, `source-contract.md:260-287,391-404`, `test-design.md §1.8`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `raw_csv_row_id` | uuid | NOT NULL | — | `[doc]` design.md:92 | FK |
| `source_dataset` | text | NOT NULL | — | `[inferred]` | 'oc' |
| `source_period` | text | NOT NULL | — | `[inferred]` | |
| `codigo` | text | NULL | — | `[doc]` source-contract.md:270 | OC header key, may repeat |
| `source_id` | text | NULL | — | `[inferred]` source-contract.md:271 | raw CSV `ID` preserved without colliding with PK `id`; may repeat |
| `iditem` | text | NULL | — | `[doc]` source-contract.md:272 | item key |
| `codigo_licitacion` | text | NULL | — | `[doc]` source-contract.md:273 | nullable |
| `fecha_envio` | text | NULL | — | `[doc]` source-contract.md:394 | raw string |
| `estado` | text | NULL | — | `[doc]` source-contract.md:395 | raw state label |
| `descripcion_tipo_oc` | text | NULL | — | `[doc]` source-contract.md:396 | |
| `codigo_abreviado_tipo_oc` | text | NULL | — | `[doc]` source-contract.md:282 | e.g. 'AG' for Compra Agil |
| `codigo_tipo` | text | NULL | — | `[doc]` source-contract.md:275 | |
| `tipo_moneda_oc` | text | NULL | — | `[doc]` source-contract.md:397 | |
| `monto_total_oc_pesos_chilenos` | text | NULL | — | `[doc]` source-contract.md:283 | raw string (comma decimal) |
| `impuestos_oc` | text | NULL | — | `[doc]` source-contract.md:399 | raw string |
| `unidad_compra` | text | NULL | — | `[doc]` source-contract.md:401 | |
| `nombre_proveedor` | text | NULL | — | `[doc]` source-contract.md:402 | |
| `codigo_producto_onu` | text | NULL | — | `[doc]` source-contract.md:403 | |
| `total_linea_neto` | text | NULL | — | `[doc]` source-contract.md:404 | raw string |
| `es_compra_agil` | text | NULL | — | `[doc]` source-contract.md:280 | 'Si'/'No' raw |
| `es_trato_directo` | text | NULL | — | `[doc]` source-contract.md:281 | |
| `forma_de_pago` | text | NULL | — | `[doc]` source-contract.md:287 | |
| `codigo_convenio_marco` | text | NULL | — | `[doc]` source-contract.md:284 | |
| `all_observed_fields` | jsonb | NULL | — | `[inferred]` | full raw_row_json |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- FK: `raw_csv_row_id` → `mp.raw_csv_row(id)` ON DELETE CASCADE
- No UK: grain is item-level, `Codigo` may repeat

### mp.stg_job_run

Source: `design.md:93,336-349`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `job_name` | text | NOT NULL | — | `[doc]` design.md:93 | e.g. 'api-v1-licitaciones-by-date' |
| `job_run_id` | text | NOT NULL | — | `[doc]` design.md:93 | unique run identifier |
| `status` | text | NOT NULL | — | `[doc]` design.md:93 | 'success','failed','soft_miss','param_error','retryable_failed' |
| `started_at` | timestamptz | NOT NULL | — | `[doc]` design.md:93 | |
| `finished_at` | timestamptz | NULL | — | `[doc]` design.md:93 | |
| `records_fetched` | integer | NULL | — | `[inferred]` design.md:348 | |
| `records_staged` | integer | NULL | — | `[inferred]` | |
| `records_canonicalized` | integer | NULL | — | `[inferred]` | |
| `records_failed` | integer | NULL | — | `[inferred]` | |
| `error_summary` | text | NULL | — | `[doc]` design.md:349 | |
| `raw_csv_file_id` | uuid | NULL | — | `[doc] design.md:78` | FK to `mp.raw_csv_file(id)`; direct file-to-job-run link |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(job_name, job_run_id)` — one row per run
- FK: `raw_csv_file_id` → `mp.raw_csv_file(id)` ON DELETE SET NULL
- CHECK: `status IN ('success', 'failed', 'soft_miss', 'param_error', 'retryable_failed')`

---

## Canonical Layer

> **Note**: `design.md:115-125` specified UKs only. Columns below are `[inferred]` from source-contract API/CSV fields, read contract shapes (`design.md:496-551`), normalization rules (`design.md:187-205`), and test asserts. Non-null-over-null protection applies to ALL nullable columns per `design.md:195`, `spec.md:192-195`.

### mp.licitacion

Source: `design.md:117`, `source-contract.md:51-90,446-461`, `spec.md:192-201`, `test-design.md §1.6`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_externo` | text | NOT NULL | — | `[doc]` source-contract.md:72 | UK |
| `codigo` | text | NULL | — | `[doc]` source-contract.md:300 | internal id |
| `title` | text | NULL | — | `[inferred]` read contract design.md:498 | |
| `canonical_state` | text | NOT NULL | 'unknown_raw_state' | `[doc]` source-contract.md:76-84 | snake_case |
| `raw_state_code` | text | NULL | — | `[doc]` source-contract.md:76 | preserved |
| `raw_state_label` | text | NULL | — | `[doc]` source-contract.md:76 | preserved |
| `codigo_tipo` | text | NULL | — | `[doc]` source-contract.md:87 | raw type code |
| `canonical_type` | text | NULL | 'unknown_raw_type' | `[doc]` source-contract.md:86-90 | unknown → 'unknown_raw_type' |
| `buyer_code` | text | NULL | — | `[inferred]` source-contract.md:62 | FK to public_buyer |
| `buyer_name` | text | NULL | — | `[inferred]` read contract design.md:503 | denormalized |
| `fecha_publicacion` | date | NULL | — | `[inferred]` source-contract.md:411 | normalized from raw string |
| `fecha_cierre` | date | NULL | — | `[inferred]` ingestion-context.md:182 | recent-state boundary |
| `fecha_adjudicacion` | date | NULL | — | `[inferred]` source-contract.md:412 | |
| `is_sentinel_1900_publicacion` | boolean | NOT NULL | false | `[doc]` source-contract.md:328-333 | |
| `is_sentinel_1900_cierre` | boolean | NOT NULL | false | `[doc]` | |
| `source_priority` | text | NULL | — | `[inferred]` ingestion-context.md:128-168 | 'api'/'csv' |
| `reconciliation_status` | text | NULL | — | `[inferred]` read contract design.md:507 | 'exact'/'candidate'/'unmatched'/'manual_review_required' |
| `source_attribution` | jsonb | NULL | — | `[doc]` design.md:197 | per-field source tracking |
| `last_seen_at` | timestamptz | NOT NULL | now() | `[inferred]` read contract design.md:508 | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `codigo_externo` (`design.md:117`)
- FK: `buyer_code` → `mp.public_buyer(codigo_organismo)` ON DELETE SET NULL
- CHECK: `canonical_state IN ('publicada','cerrada','desierta','adjudicada','revocada','suspendida','unknown_raw_state')`

### mp.licitacion_item

Source: `design.md:118`, `source-contract.md:297-302`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_externo` | text | NOT NULL | — | `[doc]` design.md:118 | FK to licitacion |
| `codigoitem` | text | NOT NULL | — | `[doc]` design.md:118 | item key |
| `nombre_producto_generico` | text | NULL | — | `[inferred]` source-contract.md:415 | |
| `cantidad` | text | NULL | — | `[inferred]` | raw |
| `moneda` | text | NULL | — | `[inferred]` source-contract.md:309 | |
| `monto_estimado` | numeric(18,2) | NULL | — | `[inferred]` source-contract.md:320 | normalized from comma decimal |
| `raw_monto_estimado` | text | NULL | — | `[doc]` design.md:204 | raw string preserved |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo_externo, codigoitem)` (`design.md:118`)
- FK: `codigo_externo` → `mp.licitacion(codigo_externo)` ON DELETE CASCADE

### mp.licitacion_oferta

Source: `design.md:119`, `source-contract.md:297-327,446-461`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_externo` | text | NOT NULL | — | `[doc]` design.md:119 | |
| `codigoitem` | text | NOT NULL | — | `[doc]` design.md:119 | |
| `codigo_proveedor` | text | NULL | — | `[doc]` source-contract.md:302 | |
| `rut_proveedor` | text | NULL | — | `[doc]` source-contract.md:302 | |
| `nombre_de_la_oferta` | text | NOT NULL | — | `[doc]` design.md:119 | part of UK |
| `estado_oferta` | text | NULL | — | `[doc]` source-contract.md:322 | raw |
| `cantidad_ofertada` | text | NULL | — | `[doc]` source-contract.md:323 | raw |
| `moneda_oferta` | text | NULL | — | `[doc]` source-contract.md:324 | |
| `valor_total_ofertado` | numeric(18,2) | NULL | — | `[inferred]` source-contract.md:325 | normalized |
| `raw_valor_total_ofertado` | text | NULL | — | `[doc]` design.md:204 | raw preserved |
| `is_oferta_seleccionada` | boolean | NULL | — | `[inferred]` source-contract.md:326 | normalized from 'Si'/'No' |
| `raw_oferta_seleccionada` | text | NULL | — | `[doc]` spec.md:178 | raw preserved |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo_externo, codigoitem, codigo_proveedor, nombre_de_la_oferta)` (`design.md:119`) — subject to validation against real duplicate cases
- FK: `(codigo_externo, codigoitem)` → `mp.licitacion_item(codigo_externo, codigoitem)` ON DELETE CASCADE

### mp.licitacion_adjudicacion

Source: `design.md:120`, `source-contract.md:446-461`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_externo` | text | NOT NULL | — | `[doc]` design.md:120 | |
| `codigoitem` | text | NULL | — | `[doc]` design.md:120 | nullable if process-level award only |
| `rut_proveedor` | text | NOT NULL | — | `[doc]` design.md:120 | |
| `cantidad_adjudicada` | text | NULL | — | `[inferred]` source-contract.md:418 | raw |
| `monto_adjudicado` | numeric(18,2) | NULL | — | `[inferred]` | normalized |
| `raw_monto_adjudicado` | text | NULL | — | `[doc]` design.md:204 | raw preserved |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo_externo, codigoitem, rut_proveedor)` (`design.md:120`) — item segment nullable only if source proves process-level award
- No FK currently declared to `mp.licitacion_item`; see `Known Deviations` for the current slice rationale.

### mp.orden_compra

Source: `design.md:121`, `source-contract.md:92-131,446-461`, `spec.md:82-92`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo` | text | NOT NULL | — | `[doc]` source-contract.md:112 | UK |
| `codigo_licitacion` | text | NULL | — | `[doc]` source-contract.md:116 | optional, nullable |
| `canonical_state` | text | NOT NULL | 'unknown_raw_state' | `[doc]` source-contract.md:122-131 | snake_case |
| `raw_state_code` | text | NULL | — | `[doc]` source-contract.md:122 | |
| `raw_state_label` | text | NULL | — | `[doc]` source-contract.md:122 | |
| `raw_provider_state` | text | NULL | — | `[doc]` spec.md:85 | |
| `fecha_envio` | date | NULL | — | `[inferred]` source-contract.md:394 | normalized |
| `is_sentinel_1900_envio` | boolean | NOT NULL | false | `[doc]` source-contract.md:328-333 | |
| `tipo_moneda_oc` | text | NULL | — | `[inferred]` source-contract.md:397 | |
| `monto_total_oc` | numeric(18,2) | NULL | — | `[inferred]` source-contract.md:398 | normalized |
| `raw_monto_total_oc` | text | NULL | — | `[doc]` design.md:204 | raw preserved |
| `impuestos_oc` | numeric(18,2) | NULL | — | `[inferred]` source-contract.md:399 | |
| `nombre_proveedor` | text | NULL | — | `[inferred]` source-contract.md:402 | |
| `codigo_abreviado_tipo_oc` | text | NULL | — | `[doc]` source-contract.md:282 | e.g. 'AG' |
| `descripcion_tipo_oc` | text | NULL | — | `[doc]` source-contract.md:396 | |
| `es_compra_agil` | boolean | NULL | — | `[inferred]` source-contract.md:280 | normalized from 'Si'/'No' |
| `raw_es_compra_agil` | text | NULL | — | `[doc]` source-contract.md:280 | raw preserved |
| `source_priority` | text | NULL | — | `[inferred]` | 'api'/'csv' |
| `last_seen_at` | timestamptz | NOT NULL | now() | `[inferred]` | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `codigo` (`design.md:121`)
- CHECK: `canonical_state IN ('enviada_a_proveedor','en_proceso','aceptada','cancelada','recepcion_conforme','pendiente_de_recepcionar','recepcionada_parcialmente','recepcion_conforme_incompleta','unknown_raw_state')`

### mp.orden_compra_item

Source: `design.md:122`, `source-contract.md:260-287`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `iditem` | text | NOT NULL | — | `[doc]` design.md:122 | UK |
| `codigo` | text | NOT NULL | — | `[doc]` source-contract.md:270 | FK to orden_compra |
| `nombre_producto_generico` | text | NULL | — | `[doc]` source-contract.md:286 | misspelled raw name preserved in staging |
| `total_linea_neto` | numeric(18,2) | NULL | — | `[inferred]` source-contract.md:404 | normalized |
| `raw_total_linea_neto` | text | NULL | — | `[doc]` design.md:204 | raw preserved |
| `codigo_producto_onu` | text | NULL | — | `[doc]` source-contract.md:403 | |
| `forma_de_pago` | text | NULL | — | `[doc]` source-contract.md:287 | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `iditem` (`design.md:122`)
- FK: `codigo` → `mp.orden_compra(codigo)` ON DELETE CASCADE

### mp.compra_agil

Source: `design.md:123`, `source-contract.md:133-195`, `spec.md:94-122`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo` | text | NOT NULL | — | `[doc]` source-contract.md:165 | UK |
| `estado` | text | NULL | — | `[doc]` source-contract.md:180-186 | 'publicada','cerrada', etc. |
| `id_orden_compra` | text | NULL | — | `[doc]` source-contract.md:190 | OC linkage |
| `id_oc` | text | NULL | — | `[doc]` source-contract.md:191 | OC linkage fallback |
| `codigo_orden_compra` | text | NULL | — | `[doc]` source-contract.md:192 | NOT used for linkage |
| `region` | integer | NULL | — | `[doc]` source-contract.md:164 | |
| `last_seen_at` | timestamptz | NOT NULL | now() | `[inferred]` | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `codigo` (`design.md:123`)
- CHECK: `estado IN ('publicada','cerrada','desierta','cancelada','proveedor_seleccionado','oc_emitida')`
- All fields optional unless fixtures prove always present (`source-contract.md:195`)

### mp.compra_agil_producto_solicitado

Source: `design.md:124`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo` | text | NOT NULL | — | `[doc]` design.md:124 | FK to compra_agil |
| `codigo_producto` | text | NOT NULL | — | `[doc]` design.md:124 | |
| `ordinal` | integer | NOT NULL | — | `[doc]` design.md:124 | disambiguates same product |
| `nombre_producto` | text | NULL | — | `[inferred]` | |
| `cantidad_solicitada` | text | NULL | — | `[inferred]` | raw |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo, codigo_producto, ordinal)` (`design.md:124`)
- FK: `codigo` → `mp.compra_agil(codigo)` ON DELETE CASCADE

### mp.compra_agil_cotizacion

Source: `design.md:125`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo` | text | NOT NULL | — | `[doc]` design.md:125 | FK to compra_agil |
| `rut_proveedor` | text | NOT NULL | — | `[doc]` design.md:125 | |
| `id_cotizacion` | text | NOT NULL | — | `[doc]` design.md:125 | |
| `monto_cotizado` | numeric(18,2) | NULL | — | `[inferred]` | normalized |
| `raw_monto_cotizado` | text | NULL | — | `[doc]` design.md:204 | raw preserved |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo, rut_proveedor, id_cotizacion)` (`design.md:125`)
- FK: `codigo` → `mp.compra_agil(codigo)` ON DELETE CASCADE

### mp.public_buyer

Source: `design.md:97,185`, `source-contract.md:62`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_organismo` | text | NOT NULL | — | `[doc]` design.md:185 | natural key |
| `rut` | text | NULL | — | `[doc]` design.md:185 | |
| `nombre` | text | NULL | — | `[inferred]` | buyer name |
| `source_attribution` | text | NULL | — | `[doc]` design.md:185 | explicit source |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `codigo_organismo`

### mp.public_supplier

Source: `design.md:98,186`, `source-contract.md:302`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `rut` | text | NULL | — | `[doc]` design.md:186 | RUT or source-specific code |
| `codigo_proveedor` | text | NULL | — | `[doc]` source-contract.md:302 | |
| `nombre` | text | NULL | — | `[inferred]` source-contract.md:402 | |
| `source_attribution` | text | NULL | — | `[doc]` design.md:186 | explicit source |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `rut` WHERE rut IS NOT NULL (partial unique — RUT may be null for some suppliers)

### mp.estado_dim

Source: `design.md:108`, `source-contract.md:76-84,120-131`.

Purpose: Versioned canonical dimension mapping state codes to labels for both licitacion and OC.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `entity_family` | text | NOT NULL | — | `[inferred]` | 'licitacion', 'orden_compra' |
| `raw_code` | text | NOT NULL | — | `[doc]` source-contract.md:76,122 | |
| `raw_label` | text | NOT NULL | — | `[doc]` source-contract.md:76,122 | |
| `canonical_state` | text | NOT NULL | — | `[doc]` source-contract.md:76-84 | snake_case |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(entity_family, raw_code)`
- CHECK: `entity_family IN ('licitacion', 'orden_compra')`

### mp.modalidad_dim

Source: `design.md:109`, `source-contract.md:275`.

Purpose: Versioned dimension for OC modality normalization (considers `CodigoTipo`, `CodigoAbreviadoTipoOC`, `DescripcionTipoOC` together).

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_tipo` | text | NULL | — | `[doc]` source-contract.md:275 | |
| `codigo_abreviado` | text | NULL | — | `[doc]` source-contract.md:275 | e.g. 'AG' |
| `descripcion` | text | NULL | — | `[doc]` source-contract.md:275 | |
| `canonical_modalidad` | text | NOT NULL | — | `[inferred]` | e.g. 'compra_agil', 'trato_directo', 'licitacion_publica' |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(codigo_tipo, codigo_abreviado)` WHERE codigo_tipo IS NOT NULL

---

## Reconciliation Layer

### mp.reconciliation_public_market_entities

Source: `design.md:139-142`, `source-contract.md:446-488`, `ingestion-context.md:170-183`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `entity_a_source` | text | NOT NULL | — | `[doc]` design.md:141 | 'api-v1','csv-datos-abiertos','api-v2' |
| `entity_a_type` | text | NOT NULL | — | `[doc]` design.md:141 | 'licitacion','orden_compra','compra_agil' |
| `entity_a_key` | text | NOT NULL | — | `[doc]` design.md:141 | natural key value |
| `entity_b_source` | text | NOT NULL | — | `[doc]` design.md:141 | |
| `entity_b_type` | text | NOT NULL | — | `[doc]` design.md:141 | |
| `entity_b_key` | text | NOT NULL | — | `[doc]` design.md:141 | |
| `match_type` | text | NOT NULL | — | `[doc]` design.md:141 | see CHECK below |
| `match_confidence` | text | NOT NULL | — | `[doc]` design.md:142 | 'high','medium','low','unknown' |
| `matched_by` | text | NULL | — | `[doc]` design.md:142 | rule or job that created match |
| `matched_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:142 | |
| `review_status` | text | NOT NULL | 'pending' | `[doc]` design.md:142 | 'pending','confirmed','rejected' |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(entity_a_source, entity_a_type, entity_a_key, entity_b_source, entity_b_type, entity_b_key, match_type)` (`design.md:141`)
- CHECK: `match_type IN ('exact_codigo_externo','exact_codigo_licitacion','exact_compra_agil_id_orden_compra','csv_api_same_business_key','candidate_supplier_amount','candidate_item_amount','unmatched','manual_review_required')` (`source-contract.md:472-481`)
- CHECK: `match_confidence IN ('high','medium','low','unknown')` (`source-contract.md:483-488`)
- CHECK: `review_status IN ('pending','confirmed','rejected')`

### mp.reconciliation_event

Source: `design.md:143-146`, `ingestion-context.md:170-183`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `event_fingerprint` | text | NOT NULL | — | `[doc]` design.md:145 | logical mismatch fingerprint, UK |
| `event_type` | text | NOT NULL | — | `[doc]` design.md:146 | 'state_mismatch','source_period_rerun_mismatch', etc. |
| `entity_type` | text | NOT NULL | — | `[doc]` design.md:146 | 'licitacion','orden_compra','compra_agil' |
| `entity_key` | text | NOT NULL | — | `[doc]` design.md:146 | natural key |
| `source_a` | text | NULL | — | `[doc]` design.md:146 | |
| `source_b` | text | NULL | — | `[doc]` design.md:146 | |
| `details` | jsonb | NULL | — | `[doc]` design.md:146 | mismatch details |
| `created_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:146 | |

Constraints:
- PK: `id`
- UK: `event_fingerprint` (`design.md:145`) — idempotent dedupe per `design.md:260`, `spec.md:298-302`

---

## Gold Layer

> Gold tables back internal read contracts (`design.md:470-551`). Column shapes follow the read contract shapes. These are physical tables (not materialized views) per `design.md:148-154`.

### mp.gold_detected_process

Source: `design.md:150,483-508`, `spec.md:435-439`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `process_type` | text | NOT NULL | — | `[doc]` design.md:496 | 'licitacion','orden_compra','compra_agil' |
| `process_code` | text | NOT NULL | — | `[doc]` design.md:497 | natural key |
| `title` | text | NULL | — | `[doc]` design.md:498 | |
| `canonical_state` | text | NULL | — | `[doc]` design.md:499 | |
| `raw_state_code` | text | NULL | — | `[doc]` design.md:500 | |
| `raw_state_label` | text | NULL | — | `[doc]` design.md:501 | |
| `buyer_code` | text | NULL | — | `[doc]` design.md:502 | |
| `buyer_name` | text | NULL | — | `[doc]` design.md:503 | |
| `published_at` | timestamptz | NULL | — | `[doc]` design.md:504 | |
| `closing_at` | timestamptz | NULL | — | `[doc]` design.md:505 | |
| `source_priority` | text | NULL | — | `[doc]` design.md:506 | |
| `reconciliation_status` | text | NULL | — | `[doc]` design.md:507 | |
| `last_seen_at` | timestamptz | NOT NULL | now() | `[doc]` design.md:508 | |
| `created_at` | timestamptz | NOT NULL | now() | `[new]` | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(process_type, process_code)`

### mp.gold_pipeline_health

Source: `design.md:151,521-528`, `spec.md:447-450`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `job_name` | text | NOT NULL | — | `[inferred]` design.md:524 | |
| `latest_status` | text | NULL | — | `[inferred]` design.md:524 | latest run status |
| `last_success_at` | timestamptz | NULL | — | `[inferred]` design.md:526 | |
| `last_failure_at` | timestamptz | NULL | — | `[inferred]` | |
| `lag_since_last_success_ms` | bigint | NULL | — | `[inferred]` design.md:525 | |
| `failure_count` | integer | NOT NULL | 0 | `[inferred]` design.md:527 | |
| `freshness` | text | NULL | — | `[inferred]` design.md:316-319 | 'healthy','degraded','stale' |
| `expected_cadence_ms` | bigint | NULL | — | `[inferred]` design.md:297-306 | 1h=3600000, 24h=86400000 |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `job_name`
- CHECK: `freshness IN ('healthy','degraded','stale')`

### mp.gold_api_quota_usage

Source: `design.md:152,529-537`, `spec.md:341-346`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `source` | text | NOT NULL | — | `[doc]` design.md:532 | 'api-v1','api-v2' |
| `daily_limit` | integer | NULL | — | `[doc]` design.md:533 | |
| `used` | integer | NOT NULL | 0 | `[doc]` design.md:534 | |
| `remaining` | integer | NULL | — | `[doc]` design.md:535 | |
| `reset_at` | timestamptz | NULL | — | `[doc]` design.md:536 | next midnight America/Santiago |
| `last_429_at` | timestamptz | NULL | — | `[doc]` design.md:537 | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `source`

### mp.gold_csv_file_health

Source: `design.md:153,539-551`, `spec.md:447-450`.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `source_dataset` | text | NOT NULL | — | `[doc]` design.md:542 | |
| `source_period` | text | NOT NULL | — | `[doc]` design.md:543 | |
| `source_file_name` | text | NOT NULL | — | `[doc]` design.md:544 | |
| `file_checksum` | text | NOT NULL | — | `[doc]` design.md:545 | |
| `detected_encoding` | text | NULL | — | `[doc]` design.md:546 | |
| `detected_delimiter` | text | NULL | — | `[doc]` design.md:547 | |
| `schema_fingerprint` | text | NULL | — | `[doc]` design.md:548 | |
| `row_count` | integer | NULL | — | `[doc]` design.md:549 | |
| `parse_status` | text | NULL | — | `[doc]` design.md:550 | |
| `last_loaded_at` | timestamptz | NULL | — | `[doc]` design.md:551 | |
| `freshness` | text | NULL | — | `[inferred]` design.md:316-319 | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- UK: `(source_dataset, source_period, file_checksum)`

### mp.gold_conciliacion_licitacion_oc

Source: `design.md:154`, `ingestion-context.md:92-126`.

Purpose: Gold view of licitacion-to-OC reconciliation for downstream consumers.

| Column | Type | Nullable | Default | Provenance | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | uuid | NOT NULL | gen_random_uuid() | `[new]` | PK |
| `codigo_externo` | text | NOT NULL | — | `[doc]` source-contract.md:460 | licitacion key |
| `codigo_licitacion_oc` | text | NULL | — | `[doc]` source-contract.md:460 | OC's CodigoLicitacion |
| `codigo_oc` | text | NULL | — | `[inferred]` | OC's Codigo |
| `match_type` | text | NOT NULL | — | `[doc]` source-contract.md:472-481 | |
| `match_confidence` | text | NOT NULL | — | `[doc]` source-contract.md:483-488 | |
| `review_status` | text | NOT NULL | 'pending' | `[doc]` design.md:142 | |
| `updated_at` | timestamptz | NOT NULL | now() | `[new]` | |

Constraints:
- PK: `id`
- CHECK: `match_type IN ('exact_codigo_externo','exact_codigo_licitacion','exact_compra_agil_id_orden_compra','csv_api_same_business_key','candidate_supplier_amount','candidate_item_amount','unmatched','manual_review_required')`

---

## Source→Column Mapping Index

Cross-reference from source API fields and CSV columns to canonical/staging columns.

### API V1 Licitaciones → Canonical

| API field | Target table.column | Source doc |
| --- | --- | --- |
| `CodigoExterno` | `licitacion.codigo_externo`, `stg_api_v1_licitacion.codigo_externo` | source-contract.md:72 |
| `Codigo` | `licitacion.codigo`, `stg_api_v1_licitacion.codigo` | source-contract.md:300 |
| `CodigoEstado` | `licitacion.raw_state_code`, `stg_api_v1_licitacion.codigo_estado` | source-contract.md:76 |
| `Estado` | `licitacion.raw_state_label`, `stg_api_v1_licitacion.estado` | source-contract.md:76 |
| `CodigoTipo` | `licitacion.codigo_tipo`, `stg_api_v1_licitacion.codigo_tipo` | source-contract.md:87 |
| `FechaPublicacion` | `licitacion.fecha_publicacion` (normalized), `stg_api_v1_licitacion.fecha_publicacion` (raw text) | source-contract.md:411 |
| `FechaCierre` | `licitacion.fecha_cierre` (normalized), `stg_api_v1_licitacion.fecha_cierre` (raw text) | ingestion-context.md:182 |
| `FechaAdjudicacion` | `licitacion.fecha_adjudicacion`, `stg_api_v1_licitacion.fecha_adjudicacion` | source-contract.md:412 |
| `CodigoOrganismo` | `licitacion.buyer_code`, `stg_api_v1_licitacion.codigo_organismo` | source-contract.md:62 |
| `NombreOrganismo` | `licitacion.buyer_name`, `stg_api_v1_licitacion.nombre_organismo` | inferred |

### API V1 OC → Canonical

| API field | Target table.column | Source doc |
| --- | --- | --- |
| `Codigo` | `orden_compra.codigo`, `stg_api_v1_orden_compra.codigo` | source-contract.md:112 |
| `CodigoEstado` | `orden_compra.raw_state_code`, `stg_api_v1_orden_compra.codigo_estado` | source-contract.md:122 |
| `Estado` | `orden_compra.raw_state_label`, `stg_api_v1_orden_compra.estado` | source-contract.md:122 |
| `EstadoProveedor` | `orden_compra.raw_provider_state`, `stg_api_v1_orden_compra.estado_proveedor` | spec.md:85 |
| `CodigoLicitacion` | `orden_compra.codigo_licitacion`, `stg_api_v1_orden_compra.codigo_licitacion` | source-contract.md:116 |
| `FechaEnvio` | `orden_compra.fecha_envio` (normalized), `stg_api_v1_orden_compra.fecha_envio` (raw) | source-contract.md:394 |
| `TipoMonedaOC` | `orden_compra.tipo_moneda_oc` | source-contract.md:397 |
| `MontoTotalOC` | `orden_compra.monto_total_oc` (numeric), `orden_compra.raw_monto_total_oc` (raw) | source-contract.md:398 |
| `ImpuestosOC` | `orden_compra.impuestos_oc` | source-contract.md:399 |
| `NombreProveedor` | `orden_compra.nombre_proveedor` | source-contract.md:402 |

### API V2 Compra Agil → Canonical

| API field | Target table.column | Source doc |
| --- | --- | --- |
| `codigo` | `compra_agil.codigo`, `stg_api_v2_compra_agil.codigo` | source-contract.md:165 |
| `estado` | `compra_agil.estado`, `stg_api_v2_compra_agil.estado` | source-contract.md:180-186 |
| `orden_compra.id_orden_compra` | `compra_agil.id_orden_compra`, `stg_api_v2_compra_agil.id_orden_compra` | source-contract.md:190 |
| `orden_compra.id_oc` | `compra_agil.id_oc`, `stg_api_v2_compra_agil.id_oc` | source-contract.md:191 |
| `orden_compra.codigo_orden_compra` | `compra_agil.codigo_orden_compra` (stored but NOT used for linkage) | source-contract.md:192 |
| `region` | `compra_agil.region` | source-contract.md:164 |

### CSV OC → Staging → Canonical

| CSV column | Staging column | Canonical column | Source doc |
| --- | --- | --- | --- |
| `Codigo` | `stg_csv_orden_compra.codigo` | `orden_compra.codigo` | source-contract.md:270 |
| `ID` | `stg_csv_orden_compra.source_id` | — (internal, not canonical key) | source-contract.md:271 |
| `IDItem` | `stg_csv_orden_compra.iditem` | `orden_compra_item.iditem` | source-contract.md:272 |
| `CodigoLicitacion` | `stg_csv_orden_compra.codigo_licitacion` | `orden_compra.codigo_licitacion` | source-contract.md:273 |
| `FechaEnvio` | `stg_csv_orden_compra.fecha_envio` | `orden_compra.fecha_envio` (normalized) | source-contract.md:394 |
| `Estado` | `stg_csv_orden_compra.estado` | `orden_compra.raw_state_label` | source-contract.md:395 |
| `MontoTotalOC_PesosChilenos` | `stg_csv_orden_compra.monto_total_oc_pesos_chilenos` | `orden_compra.monto_total_oc`, `orden_compra.raw_monto_total_oc` | source-contract.md:283 |
| `EsCompraAgil` | `stg_csv_orden_compra.es_compra_agil` | `orden_compra.es_compra_agil`, `orden_compra.raw_es_compra_agil` | source-contract.md:280 |
| `CodigoAbreviadoTipoOC` | `stg_csv_orden_compra.codigo_abreviado_tipo_oc` | `orden_compra.codigo_abreviado_tipo_oc` | source-contract.md:282 |
| `NombreProveedor` | `stg_csv_orden_compra.nombre_proveedor` | `orden_compra.nombre_proveedor` | source-contract.md:402 |
| Unknown columns | `stg_csv_orden_compra.all_observed_fields` (jsonb) | NOT mapped to canonical | source-contract.md:200 |

### CSV Licitaciones → Staging → Canonical

| CSV column | Staging column | Canonical column | Source doc |
| --- | --- | --- | --- |
| `CodigoExterno` | `stg_csv_licitacion.codigo_externo` | `licitacion.codigo_externo` | source-contract.md:299 |
| `Codigo` | `stg_csv_licitacion.codigo` | `licitacion.codigo` | source-contract.md:300 |
| `Codigoitem` | `stg_csv_licitacion.codigoitem` | `licitacion_item.codigoitem` | source-contract.md:301 |
| `CodigoProveedor` | `stg_csv_licitacion.codigo_proveedor` | `licitacion_oferta.codigo_proveedor` | source-contract.md:302 |
| `RutProveedor` | `stg_csv_licitacion.rut_proveedor` | `licitacion_oferta.rut_proveedor` | source-contract.md:302 |
| `Nombre de la Oferta` | `stg_csv_licitacion.nombre_de_la_oferta` | `licitacion_oferta.nombre_de_la_oferta` | source-contract.md:321 |
| `Estado Oferta` | `stg_csv_licitacion.estado_oferta` | `licitacion_oferta.estado_oferta` | source-contract.md:322 |
| `Oferta seleccionada` | `stg_csv_licitacion.oferta_seleccionada` | `licitacion_oferta.is_oferta_seleccionada`, `licitacion_oferta.raw_oferta_seleccionada` | source-contract.md:326, spec.md:178 |
| `Cantidad Ofertada` | `stg_csv_licitacion.cantidad_ofertada` | `licitacion_oferta.cantidad_ofertada` | source-contract.md:323 |
| `Valor Total Ofertado` | `stg_csv_licitacion.valor_total_ofertado` | `licitacion_oferta.valor_total_ofertado`, `licitacion_oferta.raw_valor_total_ofertado` | source-contract.md:325 |
| `Monto Estimado Adjudicado` | `stg_csv_licitacion.monto_estimado_adjudicado` | `licitacion_item.monto_estimado`, `licitacion_item.raw_monto_estimado` | source-contract.md:320 |
| `Tipo de Adquisicion` | `stg_csv_licitacion.tipo_de_adquisicion` | — (contextual) | source-contract.md:308 |
| `FechaPublicacion` | `stg_csv_licitacion.fecha_publicacion` | `licitacion.fecha_publicacion` (normalized) | source-contract.md:411 |
| `FechaAdjudicacion` | `stg_csv_licitacion.fecha_adjudicacion` | `licitacion.fecha_adjudicacion` (normalized) | source-contract.md:412 |
| `Estado` | `stg_csv_licitacion.estado` | `licitacion.raw_state_label` | source-contract.md:413 |
| `NombreUnidad` | `stg_csv_licitacion.nombre_unidad` | — (buyer context) | source-contract.md:414 |
| `Nombre producto generico` | `stg_csv_licitacion.nombre_producto_generico` | `licitacion_item.nombre_producto_generico` | source-contract.md:415 |
| `CantidadAdjudicada` | `stg_csv_licitacion.cantidad_adjudicada` | `licitacion_adjudicacion.cantidad_adjudicada` | source-contract.md:418 |
| Unknown columns | `stg_csv_licitacion.all_observed_fields` (jsonb) | NOT mapped to canonical | source-contract.md:200 |

---

## Non-Null-Over-Null Protection

Applies to ALL nullable columns in canonical tables (`design.md:195`, `spec.md:192-195`).

Canonical refresh MUST NOT overwrite a non-null canonical value with NULL. Applied per-field, not per-row.

Implementation pattern for each canonical column during refresh:

```sql
UPDATE mp.licitacion
SET title = $new_title
WHERE codigo_externo = $key
  AND ($new_title IS NOT NULL OR title IS NULL)
```

This means:
- non-null new value → always overwrites (whether canonical was null or non-null)
- null new value → only overwrites if canonical was already null (no-op effectively)

Special protection for:
- `canonical_state` — never overwrite non-null with null (`spec.md:192-195`)
- `raw_state_code`, `raw_state_label` — preserved alongside canonical (`design.md:196`)
- All normalized date fields — sentinel `1900-01-01` sets `is_sentinel_1900_*` flag + null value, but does NOT overwrite a real date with null unless the canonical was already null

---

## Idempotency Summary

Per `design.md:388-394`, `spec.md:277-302`:

| Layer | Dedupe key | UK constraint |
| --- | --- | --- |
| raw_api_payload | `(source, endpoint, request_fingerprint, payload_checksum)` | UK |
| raw_csv_file | `(source_dataset, source_period, source_modality, file_checksum)` | UK with NULL modality equal |
| raw_csv_row | `(raw_csv_file_id, row_number, row_checksum)` | UK |
| canonical licitacion | `codigo_externo` | UK |
| canonical orden_compra | `codigo` | UK |
| canonical compra_agil | `codigo` | UK |
| canonical licitacion_item | `(codigo_externo, codigoitem)` | UK |
| canonical orden_compra_item | `iditem` | UK |
| reconciliation entities | `(entity_a_*, entity_b_*, match_type)` | UK |
| reconciliation event | `event_fingerprint` | UK |

---

## Catalog Maintenance

This catalog is the binding schema for Phase 2. During implementation:
1. If a column needs to be added, update this catalog first, then write the instance command.
2. If a column type needs to change, update this catalog first, then write a new instance command (never edit committed commands).
3. If a source field is discovered that is not mapped here, add it with `[inferred]` or `[new]` provenance and update the Source→Column mapping index.
4. Phase 5 closeout will promote this catalog to `docs/architecture/` if the implementation confirms the schema.

### Known Deviations

- `raw_api_payload.ingestion_job_id` and `raw_csv_row.ingestion_job_id` are cataloged with FKs to `mp.stg_job_run(id)`, but those constraints land in task 2.6 when `stg_job_run` is created. The implementation uses that later slice to avoid circular dependency during task ordering.
- File-to-job-run lineage uses `stg_job_run.raw_csv_file_id`; `raw_csv_file` has no `ingestion_job_id` column.
- `licitacion.buyer_code` FK to `mp.public_buyer(codigo_organismo)` is deferred until the `public_buyer` table has an implementation slice. Task 2.9 creates the canonical licitacion tables without that FK to preserve task order and avoid inventing out-of-scope tables.
- `mp.public_supplier` is cataloged as a target-state canonical reference table, but no implementation slice creates it in tasks 2.4-2.14. Current canonical objects preserve supplier raw fields without introducing that table mid-slice.
- `mp.estado_dim` is cataloged as a target-state normalization dimension, but no implementation slice creates or seeds it in tasks 2.4-2.14. Current canonical objects therefore retain raw state fields without a physical dimension table yet.
- `mp.modalidad_dim` is cataloged as a target-state normalization dimension, but no implementation slice creates or seeds it in tasks 2.4-2.14. Current canonical objects therefore retain raw modality fields without a physical dimension table yet.
- `mp.licitacion_adjudicacion` currently has no FK to `mp.licitacion_item(codigo_externo, codigoitem)`. The current slice preserves the documented natural key while `codigoitem` remains nullable for process-level awards; item-link enforcement needs a follow-up design decision rather than an implicit FK added mid-slice.
- Module implemented at `src/engine/core-modules/mercado-publico/`, registered in `core-engine.module.ts` and `jobs.module.ts`. This is the canonical implementation location for the phase-1 backbone.
