---
type: change-fixture-coverage
title: "Fixture Coverage: mercado-publico-ingestion-cue-hardening"
description: "Existing and missing API fixture inventory for Mercado Publico ingestion CUE hardening Slice 1."
okf_version: "0.1"
---
# Fixture Coverage: mercado-publico-ingestion-cue-hardening

## Purpose

Inventory the existing V2 API test fixtures and identify which fixture gaps must
be addressed in Slice 1 (contract coverage, failing first) before implementation
begins. Non-implementing by design (Phase 0 scope lock — no fixture files are
written in this phase).

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`, `openspec/AGENTS.md`,
`openspec/CONTEXT.md`, change `proposal.md`, `design.md`, `tasks.md`,
`specs/.../spec.md`, `openspec/changes/mercado-publico-ingestion-backbone/fixture-coverage.md`,
source tree `packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/`.

---

## Existing Fixtures

All in `packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/`.

### V1 API fixtures

| File | Shape | Coverage |
|------|-------|----------|
| `v1-licitaciones-list.json` | Array of licitacion list records | V1 licitaciones list extraction |
| `v1-licitacion-detail.json` | Single licitacion detail record | V1 licitacion detail extraction |
| `v1-oc-list.json` | Array of OC list records | V1 OC list extraction |
| `v1-oc-detail.json` | Single OC detail record | V1 OC detail extraction |

### V2 API fixtures

| File | Shape | Coverage |
|------|-------|----------|
| `v2-compra-agil-list.json` | `{ "Items": [...] }` envelope wrapping array of flat records with `codigo`, `estado` (scalar), `region`, `publicado_desde`, `publicado_hasta` | V2 list extraction + `Items` envelope unwrapping |
| `v2-compra-agil-detail-with-oc.json` | Flat object: `codigo`, `estado` (scalar), `region`, `orden_compra` sub-object (`id_orden_compra`, `id_oc`, `codigo_orden_compra`) | V2 detail extraction with OC linkage |
| `v2-compra-agil-detail-without-oc.json` | Flat object: `codigo`, `estado` (scalar), `region` (no `orden_compra`) | V2 detail extraction without OC |

### CSV test fixtures

| File | Shape | Coverage |
|------|-------|----------|
| `licitaciones-minimal-latin1-semicolon.csv` | Latin-1, semicolon delimited | `detect-encoding`, `detect-delimiter`, `parse-csv-line` |
| `licitaciones-accented-producto-generico.csv` | Accented text | `parse-csv-line` accented content |
| `licitaciones-110-columns-with-unusual-names.csv` | 110-column CSV | Column mapping + `project-staging-row` |
| `licitaciones-repeated-codigo-externo-with-codigoitem.csv` | Repeated business keys | Dedup + identity constraints |
| `licitaciones-repeated-codigo-externo-with-supplier-offer.csv` | Supplier offer dedup | Identity constraints |
| `ordenes-compra-june-2026.csv` | June 2026 OC CSV (Latin-1, semicolon, date sentinels) | OC parsing + date sentinels |

---

## Slice 1 Fixture Additions

The following synthetic fixtures were added for implementation coverage. They
do not contain production identifiers or captured source data.

#### Object-shaped estado (task 1.1)

| Fixture needed | Description |
|----------------|-------------|
| `v2-compra-agil-list-object-estado.json` | V2 list response where `Items[].estado` is an object `{ "codigo": "cerrada", "glosa": "Cerrada" }`. Tests `codigo` branch of normalization helper. |
| `v2-compra-agil-list-object-estado-glosa-fallback.json` | V2 list response where `Items[].estado` is an object with no `codigo` field, only `{ "glosa": "Estado Reservado" }`. Tests `glosa` fallback. |
| `v2-compra-agil-list-object-estado-empty.json` | V2 list response where `Items[].estado` is an object with no `codigo` and no `glosa`. Tests nil fallback (empty string or null). |

Note: all three must also include valid scalar-estado records in the `Items` array
to prove scalar compatibility is preserved.

#### Production-shaped detail envelope (task 1.1)

| Fixture needed | Description |
|----------------|-------------|
| `v2-compra-agil-detail-production-envelope.json` | Redacted V2 detail response using the confirmed production envelope (e.g. `{ "data": { ... } }` or `{ "result": { ... } }`). Contains a valid detail record inside the wrapper. Tests envelope unwrapping + raw persistence. |

#### Missing detail (task 1.2)

| Fixture needed | Description |
|----------------|-------------|
| `v2-compra-agil-detail-envelope-no-record.json` | V2 detail response using the production envelope but containing no usable detail record inside (e.g. `{ "data": { "message": "No encontrado" } }` or empty `{}`). Tests the missing-detail failure path: `status: 'failed'`, `recordsFailed > 0`, non-empty `errorSummary`, raw evidence retained. |

### 1.3 does not require new fixtures

The page-size validation bounds are tested via inline parameter assertions in
`validate-compra-agil-params.util.spec.ts`. The lower-bound test (`tamano_pagina: 1`)
and upper-bound test (`tamano_pagina: 50`) already exist as validation concepts
— the existing `out_of_range` test for zero/negative just needs a new test for
values 1-9 once the validation bound changes from `<= 0` to `< 10`.

### 1.4 does not require new fixtures

No production database fixture is committed. Focused persistence and
integration-shaped tests use the existing service seams; live database
counter/idempotency assertions remain part of the operator CUE gate.

---

## Fixture Writing Rules (for Slice 1 implementation)

Per `proposal.md` Verification Policy and Out Of Scope:
- Never commit production tickets, credentials, or identifiers.
- Redacted fixtures must use placeholder values (`FIXTURE-CA-*`, `CA-*`) and
  synthetic timestamps.
- Object-shaped `estado` fixtures must match the confirmed production shape but
  with de-identified codes.
- Detail envelope fixtures must match the confirmed production wrapper shape
  (envelope name, field names) and use synthetic inner data.
- CSV fixtures must never contain production data or be copies of production files.
- All fixture files live under `drivers/api/__tests__/fixtures/` and are JSON.
