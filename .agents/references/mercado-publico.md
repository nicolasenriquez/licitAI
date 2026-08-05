# Mercado Público reference

Mercado Público lives in `packages/twenty-server/src/engine/core-modules/mercado-publico/`.
It ingests API V1 licitaciones and purchase orders plus API V2 Compra Ágil,
then moves evidence through raw, canonical, reconciliation, and gold/read
layers. The system records public procurement reference data in the static
deployment-local PostgreSQL `mp` schema; workspace CRM data remains dynamically
generated in `workspace_<id>` schemas.

Keep API tickets and local configuration in `packages/twenty-docker/.env`.
Do not hardcode tickets or commit that file. Preserve raw source evidence and
its observed shape; canonical projections may normalize only with explicit
rules. Reconciliation must not assume one tender maps to one purchase order.

The active command-center contract is read-only. Do not introduce public
ingestion, retry, scheduling, or mutation controls without an approved OpenSpec
change. Consult `docs/business/mercado-publico-source-contract.md` for source
semantics and the relevant active OpenSpec artifacts for implementation scope.
