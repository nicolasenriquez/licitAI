# Mercado Publico Ingestion Context

## Purpose

Provide durable business and domain context for Mercado Publico ingestion work so repository files, not chat, remain the source of truth for source semantics, reconciliation rules, and safe implementation boundaries.

## Primary Audience

Product owners, backend engineers, data engineers, reviewers, and AI agents working on Mercado Publico ingestion and reconciliation changes.

## Executive Summary

Mercado Publico ingestion depends on understanding that API and CSV are complementary but non-equivalent sources.

- API is the operational source for recent discovery, status visibility, and detail refresh.
- CSV is the historical source for completeness, batch backfill, and offer evidence.
- Compra Agil is a separate process family from classical licitacion and must not be modeled as a subtype of licitacion.
- Reconciliation must be explicit, auditable, and reversible.

For the current backbone change, the implementation posture is API-executable and CSV-ready only. Historical CSV execution is intentionally deferred.

## Central Principle

Do not treat API and CSV as equivalent replicas.

```text
API = recent operations, discovery, point detail, and monitoring
CSV = historical completeness, batch backfill, offers, and later reconciliation
```

This implies a layered pipeline:

```text
Raw -> Canonical -> Reconciled -> Gold
```

Raw preserves provenance. Canonical normalizes entities. Reconciliation makes cross-source decisions explicit. Gold serves downstream consumers.

## Source Families

### API V1 Licitaciones

Expected use:

- recent process discovery
- state-based monitoring
- detail-by-code rehydrate
- operational refresh when a process drifts or first appears

Natural key:

- `CodigoExterno`

### API V1 Ordenes de Compra

Expected use:

- recent OC discovery
- state-based monitoring
- detail-by-code refresh
- resolving downstream OC references from licitaciones or Compra Agil

Natural key:

- `Codigo`

### API V2 Compra Agil

Expected use:

- incremental Compra Agil discovery
- detail refresh by `codigo`
- OC linkage through explicit OC identifiers

Natural key:

- `codigo`

### CSV / Datos Abiertos

Expected use:

- historical completeness
- batch backfill
- offer evidence
- reconciliation against API snapshots

This source is important for long-range truth, but the current backbone change does not yet execute CSV ingestion.

## Relationship Rules

### Licitacion to OC

Exact linkage:

```text
orden_compra.CodigoLicitacion = licitacion.CodigoExterno
```

Important constraints:

- the relationship is optional
- one licitacion can lead to zero, one, or many OCs
- not every OC comes from a licitacion

### Compra Agil to Licitacion

Invalid assumption:

```text
Compra Agil is NOT joinable to licitacion via CodigoLicitacion
```

Compra Agil is a separate process family and must not be modeled as a subtype of licitacion.

### Compra Agil to OC

Preferred linkage:

```text
compra_agil.id_orden_compra or compra_agil.id_oc
```

Do not depend on `codigo_orden_compra` being present when the OC exists.

## Source Priority

### Recent operational lifecycle state

Preferred source:

- API

Use this for:

- published and active discovery
- near-real-time state drift
- detail rehydrate for recent processes

### Historical completeness and offer evidence

Preferred source:

- CSV

Use this for:

- older periods
- historical backfill
- provider and offer evidence
- completeness when API snapshots are incomplete

### OC operational detail

Preferred source:

- API by code for recent operational state
- CSV for long-range historical completeness

### Raw provenance

Preferred source:

- preserve both independently

Do not destructively merge away provenance.

## Reconciliation Rules

1. Exact key joins always win over heuristics.
2. Reconcile licitacion by `CodigoExterno`.
3. Reconcile OC by `Codigo`.
4. Use `CodigoLicitacion = CodigoExterno` for exact licitacion to OC linkage.
5. Never infer licitacion linkage from Compra Agil using `CodigoLicitacion`.
6. Use `id_orden_compra` or `id_oc` for exact Compra Agil to OC linkage.
7. API wins for recent operational lifecycle state.
8. CSV wins for historical completeness and offer evidence once CSV execution exists.
9. Heuristics by amount, supplier, or item may produce candidates, never silent truth.
10. Source conflicts that cannot be resolved by priority must become explicit reconciliation issues.

## Data Quality Rules

- Preserve raw payloads before normalization.
- Preserve raw state code and raw state label.
- Do not overwrite a non-null canonical value with `null`.
- Keep source attribution when one source wins by policy.
- Make reconciliation events idempotent so reruns do not generate duplicate operational noise.
- Do not count item-grain rows as process counts.
- Do not derive header-level truth from accidental row-grain aggregation.

## Implementation Posture For The Current Backbone Change

This repository change is intentionally narrower than the full long-term ingestion vision.

Included now:

- deployment-local shared `mp` schema
- API-executable ingestion backbone
- CSV-ready raw and staging contracts
- canonical normalization
- reconciliation storage and read contracts
- operational traceability, idempotency, and quota handling

Deferred now:

- CSV download
- CSV decompression
- CSV parsing
- CSV batch normalization
- historical completeness claims derived from executed CSV ingestion
- CRM-facing projections such as Opportunities, Companies, People, or a Licitaciones UI

## Deployment Interpretation

The product's current business posture allows customer-isolated deployments.

That does not conflict with a shared `mp` schema if the rule is interpreted correctly:

- `mp` is shared inside one installation
- each isolated customer deployment owns its own `mp` schema
- this does not introduce a cross-customer shared control plane

## Operational Questions Still Open

- Should broad `by-date` V1 sweeps be introduced after the state-based baseline stabilizes?
- What is the exact deduplication policy for future CSV execution when the same period is re-downloaded?
- Which freshness thresholds should later drive alerts or health status in Gold?

## Related Documents

- `docs/business/business-case.md`
- `docs/business/licitacion-lifecycle.md`
- `docs/business/quote-and-bid-workflow.md`
- `docs/architecture/data-model.md`
- `docs/operations/data-operations.md`
- `openspec/changes/mercado-publico-ingestion-backbone/`
