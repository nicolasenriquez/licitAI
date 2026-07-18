# Fixture Coverage

Task `4.11` audit for synthetic, non-secret source fixtures.

## Coverage

| Source family | Fixture | Covered behavior |
| --- | --- | --- |
| API V1 licitaciones list | `v1-licitaciones-list.json` | list envelope, process key, state, dates, buyer |
| API V1 licitacion detail | `v1-licitacion-detail.json` | direct detail payload, nullable adjudication date |
| API V1 OC list | `v1-oc-list.json` | list envelope, OC key, licitacion link, decimal text |
| API V1 OC detail | `v1-oc-detail.json` | direct detail payload, provider state |
| API V2 Compra Agil list | `v2-compra-agil-list.json` | list envelope, region, publication window |
| API V2 Compra Agil detail with OC | `v2-compra-agil-detail-with-oc.json` | `id_orden_compra`, `id_oc`, and OC code linkage |
| API V2 Compra Agil detail without OC | `v2-compra-agil-detail-without-oc.json` | optional linkage absent |
| CSV ordenes de compra | `ordenes-compra-june-2026.csv` | semicolon, quote-compatible fields, comma decimals, `NA`, whitespace, sentinel date, repeated `Codigo`, unique `IDItem`, blank `CodigoLicitacion`, Compra Agil markers, anomalous column names |
| CSV licitaciones | existing `licitaciones-*` fixtures | Latin-1 accents, semicolon, 110-column/anomalous headers, repeated `CodigoExterno`, item and supplier/offer grain |

## Safety

- All new identifiers use the `FIXTURE-` prefix.
- API fixtures contain response bodies only; no ticket field or secret.
- No real source payload, ticket, credential, or production identifier is committed.

## Verification

- Parse all seven JSON fixtures with `ConvertFrom-Json`.
- Import the OC fixture with `Import-Csv -Delimiter ';'`.
- Confirm no fixture path contains `ticket`, `secret`, or credential literals.
