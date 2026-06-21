# Licitacion Lifecycle

## Purpose
Define el ciclo de vida completo de una licitación pública desde su publicación
hasta adjudicación y orden de compra. Documenta estados, transiciones, conexiones
entre entidades y reglas de reconciliación entre fuentes de datos (API v1 vs CSV
mensual).

## Primary Audience
Product owners, backend engineers, data engineers, domain experts, y AI agents
implementando la capa de negocio de licitaciones.

## Executive Summary
Una licitación pública en Mercado Público atraviesa estados predecibles
(publicada → cerrada → adjudicada/desierta) reflejados en dos fuentes de datos
distintas: la API v1 (estado reciente, tiempo real) y los CSV mensuales
(histórico completo). Los campos de una licitación cambian en cada etapa y la
reconciliación entre API y CSV debe respetar la prioridad de fuente según el
momento del ciclo. Entender este ciclo es crítico porque las reglas de negocio,
filtros, y productos dependen del estado exacto en que se encuentra cada proceso.

---

## Lifecycle Diagram

```
                  ┌──────────┐
                  │ publicada │ (Estado=5, "Publicada")
                  └─────┬────┘
                        │ FechaCierre alcanzada
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌─────────┐   ┌──────────┐   ┌───────────┐
    │ cerrada  │   │ revocada  │   │suspendida │
    │(Estado=6)│   │(Estado=18)│   │(Estado=19)│
    └────┬─────┘   └──────────┘   └───────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────────┐ ┌──────────┐
│adjudicada│ │ desierta  │
│(Estado=8)│ │(Estado=7) │
└────┬─────┘ └──────────┘
     │
     │ CodigoLicitacion = CodigoExterno
     ▼
┌──────────────┐
│ orden_compra  │
│ (puede tardar │
│  días/semanas)│
└──────────────┘
```

Timeline típico:
- publicada (día 0) → cierre (~15-30 días) → adjudicación (~15-60 días post-cierre) → OC (~0-90 días post-adjudicación)

---

## States

| Code | State       | API Source            | CSV Source          | What It Means |
|------|-------------|-----------------------|---------------------|---------------|
| 5    | publicada   | `CodigoEstado=5`      | `CodigoEstado=5`, `Estado="Publicada"` | Open for bids. FechaCierre is in the future. |
| 6    | cerrada     | `CodigoEstado=6`      | `CodigoEstado=6`, `Estado="Cerrada"` | Bidding closed. Under evaluation. FechaCierre is in the past. |
| 7    | desierta    | `CodigoEstado=7`      | `CodigoEstado=7`, `Estado="Desierta"` | No bids received or all rejected. Terminal state. |
| 8    | adjudicada  | `CodigoEstado=8`      | `CodigoEstado=8`, `Estado="Adjudicada"` | Awarded to supplier. Adjudicacion/* populated. |
| 18   | revocada    | `CodigoEstado=18`     | —                   | Cancelled by buyer before closing. Terminal. |
| 19   | suspendida  | `CodigoEstado=19`     | —                   | Temporarily suspended. May resume. |

---

## State Transitions

### 1. publicada → cerrada

**Trigger:** `FechaCierre` is reached (bidding period ends).

**Changed fields:**
- `CodigoEstado`: 5 → 6
- `Estado`: "Publicada" → "Cerrada"
- `FechaCierre`: now in the past (was future)

**API behavior:** `estado=activas` no longer returns this licitación.
**CSV behavior:** The licitación appears in the next monthly CSV with Estado="Cerrada".

### 2. cerrada → adjudicada

**Trigger:** Buyer evaluates bids and selects winner. Resolution is published.

**Changed fields:**
- `CodigoEstado`: 6 → 8
- `Estado`: "Cerrada" → "Adjudicada"
- `FechaAdjudicacion`: populated with award date
- `Adjudicacion/*`: nested object appears with supplier info, amount, resolution number
- `NumeroOferentes`: populated in CSV

**API behavior:** `Adjudicacion/*` object is present in the response. Previously was `null`.
**CSV behavior:** Offer rows expose selection through the observed `Oferta seleccionada` column. Keep the raw value and map it defensively.

### 3. cerrada → desierta

**Trigger:** No bids received, or all bids were rejected by the buyer.

**Changed fields:**
- `CodigoEstado`: 6 → 7
- `Estado`: "Cerrada" → "Desierta"
- `FechaAdjudicacion`: remains `null`
- `Adjudicacion/*`: never appears

**CSV behavior:** `NumeroOferentes=0` or all offers rejected.

### 4. adjudicada → orden_compra

**Trigger:** Buyer issues a purchase order against the adjudicated process.

**Connection:** `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`.

**Key rules:**
- Not automatic — OC may appear days or weeks after adjudicación.
- Some adjudicadas never generate an OC (contract handled outside Mercado Público).
- One licitación can generate multiple OCs (partial deliveries, multiple suppliers).
- `orden_compra.Estado` has its own lifecycle (enviada → aceptada → recepcionada).
- The licitación itself does NOT change state when an OC is issued.

### 5. revocada

**Trigger:** Buyer cancels the process. May happen at any stage before adjudicación.

**Changed fields:**
- `CodigoEstado`: → 18
- Terminal state. Will not transition further.

### 6. suspendida

**Trigger:** Process temporarily halted. May resume to its previous state.

**Changed fields:**
- `CodigoEstado`: → 19
- Non-terminal. Can return to previous state.

---

## Entity Connections

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ licitacion   │────→│ adjudicacion  │────→│ orden_compra    │
│ CodigoExterno│ 1:1 │ CodigoExterno │ 1:N │ CodigoLicitacion│
└─────────────┘     └──────────────┘     └────────────────┘
```

### licitacion → adjudicacion

- An adjudicación belongs to a licitación, but CSV evidence can appear at item and offer grain.
- Key: `adjudicacion.CodigoExterno = licitacion.CodigoExterno`.
- Adjudicación data exists in two places in the API response:
  - `Adjudicacion/*` at the licitación level (process-level award).
  - `Items/Listado[]/Adjudicacion/*` at the item level (line-level awards).
- In CSV: Adjudicación is embedded in offer rows and should be normalized after row-grain analysis.

### licitacion → orden_compra (1:N)

- One licitación can have zero, one, or many OCs.
- Key: `orden_compra.CodigoLicitacion = licitacion.CodigoExterno`.
- OC is a separate entity with its own lifecycle.
- In CSV: `CodigoLicitacion` field in OC CSV links back.

### compra_agil ≠ licitacion

- **Compra Agil is NOT joinable to licitación via CodigoLicitacion.**
- They are separate process families with different workflows, APIs (v2 vs v1),
  and reconciliation contracts.
- Compra Agil links to OC via `id_orden_compra` or `id_oc`, not via `CodigoLicitacion`.

---

## Data Source Reconciliation Per Stage

| Lifecycle Stage      | Preferred Source        | Reason |
|----------------------|------------------------|--------|
| publicada            | API v1                 | Real-time, same-day freshness |
| cerrada              | API v1                 | Immediate state change visibility |
| adjudicada           | API v1 (state + dates) + CSV (provider detail, offer data) | API has latest state; CSV has full offer history |
| desierta             | API v1 first, CSV confirms | — |
| histórico (>90 días) | CSV mensual            | API does not reliably serve deep history |
| orden_compra         | CSV mensual            | Complete OC history; API v1 OC is supplementary |

### Merge Priority Per Field Family

| Field Family                | Preferred Source |
|-----------------------------|-----------------|
| Recent operational lifecycle state | API |
| Historical completeness and late-published evidence | CSV/ZIP |
| Raw provenance              | Both, preserved independently |
| Product-facing licitación identity | One reconciled header record per `CodigoExterno` |
| Conflicts that cannot be resolved by priority | Explicit reconciliation issue, not silent choice |

---

## Field Evolution Across Lifecycle

| Field              | publicada | cerrada | adjudicada | desierta |
|--------------------|:---------:|:-------:|:----------:|:--------:|
| CodigoExterno      | ✓         | ✓       | ✓          | ✓        |
| Nombre             | ✓         | ✓       | ✓          | ✓        |
| Descripcion        | ✓         | ✓       | ✓          | ✓        |
| CodigoEstado       | 5         | 6       | 8          | 7        |
| Estado             | "Publicada"| "Cerrada"| "Adjudicada"| "Desierta"|
| FechaCierre        | future    | past    | past       | past     |
| FechaPublicacion   | ✓         | ✓       | ✓          | ✓        |
| FechaAdjudicacion  | null      | null    | ✓          | null     |
| Adjudicacion/*     | null      | null    | ✓          | null     |
| NumeroOferentes    | 0 or null | >0      | >0         | 0        |
| Items/Listado      | ✓         | ✓       | ✓          | ✓        |
| MontoEstimado      | ✓         | ✓       | —          | —        |

---

## Reconciliation Rules

1. Reconcile by `CodigoExterno` — API and CSV share this natural key. It is immutable.
2. API wins for recent lifecycle state (<30 days since cierre).
3. CSV wins for historical completeness and provider/offer detail.
4. When a field differs between API and CSV, log a reconciliation issue — do not choose silently.
5. Preserve source attribution for every reconciled field.
6. `Adjudicacion/*` from API and CSV offer rows must be cross-validated — they represent the same award from different angles.
7. Never use `compra_agil.CodigoLicitacion` to join to `licitacion` — the connection is invalid.

---

## Operating Rules

1. `CodigoExterno` is the immutable natural key — never derive it from another field.
2. `estado=activas` in the API is a convenience filter, not a real state.
3. Do not treat `Compra Agil` as classical licitación — separate process families.
4. Preserve raw payloads before normalization. Do not mutate raw data after capture.
5. A licitación may have adjudicación without OC, and OC without visible adjudicación.
6. Item-grain rows must never be counted as process counts.
7. Header amounts must not be summed from line items at row grain.
8. Product-facing views should expose one reconciled header record per `CodigoExterno`.

## Current Assumptions

- API v1 is the primary source for discovery and recent lifecycle state.
- CSV mensual is the historical source of truth for completeness.
- Reconciliation API ↔ CSV occurs post-ingestion, not in real time.
- The full cycle from publicada to OC can span 30–90 days.
- `Compra Agil` is in scope as a dedicated lane in phase 1, not as a subtype of licitación.

## Open Decisions

- Refresh cadence: daily for near-closing only, or all active?
- Store complete Items snapshot or only normalized projection + raw?
- Should organism-based watchlists be first-class product workflows?
- What is the exact canonical conflict policy when the same CSV period is re-downloaded with different row content?

---

## Related Documents

- `docs/architecture/data-model.md` — entity catalog, key rules, source mappings
- `docs/operations/data-operations.md` — ingestion rules, reconciliation, merge priority
- `docs/business/quote-and-bid-workflow.md` — commercial lifecycle (DETECT → SUBMIT)
- `docs/business/mercado-publico-source-contract.md` — source API and CSV ingestion contract

---

Last Updated: 2026-06-17
Version: 1.0.0
