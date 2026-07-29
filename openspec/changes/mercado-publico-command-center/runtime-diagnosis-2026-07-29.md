# Runtime diagnosis: Compra Agil data completeness

**Date:** 2026-07-29 (America/Santiago)
**Scope:** read-only investigation of `http://localhost:3000/mercado-publico#compra-agil`. No application code, database data, migrations, jobs, or runtime configuration were changed.

## Question answered

The Compra Agil screen displays frequent `Sin informacion` / `No informado`
values and has far fewer records than expected. This document determines
whether the provider omits the data, whether it is lost in the ingestion path,
or whether a lookup/join is missing.

## Result

This is **not primarily a UI rendering problem and not an upstream API absence**.
For Compra Agil, the provider response already contains the title, buyer
institution, state, publication date, closing date, last-change date, region,
and other fields. The current persistence and gold-read model retain only a
small subset and the gold materialization intentionally emits `NULL` for the
display fields. Additionally, historical rows from 11 and 13 July were
ingested before the nested-state normalization fix, and the Compra Agil
ingestion has not run since 18 July.

The screenshot is therefore an accurate rendering of the current GraphQL read
model: it is not inventing the blanks.

## Licitaciones: related but distinct gap

Licitaciones look more complete because the local model has 1,550 rows with a
title, normalized state and closing date. It does **not** have buyer or
publication data: all 1,550 canonical rows have `buyer_code`, `buyer_name`,
and `fecha_publicacion` null.

This is partly an upstream endpoint-shape distinction and partly an ingestion
coverage gap:

- The V1 `by-state` list payload used for bulk ingestion contains only
  `CodigoExterno`, `CodigoEstado`, `Nombre`, and `FechaCierre`; it has no
  buyer or publication field to project.
- The V1 `detail-by-codigo` payload does contain
  `Comprador.{CodigoOrganismo,NombreOrganismo,...}` and
  `Fechas.FechaPublicacion`, as verified in a retained successful response.
- The staging projection contains zero buyer values across 4,354 rows, so the
  small number of detail calls has not populated those nested detail fields.

Thus the missing Licitaciones organism is not a missing local reference-table
join either. It requires explicitly normalizing and persisting the nested V1
detail fields and deciding which list records warrant bounded detail hydration.
That is a different throughput/cost trade-off from the Compra Agil list
projection, but belongs in the same future data-contract correction.

## Reproducible evidence loop

The following read-only path reproduced the symptom:

```text
mp.raw_api_payload (provider JSON)
  -> mp.stg_api_v2_compra_agil (staging projection)
  -> mp.compra_agil (canonical projection)
  -> mp.gold_detected_process (GraphQL read model)
  -> MercadoPublicoBrowseTab
```

The local Docker stack was healthy (`db`, `redis`, `server`, and `worker` up).
Unauthenticated direct access to `/graphql` correctly returned `FORBIDDEN`, so
the GraphQL response was not queried outside the authenticated browser
session. The SQL-backed read model and the front-end query were inspected
directly instead.

## Evidence by boundary

| Boundary | Observed fact | Conclusion |
| --- | --- | --- |
| Provider JSON | Latest successful V2 list payload (2026-07-18) contains `nombre`, nested `estado.{codigo,glosa}`, `fechas.{fecha_publicacion,fecha_cierre,fecha_ultimo_cambio}`, and `institucion.{rut,organismo_comprador,unidad_compra,region,nombre_region}`. | Object, organism and dates **do arrive** from Mercado Publico. No buyer-table join is required to show the provider's buyer name. |
| Staging schema | Live `mp.stg_api_v2_compra_agil` has only code, state, OC keys, request-window values, and fetch time. It has no title, buyer, or institution columns. | Those fields are dropped on the raw-to-staging projection. |
| Canonical schema | Live `mp.compra_agil` has only code, state, OC keys, region and timestamps. It has no title or buyer columns; it also lacks the date columns expected by the current runtime binary. | The canonical model cannot carry title or buyer, and has migration drift for dates. |
| Gold model | `MercadoPublicoReconciliationService.materializeGoldProcesses()` explicitly sets Compra Agil `title`, `buyer_code`, `buyer_name`, `published_at`, and `closing_at` to `NULL`. | This is the direct cause of the blanks in the list and of the unavailable date sort/filter semantics. |
| UI | `MercadoPublicoBrowseTab` renders `process.title ?? process.processCode` and uses the GraphQL detected-process fields for buyer, state and dates. | The UI faithfully renders the nulls received from GraphQL; it is not stripping non-null values. |

## Quantified local state

At inspection time, `mp.gold_detected_process` contained 110 Compra Agil
records:

| Measure | Count |
| --- | ---: |
| Total Compra Agil rows | 110 |
| With title | 0 |
| With buyer name | 0 |
| With publication date | 0 |
| With closing date | 0 |
| With canonical state | 50 |
| Without canonical state | 60 |
| `publicada` | 49 |
| `cancelada` | 1 |

The 60 state-less records are historical, not random current failures:

| Ingestion date | Distinct codes | Staging rows with state | Canonical rows with state |
| --- | ---: | ---: | ---: |
| 2026-07-11 | 50 | 0 | 0 |
| 2026-07-13 | 10 | 0 | 0 |
| 2026-07-18 | 50 | 200 | 50 |

The raw JSON from 11 July already included a nested
`estado: { codigo, glosa, id_estado }`; the old ingestion projection did not
normalize that object. Commit `f3fd4f8368` (2026-07-18) introduced the
normalization that maps `estado.codigo` / `estado.glosa`, which explains why
the 18 July cohort has state while the prior 60 rows remain incomplete.

## Why there are few records and few current publications

1. **The source was queried only as one page per CLI job.** All successful
   Compra Agil list calls used `numero_pagina: 1` and a maximum
   `tamano_pagina: 50`. The incremental and publication-window services make
   one `getList()` call; they do not follow provider pagination.
2. **The latest Compra Agil ingestion was 2026-07-18.** There are no later
   `api-v2-compra-agil-*` job runs or raw API calls, while the current date is
   2026-07-29. The command-center change schedules reconciliation only; it does
   not make the CLI-only Compra Agil ingestion periodic.
3. **Historical page-one results overlap.** The local store has 360 staged list
   rows but only 110 distinct codes. The repeated first-page pulls deduplicate
   to 110 canonical records.

Therefore 49 `publicada` rows is not evidence that Mercado Publico has only 49
published Compra Agil opportunities. It is the count in a stale, page-one-only,
deduplicated local sample.

## Migration drift and immediate operational risk

The running server image was built on 2026-07-24 and contains the compiled
Compra Agil date persistence code and its registered instance command
`2-16-instance-command-fast-1784100000000-mp-compra-agil-v2-dates`. The live
database nevertheless lacks the columns this code writes:

```text
mp.stg_api_v2_compra_agil: raw_fecha_publicacion, raw_fecha_cierre,
  raw_fecha_ultimo_cambio, fecha_publicacion, fecha_cierre,
  fecha_ultimo_cambio, region
mp.compra_agil: fecha_publicacion, fecha_cierre, fecha_ultimo_cambio
```

No Compra Agil job has run since the image was built, so this drift has not yet
been exercised by the current binary. A new ingestion run is expected to fail
at the staging insert until pending fast instance commands are applied. This is
an operational blocker, not a reason to run an ad-hoc SQL patch.

## Root-cause statement

The blank Compra Agil columns result from a compound pipeline defect:

1. the original V2 projection did not normalize a nested `estado` object;
2. the current schema/model does not persist title or buyer data even though
   the provider supplies it;
3. the gold materializer hardcodes those fields, plus both browse dates, to
   `NULL` for `compra_agil`;
4. the date migration is present in the image but unapplied in the local DB;
5. ingestion is a manual CLI one-page operation with no periodic execution,
   and has been stale for 11 days.

The suspected missing organization join is **not** the primary cause: the
provider's `institucion.organismo_comprador` is already sufficient for the
display. A later reference-data enrichment join may be useful, but is neither
required nor sufficient to fix the observed blanks.

## Smallest safe correction sequence (not executed)

1. **Operationally reconcile schema before ingestion:** run the documented
   pending fast instance-command migration through the supported migration
   command; then verify the columns and indexes. Do not hand-edit `mp` tables.
2. **Broaden the canonical contract:** add a new immutable instance command and
   carry title, buyer code/name, raw/normalized dates, and state from the V2
   list/detail response through staging and `mp.compra_agil`.
3. **Correct the gold materialization:** source Compra Agil display fields from
   the expanded canonical model instead of emitting hard-coded `NULL`s.
4. **Backfill safely:** reprocess retained `raw_api_payload` records through
   the corrected projection (including the 60 pre-fix records), then refresh
   the gold read model. This must be idempotent and prove state/title/buyer/date
   preservation at the GraphQL seam.
5. **Implement bounded pagination and a deliberate cadence:** follow all
   provider pages within a bounded window and schedule/operate the existing
   CLI ingestion explicitly. Protect quota and persist page/cursor evidence.
6. **Add regression coverage:** one real-shaped fixture with nested
   `estado`, `fechas`, and `institucion`; assert raw -> staging -> canonical ->
   gold -> GraphQL values are non-null. Add a pagination fixture proving that
   page 2 is requested and represented.

## Verification criteria for a future fix

- A newly ingested provider item with `nombre`, `institucion`, `fechas`, and
  nested `estado` returns these values non-null from
  `mercadoPublicoDetectedProcesses`.
- The Compra Agil table displays its object, organism, state, publication and
  closing values without relying on UI defaults.
- Old raw payloads backfill the 60 state-less records where the retained JSON
  contains a state.
- A bounded multi-page window produces more than the first 50 provider records
  when the provider reports further pages.
- The last successful ingestion timestamp is visible and fresh according to a
  declared operational SLO.

## Files and runtime surfaces inspected

- `packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-reconciliation.service.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-{incremental,publication-window,detail-by-codigo}.service.ts`
- `packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service.ts`
- `packages/twenty-front/src/modules/mercado-publico/components/MercadoPublicoBrowseTab.tsx`
- local `mp.raw_api_payload`, `mp.stg_api_v2_compra_agil`, `mp.compra_agil`,
  `mp.gold_detected_process`, and `mp.stg_job_run` data
