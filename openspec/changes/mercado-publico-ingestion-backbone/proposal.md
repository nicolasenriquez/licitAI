# Change Proposal: mercado-publico-ingestion-backbone

## Why

Twenty already has a placeholder Mercado Publico module path, but it does not yet have a production-ready, documented, auditable ingestion backbone for Mercado Publico data in `twenty-server`.

This change establishes a deployment-local shared backbone inside `twenty-server` for Mercado Publico API ingestion and CSV-ready persistence contracts. It does not yet deliver historical CSV execution, CRM projections, or customer-facing procurement workflows.

## Preferred Execution Shape

This change should be executed in a phased, action-oriented way:

1. Investigation only, with no implementation changes.
2. Test design first, following TDD and fail-fast verification discipline.
3. Minimal implementation by layer, with database and backend seams kept small and deep.
4. Full validation, including the smallest relevant test gates first and CI when appropriate.
5. Closeout with documentation and changelog review.

The intent is to keep the blast radius explicit, the seams well understood, and the implementation surgical, professional, and aligned with established repository patterns.

## Scope

### In

- Deployment-local shared Mercado Publico backbone inside `packages/twenty-server`
- Deployment-local PostgreSQL persistence under static schema `mp`, shared across workspaces within the same installation
- API-executable plus CSV-ready ingestion contracts
- Source coverage:
  - API V1 Licitaciones
  - API V1 Ordenes de Compra
  - API V2 Compra Agil
- Raw, staging, canonical, reconciliation, and gold/read layers
- Internal read contracts for downstream consumers
- Explicit source-priority and reconciliation rules
- State-based polling, detail rehydrate, and incremental job catalog
- Durable domain context in `docs/business/mercado-publico-ingestion-context.md`
- Traceability, idempotency, and quota handling

### Out

- Tenancy changes to Twenty's workspace schema model
- Cross-customer shared control plane behavior or deployment-topology changes
- User-facing UI
- Dashboard or Centro de Comando product surfaces
- `Companies`, `People`, `Opportunities`, or future `Licitaciones` projection logic
- CSV download, decompression, parsing, or historical batch normalization execution
- Date-based V1 sweep jobs for this phase

## Decisions

- Twenty remains the native consumer of the backbone.
- `mp` is a deployment-local shared schema, not a workspace schema.
- `mp` is an explicit exception to the default `workspace_<id>` storage model because Mercado Publico corpus is public shared reference data, not tenant-owned CRM records.
- Customer-isolated deployments remain valid. Each isolated deployment owns its own `mp` schema.
- This change does not alter the current deployment topology documented for phase 1.
- Raw payloads must be preserved for auditability.
- Canonical entities must not overwrite a non-null value with `null`.
- Exact joins and source-priority rules are explicit contracts:
  - `orden_compra.CodigoLicitacion = licitacion.CodigoExterno` is the exact licitacion to OC join.
  - `compra_agil.id_orden_compra` or `compra_agil.id_oc` is the exact Compra Agil to OC linkage when present.
  - Recent operational lifecycle state prefers API.
  - Historical completeness and offer evidence prefer CSV when CSV execution lands.
- CSV remains contract-ready only in this phase. Historical completeness from CSV is intentionally deferred to a follow-up change.
- The minimum required operational surface in this phase is:
  - state-based V1 polling
  - detail rehydrate
  - Compra Agil incremental polling
  - reconciliation refresh
- Date-based V1 jobs are explicitly deferred for this phase.
- Shared domain rules must be anchored in `docs/business/mercado-publico-ingestion-context.md`, not only in the OpenSpec.
- The first implementation-facing task must not start until the investigative phase has produced a pattern inventory, blast-radius review, regression seams, and a minimal change plan.
- TDD tasks must describe behavior through the module interface, not internal implementation details.
- Architecture work should deepen modules and improve locality rather than add speculative layers.

## Expected Outcome

At the end of this change, the repository has a complete OpenSpec definition for the Mercado Publico ingestion backbone, aligned with the current repository architecture, phase-1 deployment posture, and a durable business/domain context document for follow-up implementation work.
