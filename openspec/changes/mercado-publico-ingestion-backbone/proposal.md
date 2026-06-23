# Change Proposal: mercado-publico-ingestion-backbone

## Why

Twenty does not yet have a production-ready, documented, auditable ingestion backbone for Mercado Publico / ChileCompra data in `twenty-server`.

This change establishes a deployment-local shared backbone inside `twenty-server` for Mercado Publico API and CSV ingestion. It delivers source-preserving raw ingestion, canonical normalization, reconciliation, and internal gold/read contracts. It does not deliver CRM projections, user-facing procurement workflows, or the future Licitaciones UI.

## Preferred Execution Shape

This change should be executed in a phased, action-oriented way:

1. Investigation and untouched-baseline verification only, with no implementation changes.
2. Foundation blockers first: `mp` schema path, typed runtime config, fixture base, and raw persistence seams.
3. First tracer-bullet slice next: one narrow end-to-end path from source ingestion to internal read contract.
4. Source expansion and hardening after that, in dependency order.
5. Full validation and closeout, including the smallest relevant test gates first and CI when appropriate.

The intent is to keep blast radius explicit, implementation grounded in existing repository patterns, and source contracts durable enough that agents do not invent fields, joins, or CSV schemas during implementation.

## Scope

### In

- Deployment-local shared Mercado Publico backbone inside `packages/twenty-server`
- Deployment-local PostgreSQL persistence under static schema `mp`, shared across workspaces within the same installation
- Manually triggerable ingestion processes through existing internal backend infrastructure
- Source coverage:
  - API V1 Licitaciones
  - API V1 Ordenes de Compra
  - API V2 Compra Agil
  - Datos Abiertos CSV Licitaciones
  - Datos Abiertos CSV Ordenes de Compra
- Raw, staging, canonical, reconciliation, and gold/read layers
- API V1 by-date, by-state, and detail-by-code jobs
- API V2 Compra Agil paginated, incremental, and detail-by-code jobs
- CSV download, checksum, decompression when needed, encoding detection, delimiter detection, header capture, raw row preservation, schema fingerprinting, and canonical mapping for validated fields
- Internal read contracts for downstream consumers
- Explicit source-priority and reconciliation rules
- Durable source contract in `docs/business/mercado-publico-source-contract.md`
- Durable domain context in `docs/business/mercado-publico-ingestion-context.md`
- ADR for the static `mp` schema exception
- API and CSV fixtures required for behavior verification
- Traceability, idempotency, quota handling, bounded retry, and structured logging

### Out

- Tenancy changes to Twenty's workspace schema model
- Cross-customer shared control plane behavior or deployment-topology changes
- User-facing UI
- Dashboard or Centro de Comando product surfaces
- `Companies`, `People`, `Opportunities`, or future `Licitaciones` projection logic
- Automatic scheduled execution of Mercado Publico jobs in phase 1
- New public GraphQL, REST, or MCP trigger surfaces for pipeline execution
- Automatic creation of CRM records from Mercado Publico data
- Heuristic auto-promotion of uncertain matches to exact truth
- Currency conversion without an official source
- Treating Compra Agil V2 as a general V2 replacement for API V1

## Decisions

- Twenty remains the native consumer of the backbone.
- `mp` is a deployment-local shared schema, not a workspace schema.
- `mp` is an explicit exception to the default `workspace_<id>` storage model because Mercado Publico is public procurement reference data, not tenant-owned CRM data.
- The `mp` exception is documented in `docs/decisions/0005-deployment-local-mercado-publico-schema.md`.
- Customer-isolated deployments remain valid. Each isolated deployment owns its own `mp` schema.
- This change does not alter the current deployment topology documented for phase 1.
- Raw API payloads, raw CSV files, raw CSV rows, checksums, request params, file metadata, and source lineage must be preserved for auditability.
- Canonical entities must not overwrite a non-null value with `null`.
- API V1 list endpoints are auditable snapshots; API V1 code endpoints are detail rehydrate paths.
- API V1 dates use `ddmmaaaa`.
- Compra Agil V2 is modeled as its own process family.
- Compra Agil V2 `id` and `q` filters are mutually exclusive.
- Compra Agil V2 `tamano_pagina` must not exceed 50 and `numero_pagina` starts at 1.
- Exact joins and source-priority rules are explicit contracts:
  - `orden_compra.CodigoLicitacion = licitacion.CodigoExterno` is the exact licitacion to OC join.
  - `compra_agil.orden_compra.id_orden_compra` or `compra_agil.orden_compra.id_oc` is the exact Compra Agil to OC linkage when present.
  - Recent operational lifecycle state prefers API.
  - Historical completeness and offer evidence prefer CSV after CSV rows are loaded and profiled.
- CSV headers are the operational schema source of truth for downloaded files.
- CSV UI-visible columns are partial reference columns, not a complete dictionary.
- CSV raw rows must preserve unknown columns and exact raw column names.
- CSV raw rows must not enforce business-key uniqueness on `Codigo`, `ID`, `CodigoExterno`, or `Codigoitem`.
- Real June 2026 CSV evidence is treated as observed parsing and fixture evidence, not a universal source guarantee.
- Observed June 2026 CSV files require defensive handling for `latin-1`, `;`, `"` quotechar, comma decimals, null-like raw values, and `1900-01-01` sentinel dates.
- Observed June 2026 CSV grain is item-level for OCs and licitacion + item + supplier/offer for licitaciones.
- Shared source rules must be anchored in `docs/business/mercado-publico-source-contract.md` and `docs/business/mercado-publico-ingestion-context.md`, not only in the OpenSpec.
- The first implementation-facing task must not start until the investigative phase has produced a pattern inventory, blast-radius review, regression checks, and a minimal change plan.
- TDD tasks must describe behavior through module interfaces, read contracts, and persisted outcomes, not private implementation details.
- Architecture work should deepen modules and improve locality rather than add speculative layers.

## Expected Outcome

At the end of this change, the repository has a complete implementation-ready OpenSpec definition for the Mercado Publico ingestion backbone, aligned with the current repository architecture, the documented `mp` schema exception, the official source behavior captured in durable docs, and a verification plan that covers API, CSV, reconciliation, idempotency, quota, fixtures, read contracts, and manual phase-1 operation without requiring scheduled automation.

## Recommended Issue Packaging

If this change is later broken into tracker issues, the preferred mental model is a dependency-ordered slice map rather than a rigid Gantt plan:

1. Foundation blockers
2. First tracer-bullet slice
3. Source expansion slices
4. Cross-cutting hardening
5. Validation and closeout

Use AFK/HITL packaging and explicit `Blocked by` relationships where helpful, but do not force every issue to look like a product user story when the work is infrastructure- or data-backbone-oriented.
