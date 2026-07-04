---
type: business-context
title: "Quote & Bid Workflow"
description: "Business context for Quote & Bid Workflow."
okf_version: "0.1"
---
# Quote & Bid Workflow

## Purpose
Define the end-to-end commercial workflow from procurement opportunity detection through bid decision and quote drafting, and specify the new data entities required.

## Primary Audience
Product owners, engineers, domain experts, and AI agents implementing commercial features.

## Executive Summary
Omnibid extends the procurement intelligence pipeline with a commercial decision layer: `intencion_oferta` tracks bid/no-bid decisions, `cotizacion` enables supplier evaluation through quote drafts, and `nota` provides traceable commentary across all records. Phase 4 implements the manual workflow; post-MVP introduces automated price evidence and agent-assisted quoting.

---

## Commercial Lifecycle

```
DETECT ──> TRIAGE ──> DECIDE ──> RESEARCH ──> DRAFT ──> REVIEW ──> SUBMIT ──> TRACK
  │          │          │            │           │          │          │          │
  │          │          │            │           │          │          │          │
  ▼          ▼          ▼            ▼           ▼          ▼          ▼          ▼
Watchlist   Nota     intencion_    Cotizacion  Ajuste     Seleccion  Export     Adjudicacion
refresh     en       oferta       base        precios    definitiva PDF/CSV   reconciliation
            record   .participa   creada      manuales               (fuera de   follow-up
                                                                     Omnibid)
```

### 1. DETECT
- Licitacion or Compra Agil appears in the admin's watchlist or via search.
- Source: API sync (scheduled) or CSV upload (manual).
- No commercial action yet. Data is read-only.

### 2. TRIAGE
- Admin opens the record to assess relevance.
- Adds a `nota` with initial observations (e.g., "Revisar viabilidad técnica", "Rubro fuera de nuestro foco").
- May apply a filter or move the record to a specific watchlist for tracking.

### 3. DECIDE
- Admin sets `intencion_oferta`:
  - `pendiente`: Not yet decided.
  - `participa`: We will bid.
  - `no_participa`: We will not bid (e.g., wrong rubro, insufficient capacity, competitor advantage).
- Bulk intention marking available from table view (select multiple → apply state).
- Filterable: admin views only `participa` or `pendiente` records.
- Marking `participa` triggers the next phase. `no_participa` ends the workflow for that process.

### 4. RESEARCH
- Admin creates one or more `cotizacion` drafts, each evaluating a different external supplier.
- `cotizacion_item` base auto-generated from `licitacion_item`.
- Admin manually adjusts quantities and prices.
- Optional: admin pastes a URL with price evidence (`evidencia_precio`).
- Multiple cotizaciones allow side-by-side supplier comparison.
- Research can happen before or after `intencion_oferta` — the admin may quote to decide.

### 5. DRAFT
- Admin refines the most promising cotizacion.
- Adds notas to justify pricing decisions ("Proveedor A ofrece delivery en 48h vs B en 5 días").
- Changes state to `en_revision`.

### 6. REVIEW
- Admin does a final review of the cotizacion.
- May involve a second reviewer (not in Phase 1 — single admin).
- Changes state to `lista_para_enviar`.

### 7. SUBMIT
- Admin selects one cotizacion as `seleccionada`.
- All other cotizaciones for the same licitacion + oferente auto-archive to `archivada`.
- Admin exports the cotizacion as PDF/CSV for external submission.
- **Omnibid does not submit bids.** The export is a reference document for the admin to use in their own submission process.

### 8. TRACK
- The reconciliation engine (F6) detects when the licitacion is adjudicated.
- If `adjudicacion.proveedor_rut` matches the admin's `proveedor_rut`: won (inferred, shown as badge in UI).
- If `adjudicacion.proveedor_rut` differs: lost to another supplier (badge with winner name).
- If licitacion status is `desierta`: no winner (process void).
- `intencion_oferta` and `cotizacion` keep their states as historical record — the result is inferred, not stored.

---

## Data Entities

### `intencion_oferta`

| Campo | Tipo | Descripción |
|---|---|---|
| `proceso_tipo` | enum | `licitacion` or `compra_agil` |
| `proceso_codigo` | string | `codigo_externo` (licitacion) or `codigo` (compra_agil) |
| `proveedor_rut` | string | Admin's linked `proveedor` RUT |
| `estado` | enum | `pendiente`, `participa`, `no_participa` |
| `created_at` | timestamp | First marking time |
| `updated_at` | timestamp | Last state change |

**Natural key:** `(proceso_tipo, proceso_codigo, proveedor_rut)`
**Phase:** 4

### `cotizacion`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `licitacion_codigo_externo` | string | FK to `mp.licitacion` |
| `proveedor_rut_evaluado` | string | External supplier being evaluated |
| `estado` | enum | `borrador`, `en_revision`, `lista_para_enviar`, `seleccionada`, `archivada` |
| `notas` | text | Optional summary notes at header level |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Unique constraint:** Only one `seleccionada` per `(licitacion_codigo_externo, proveedor_rut)`.

### `cotizacion_item`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `cotizacion_id` | UUID | FK to `cotizacion` |
| `licitacion_item_index` | int | Index from source `licitacion_item` |
| `descripcion` | string | From `licitacion_item` |
| `cantidad` | int | Admin-adjusted quantity |
| `precio_unitario` | decimal | Admin-entered unit price |
| `precio_total` | decimal | Computed: `cantidad * precio_unitario` |
| `evidencia_precio` | JSON nullable | `{source_url, snapshot, extractor_method, confidence, producto_descripcion, precio_detectado}` |

### `evidencia_precio` (stored in `raw` layer)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `source_type` | enum | `manual_url` (Phase 4), `web_scraping`, `ai_extractor` (post-MVP) |
| `source_url` | string | URL where price was found |
| `snapshot` | bytea/text | Raw HTML/text content at fetch time |
| `extractor_method` | string | How price was extracted |
| `confidence` | float | 0.0–1.0 |
| `producto_descripcion` | string | What product was detected |
| `precio_detectado` | decimal | Price found |
| `moneda` | string | Currency |
| `cotizacion_item_id` | UUID | FK to `cotizacion_item` |
| `fetched_at` | timestamp | When the source was accessed |

### `nota`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `entidad_tipo` | string | e.g., `licitacion`, `compra_agil`, `cotizacion`, `intencion_oferta`, `orden_compra` |
| `entidad_id` | string | Natural key or UUID of the entity |
| `titulo` | string | Note title |
| `contenido` | text | Markdown content |
| `autor` | enum | `admin` or `assistant` |
| `created_at` | timestamp | |

**Natural key:** `(entidad_tipo, entidad_id, id)` — multiple notes per entity, ordered by `created_at DESC`.

---

## User Stories (from PRD)

| Story | Summary |
|---|---|
| 35 | Mark `intencion_oferta` on licitacion or Compra Agil |
| 36 | Update `intencion_oferta` |
| 37 | Filter by `intencion_oferta` |
| 38 | Bulk `intencion_oferta` from watchlist table |
| 39 | Create `cotizacion` borrador |
| 40 | Auto-generate `cotizacion_item` base |
| 41 | Adjust quantities and prices |
| 42 | Add `evidencia_precio` URL |
| 43 | Select definitive cotizacion, auto-archive others |
| 44 | View archived cotizaciones history |
| 45 | Create `nota` on any record |
| 46 | View notas in descending order |
| 47-52 | Assistant interactions |

---

## Current Assumptions

- Cotizacion applies only to `licitacion`, not to `compra_agil`. Compra Agil uses `intencion_oferta` + `nota` only.
- Múltiples cotizaciones are compared manually by the admin. No automated comparison view in Phase 4.
- Price evidence is manual (URL + description) in Phase 4. Automated extraction post-MVP.
- `ADMIN_PROVEEDOR_RUT` env var is optional. `intencion_oferta` and `cotizacion` features are hidden until it is set.
- PDF/CSV export is for admin reference only. Omnibid does not submit bids to Mercado Publico.
