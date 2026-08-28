---
type: business-context
title: "Mercado Publico Source Contract"
description: "Business context for Mercado Publico Source Contract."
okf_version: "0.1"
---
# Mercado Publico Source Contract

## Purpose

Define the source-level ingestion contract for Mercado Publico / ChileCompra data so API and CSV implementation work can proceed without inventing fields, relationships, or operational behavior.

## Primary Audience

Backend engineers, data engineers, reviewers, product owners, and AI agents implementing Mercado Publico ingestion.

## Executive Summary

Mercado Publico ingestion uses three source families:

- API V1 Mercado Publico for operational licitaciones and ordenes de compra.
- API V2 Compra Agil for Compra Agil processes only.
- Datos Abiertos CSV downloads for historical licitaciones and ordenes de compra.

The pipeline is raw-first, idempotent, auditable, tolerant to schema drift, separated by source, and reconciled explicitly. Raw source data is never overwritten destructively.

## Retirement Status (2026-08-16)

The API V1 and Datos Abiertos CSV ingestion runtimes were retired by the
`mercado-publico-v2-legacy-retirement` change (G5) after the G4 cutover gate
closed. The V1/CSV sections below remain as historical source-domain evidence;
API V2 Compra Agil is the active ingestion source. Removed scope, retained
rollback/recovery procedure, and evidence locations are recorded in
`openspec/changes/mercado-publico-v2-legacy-retirement/retirement-evidence.md`.

## Source Boundary

In scope:

- API V1 Licitaciones.
- API V1 Ordenes de Compra.
- API V2 Compra Agil.
- Datos Abiertos CSV for licitaciones.
- Datos Abiertos CSV for ordenes de compra.

Out of scope:

- Scraping not documented by source behavior.
- Other Datos Abiertos datasets.
- Treating Compra Agil V2 as a general replacement for API V1.
- Treating API and CSV as equivalent replicas.

## API V1 Mercado Publico

API V1 is the operational source for recent discovery, status monitoring, and detail refresh.

Common rules:

- Requests use HTTP GET.
- JSON is the preferred pipeline format.
- Date parameters use `ddmmaaaa`.
- List endpoints are snapshots and may contain basic data.
- Code lookup endpoints are detail rehydrate paths and do not depend on date.
- Raw payloads, request params, status metadata, and checksums are persisted before normalization.

### V1 Licitaciones

Supported query modes:

- by `CodigoExterno`.
- current day, all states.
- specific date, all states.
- active licitaciones.
- current day by state.
- specific date by state.
- by provider code.
- by public buyer code.

Minimum implementation surface for this backbone:

- `api-v1-licitaciones-by-date`.
- `api-v1-licitaciones-by-state`.
- `api-v1-licitacion-detail-by-codigo`.

Natural key:

- `CodigoExterno`.

Documented states:

| Code | State |
| ---: | --- |
| 5 | Publicada |
| 6 | Cerrada |
| 7 | Desierta |
| 8 | Adjudicada |
| 18 | Revocada |
| 19 | Suspendida |

Type handling:

- Preserve raw `CodigoTipo`.
- Do not validate licitacion type against a single closed list.
- Map known types through a versioned canonical dimension.
- Unknown raw types are accepted as `unknown_raw_type` for review.

### V1 Ordenes de Compra

Supported query modes:

- by `Codigo`.
- current day, all states.
- specific date, all states.
- current day by state.
- specific date by state.
- by public buyer code.
- by provider code.

Minimum implementation surface for this backbone:

- `api-v1-oc-by-date`.
- `api-v1-oc-by-state`.
- `api-v1-oc-detail-by-codigo`.

Natural key:

- `Codigo`.

Optional licitacion relationship:

- `CodigoLicitacion = Licitacion.CodigoExterno`.

This relationship is optional. Do not assume every OC comes from a licitacion.

Documented states:

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

## API V2 Compra Agil

Compra Agil V2 is a specialized API for Compra Agil processes. It is not a V2 general API for licitaciones and ordenes de compra.

Base URL:

```text
https://api2.mercadopublico.cl
```

Authentication:

- Header: `ticket`.
- Tickets must come from environment or managed configuration.
- Tickets must not be hardcoded, logged, stored in fixtures, or serialized in raw error payloads.

Endpoints:

- `GET /v2/compra-agil`.
- `GET /v2/compra-agil/{codigo}`.

### List Parameters

| Parameter | Type | Rule |
| --- | --- | --- |
| `ttl_cambio_ms` | integer | Relative modification window. |
| `cambio_desde` | ISO-8601 datetime | Modification range start. |
| `cambio_hasta` | ISO-8601 datetime | Modification range end. |
| `publicado_desde` | ISO-8601 datetime | Publication range start. |
| `publicado_hasta` | ISO-8601 datetime | Publication range end. |
| `estado` | string | One or more states separated by comma. |
| `region` | integer | Region code. |
| `id` | string | Exact Compra Agil code. |
| `q` | string | Text search. |
| `tamano_pagina` | integer | Default 15, maximum 50. |
| `numero_pagina` | integer | Starts at 1. |
| `ordenar_por` | string | Sort field. |

Parameter rules:

- `id` and `q` are mutually exclusive.
- `tamano_pagina` must not exceed 50.
- `numero_pagina` starts at 1.
- When a change or publication range is supplied, both bounds are required.
- `orden` is not part of the supported V2 request contract and is rejected.
- There is no documented `codigo_organismo` filter for this API.

Documented states:

- `publicada`.
- `cerrada`.
- `desierta`.
- `cancelada`.
- `proveedor_seleccionado`.
- `oc_emitida`.

OC linkage rule:

- If `orden_compra.id_orden_compra` is not null, there is an emitted OC.
- Use `id_orden_compra` or `id_oc` for reconciliation to OC.
- Do not depend on `codigo_orden_compra`; it may be null.
- Do not depend only on state `oc_emitida`.

All Compra Agil fields are modeled as optional unless fixtures prove they are always present.

## CSV Datos Abiertos

CSV is the historical and batch source for licitaciones and ordenes de compra.

Confirmed source behavior:

- Datos Abiertos offers CSV mass downloads.
- Ordenes de compra are separated by semester and modality.
- Licitaciones are separated by month.
- Files may be compressed as `.7z`.
- Storage may be backed by S3.
- The UI describes downloadable reports as monthly CSV files with variable columns.

Implementation rules:

- Do not assume fixed columns before reading the file header.
- Do not assume delimiter before detection.
- Do not assume encoding before detection.
- Do not infer official types from UI-visible column lists.
- Do not drop unknown columns.
- Do not enforce uniqueness on `CodigoExterno` in raw licitaciones CSV rows.
- Preserve every row as raw text plus parsed raw JSON when parsing succeeds.

Delimiter candidates:

- `;`
- `,`
- tab
- `|`

Encoding detection:

- Try UTF-8 and UTF-8-SIG first, but do not assume they will be correct.
- Support latin-1 fallback because real June 2026 CSV files require it for accented text.
- Record detected encoding.
- Record fallback usage when a fallback is needed.

### Observed CSV Contract: June 2026 Files

The following observations come from real June 2026 Datos Abiertos CSV files:

- `2026-6.csv`: ordenes de compra.
- `lic_2026-6(1).csv`: licitaciones.

These observations are implementation evidence for fixtures and defensive parsing. They are not a universal guarantee for every month.

Observed common format:

- Encoding for correct text: `latin-1`.
- Delimiter: `;`.
- Quote character: `"`.
- Null-like raw values include `NA`, empty fields, and whitespace-only fields.
- Decimal values can use comma decimal notation, for example `20700794,94` and `0,1`.
- Dates are primarily `YYYY-MM-DD`.
- `1900-01-01` appears as a sentinel date and must not be treated as a normal business date without an explicit sentinel flag.

Raw rules:

- Bronze/raw keeps original column names exactly as observed.
- Bronze/raw keeps original raw values exactly as observed.
- Bronze/raw does not correct spelling, rename columns, convert dates, convert decimals, normalize booleans, or collapse `NA` to null.
- Canonical/Silver-equivalent projections may normalize values only with explicit field-level rules and raw value retention.

Observed OC CSV shape:

- Observed file: `2026-6.csv`.
- Observed SHA256: `24f17df415bb8c2942474febcec90651866abc31a7f754ead65c7ca1afb3ef11`.
- Observed file size: `386490630` bytes.
- Observed columns: `78`.
- Observed rows: `231046`.
- Observed duplicate header columns: none.
- Business grain is not one row per OC.
- Observed grain is approximately one row per OC item.
- `Codigo` is the candidate OC header key and may repeat.
- `ID` is an observed internal OC header identifier and may repeat with `Codigo`.
- `IDItem` is the candidate OC item key.
- `CodigoLicitacion` is nullable and must not be required.
- Compra Agil OC rows can be identified defensively with `EsCompraAgil = Si` and/or `CodigoAbreviadoTipoOC = AG`.
- OC modality normalization should consider `CodigoTipo`, `CodigoAbreviadoTipoOC`, and `DescripcionTipoOC` together.

Observed OC CSV columns that must be preserved exactly when present include:

- `Descripcion/Obervaciones`.
- `EsCompraAgil`.
- `EsTratoDirecto`.
- `CodigoAbreviadoTipoOC`.
- `MontoTotalOC_PesosChilenos`.
- `Codigo_ConvenioMarco`.
- `IDItem`.
- `NombreroductoGenerico`.
- `Forma de Pago`.

Observed licitaciones CSV shape:

- Observed file: `lic_2026-6(1).csv`.
- Observed SHA256: `61307c4943b3a64662e2e86fdebfabd35a542a986f4ed2b64988b8fa060d8dc5`.
- Observed file size: `37771149` bytes.
- Observed columns: `110`.
- Observed rows: `20474`.
- Observed duplicate header columns: none.
- Business grain is not one row per licitacion.
- Observed grain is approximately `licitacion + item + proveedor/oferta`.
- `CodigoExterno` is the candidate licitacion key and may repeat.
- `Codigo` is an additional observed internal licitacion identifier and may repeat.
- `Codigoitem` is the candidate licitacion item key.
- Supplier candidates include `CodigoProveedor` and `RutProveedor`.
- The file is mainly historical/offer evidence and should not be treated as the primary active-opportunity source.

Observed licitaciones CSV columns that must be preserved exactly when present include:

- `DescripcionCriteriosRequisitosSociales.1`.
- `Tipo de Adquisicion`.
- `Moneda Adquisicion`.
- `FechaSoporteFisico`.
- `FechaEstimadaFirma`.
- `FechaVisitaTerreno`.
- `DireccionVisita`.
- `FechaEntregaAntecedentes`.
- `DireccionEntrega`.
- `PeriodoTiempoRenovacion`.
- `Nombre producto genrico`.
- `Nombre linea Adquisicion`.
- `Descripcion linea Adquisicion`.
- `Monto Estimado Adjudicado`.
- `Nombre de la Oferta`.
- `Estado Oferta`.
- `Cantidad Ofertada`.
- `Moneda de la Oferta`.
- `Valor Total Ofertado`.
- `Oferta seleccionada`.

Observed sentinel handling:

- Keep the raw date string.
- Create nullable parsed date fields only in canonical projections.
- Mark `is_sentinel_1900 = true` or equivalent when raw value is `1900-01-01`.
- Do not automatically correct columns such as `DireccionVisita` or `DireccionEntrega` even if the observed value looks like a sentinel date.

Observed decimal handling:

- Keep raw decimal strings in raw storage.
- Convert comma decimals only in validated numeric canonical fields.
- Record parse failures instead of dropping the row or the column.

Observed monthly partition caution:

- The OC file name `2026-6.csv` aligns with `FechaEnvio` in the observed sample, but other date columns can contain dates outside June 2026.
- Do not assume every date inside a monthly file belongs to the file month.
- Keep `source_period` as file/source metadata and parse business dates independently.

### CSV File Metadata

Every file load records:

- `source_system`.
- `source_dataset`.
- `source_url`.
- `source_file_name`.
- `source_period`.
- `source_modality`.
- `downloaded_at`.
- `file_checksum`.
- `file_size_bytes`.
- `compression_type`.
- `detected_encoding`.
- `detected_delimiter`.
- `quotechar`.
- `header_raw`.
- `observed_columns`.
- `column_count`.
- `schema_fingerprint`.
- `row_count`.

### CSV Row Metadata

Every row load records:

- `ingestion_job_id`.
- `source_dataset`.
- `source_file_name`.
- `source_period`.
- `row_number`.
- `raw_row_text`.
- `raw_row_json`.
- `row_checksum`.
- `parse_status`.
- `parse_error`.
- `created_at`.

### UI-Visible Reference Columns

The official UI shows important report columns. These are a partial reference, not a complete schema contract.

Ordenes de compra visible columns:

- `Codigo`.
- `FechaEnvio`.
- `Estado`.
- `DescripcionTipoOC`.
- `TipoMonedaOC`.
- `MontoTotalOC`.
- `ImpuestosOC`.
- `CodigoLicitacion`.
- `UnidadCompra`.
- `NombreProveedor`.
- `CodigoProductoONU`.
- `TotalLineaNeto`.

Licitaciones visible columns:

- `CodigoExterno`.
- `Tipo de Adquisicion`.
- `FuenteFinanciamiento`.
- `FechaPublicacion`.
- `FechaAdjudicacion`.
- `Estado`.
- `NombreUnidad`.
- `Nombre producto generico`.
- `NombreProveedor`.
- `Nombre de la Oferta`.
- `CantidadAdjudicada`.
- `Oferta seleccionada`.

CSV licitaciones may include offer process information. Defensive grain assumption:

- Raw rows may be `licitacion + producto + proveedor + oferta`.
- Raw rows may be `licitacion + oferta`.
- `CodigoExterno` may repeat in raw data.
- Deduplication happens in canonical entities, not raw rows.

CSV ordenes de compra include item-level information. Defensive grain assumption:

- Raw rows may be one OC item line.
- `Codigo` may repeat in raw data.
- `IDItem` is the observed candidate item key when present.
- Deduplication happens in canonical entities, not raw rows.

## Layer Mapping

Use repository layer names in implementation and OpenSpec. The source literature may use Bronze/Silver/Gold vocabulary; map it as follows:

| Source vocabulary | Repository vocabulary |
| --- | --- |
| Bronze | Raw |
| Silver | Canonical |
| Reconciliation | Reconciliation |
| Gold | Gold / read contracts |

## Reconciliation Contract

Natural keys:

| Entity | Key |
| --- | --- |
| API V1 Licitacion | `CodigoExterno` |
| API V1 Orden de Compra | `Codigo` |
| API V2 Compra Agil | `codigo` |
| CSV OC header | `Codigo` |
| CSV OC item | `IDItem` |
| CSV licitacion header | `CodigoExterno` |
| CSV licitacion item | `CodigoExterno + Codigoitem` |
| CSV licitacion oferta | `CodigoExterno + Codigoitem + CodigoProveedor + Nombre de la Oferta`, subject to validation |
| Licitacion to OC | `CodigoLicitacion = CodigoExterno` |
| Compra Agil to OC | `id_orden_compra` or `id_oc` |

Do not assume:

- One licitacion equals one OC.
- One OC equals one licitacion.
- Every OC comes from public licitacion.
- Every Compra Agil has an OC.
- Every adjudicated process has an immediately visible OC.
- API and CSV update at the same time.

Canonical `match_type` values:

- `exact_codigo_externo`.
- `exact_codigo_licitacion`.
- `exact_compra_agil_id_orden_compra`.
- `csv_api_same_business_key`.
- `candidate_supplier_amount`.
- `candidate_item_amount`.
- `unmatched`.
- `manual_review_required`.

Canonical `match_confidence` values:

- `high`.
- `medium`.
- `low`.
- `unknown`.

## Fixtures Required For Implementation

The implementation is not ready to validate without fixtures.

Required fixtures:

- API V1 licitacion list response.
- API V1 licitacion detail response.
- API V1 OC list response.
- API V1 OC detail response.
- API V2 Compra Agil list response.
- API V2 Compra Agil detail response with OC linkage present.
- API V2 Compra Agil detail response with OC linkage absent.
- CSV licitaciones sample or anonymized real header plus at least one row.
- CSV ordenes de compra sample or anonymized real header plus at least one row.
- CSV latin-1 sample with accented text.
- CSV semicolon delimiter sample.
- CSV quotechar sample using `"`.
- CSV comma-decimal numeric sample.
- CSV `NA`, blank, and whitespace-null sample.
- CSV `1900-01-01` sentinel date sample.
- CSV OC sample where `Codigo` repeats and `IDItem` is unique.
- CSV OC sample where `CodigoLicitacion` is blank.
- CSV OC sample where `EsCompraAgil = Si` and/or `CodigoAbreviadoTipoOC = AG`.
- CSV licitaciones sample where `CodigoExterno` repeats across `Codigoitem` and supplier/offer rows.
- CSV licitaciones sample preserving exact anomalous column names.

Fixtures must not contain real tickets or secrets.

## Definition Of Done

The source contract is implementation-ready when:

- API V1 Licitaciones supports query by date.
- API V1 Licitaciones supports query by state.
- API V1 Licitaciones supports query by `CodigoExterno`.
- API V1 OC supports query by date.
- API V1 OC supports query by state.
- API V1 OC supports query by `Codigo`.
- API V2 Compra Agil supports paginated listing.
- API V2 Compra Agil supports `ttl_cambio_ms`.
- API V2 Compra Agil supports `cambio_desde` and `cambio_hasta`.
- API V2 Compra Agil supports detail by `codigo`.
- API V2 Compra Agil uses `id_orden_compra` or `id_oc` for OC linkage.
- HTTP 429 is handled explicitly.
- Tickets are not hardcoded.
- CSV downloads are stored before parsing.
- CSV detects encoding.
- CSV detects delimiter.
- CSV records `quotechar`.
- CSV records `header_raw`.
- CSV records `observed_columns`.
- CSV records `column_count`.
- CSV records `schema_fingerprint`.
- CSV does not invent columns.
- CSV does not discard unknown columns.
- CSV preserves exact raw column names.
- CSV handles latin-1, semicolon delimiter, comma decimals, null-like raw values, and `1900-01-01` sentinel dates defensively.
- CSV does not enforce uniqueness on `Codigo`, `ID`, `CodigoExterno`, or `Codigoitem` in raw rows.
- Reconciliation storage exists.
- Canonical state mapping exists.
- Structured logging exists.
- API fixtures exist.
- CSV fixtures exist.

## Quota and Rate Limits

The Mercado Publico API enforces a daily call limit tracked by the ingestion backbone.

- **Daily limit**: 10000 calls per day, shared across all Mercado Publico API sources (V1 Licitaciones, V1 Ordenes de Compra, V2 Compra Agil).
- **Window**: 24-hour anchored to `America/Santiago` local time. Counter resets at 00:00 America/Santiago.
- **429 handling**: On a 429 response, the system records `last_429_at` in `mp.gold_api_quota_usage`. The `used` counter increments until the reset boundary passes, then resets to 1.
- **Configurable**: The daily limit is configurable via `MERCADO_PUBLICO_API_DAILY_LIMIT` (default 10000, non-sensitive). Lowering it in config allows early warning before hitting the actual API limit.

Per-source tracking is implemented at the endpoint level (`api-v1-licitaciones`, `api-v1-oc`, `api-v2-compra-agil`). The shared limit applies to all sources.
