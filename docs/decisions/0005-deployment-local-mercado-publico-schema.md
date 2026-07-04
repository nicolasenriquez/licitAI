---
type: decision
title: "Deployment-Local Mercado Publico Schema"
description: "Architecture decision record for Deployment-Local Mercado Publico Schema."
okf_version: "0.1"
---
# Deployment-Local Mercado Publico Schema

## Status
Accepted (2026-06-20)

## Date
2026-06-20

## Purpose
Document why Mercado Publico ingestion uses a static deployment-local PostgreSQL schema instead of per-workspace CRM schemas.

## Primary Audience
Backend engineers, data engineers, architects, reviewers, and AI agents working on Mercado Publico ingestion.

## Executive Summary
Mercado Publico data is public procurement reference data shared by all workspaces inside a single installation. It should be stored once per deployment under a static `mp` schema, then exposed through internal read contracts and later projected into workspace CRM records only when a product workflow requires it.

## Context
Twenty's default data model isolates tenant-owned CRM records in `workspace_<id>` schemas generated from metadata. That model remains correct for Companies, People, Opportunities, tasks, notes, and user-defined objects.

Mercado Publico ingestion has a different shape:

- The source corpus is public reference data, not tenant-owned CRM data.
- Multiple workspaces in the same isolated deployment may need to read the same licitaciones, ordenes de compra, Compra Agil processes, and CSV historical evidence.
- Raw source preservation, file lineage, reconciliation, and gold/read views need stable DDL and explicit constraints.
- Duplicating the corpus into every workspace would increase storage, ingestion cost, reconciliation noise, and schema churn.

## Decision
Create a static PostgreSQL schema named `mp` for Mercado Publico ingestion data.

Rules:

- `mp` is deployment-local. Each isolated customer deployment owns its own `mp` schema.
- `mp` stores public procurement source data, canonical entities, reconciliation rows, and gold/read objects.
- `mp` must not store tenant-owned CRM records.
- `mp` must not bypass workspace authorization for future user-facing access. Workspace-facing features must go through internal read contracts or explicit projections.
- All `mp` DDL must be created through reversible, idempotent instance commands.
- Raw API payloads, CSV files, CSV rows, request metadata, checksums, and source lineage must be preserved before normalization.
- CRM projections into `Companies`, `People`, `Opportunities`, or future `Licitaciones` UI are separate follow-up changes.

## Consequences

### Positive
- Avoids duplicating the public source corpus across workspaces.
- Keeps Mercado Publico ingestion independent from dynamic workspace metadata.
- Makes raw-first lineage, reconciliation, and replay behavior easier to verify.
- Keeps future CRM projections explicit instead of silently coupling source ingestion to product workflows.

### Costs
- Introduces one documented static schema exception in a codebase that otherwise prefers per-workspace dynamic schemas.
- Requires reviewers to verify that no tenant-owned CRM data leaks into `mp`.
- Requires internal read contracts to avoid coupling consumers to raw persistence tables.

### Constraints
- The exception is not reusable for other domains without a new ADR.
- Cross-workspace customer data queries remain disallowed.
- Any user-facing read path must enforce the same workspace authorization expectations as the rest of Twenty.

## Alternatives Considered

### Store Mercado Publico data in every `workspace_<id>` schema
- **What**: Duplicate ingested licitaciones, OCs, Compra Agil processes, and CSV evidence into each workspace.
- **Why rejected**: This duplicates a public corpus, increases ingestion and reconciliation cost, and couples source ingestion to tenant-specific CRM workflows too early.

### Store Mercado Publico as dynamic metadata objects
- **What**: Model source entities as Twenty custom objects generated from metadata.
- **Why rejected**: Raw lineage, CSV schema drift, source-specific reconciliation, and source replay need stable operational tables. Product-facing objects can still be projected later.

### Use ClickHouse as the primary Mercado Publico store
- **What**: Store the ingestion backbone in ClickHouse because the corpus may become analytical.
- **Why rejected**: ClickHouse is optional in the current platform. The backbone needs to work in the default PostgreSQL deployment and support transactional reconciliation state.

## Related Documents
- `docs/business/mercado-publico-ingestion-context.md` — Domain source and reconciliation context.
- `docs/business/mercado-publico-source-contract.md` — Source-level API and CSV contract.
- `docs/architecture/data-model.md` — Data model and schema boundaries.
- `docs/operations/data-operations.md` — Database operation rules.
- `openspec/changes/mercado-publico-ingestion-backbone/` — Implementation change definition.
- `openspec/changes/mercado-publico-ingestion-backbone/schema-catalog.md` — Binding column-level SQL schema for the `mp` tables.
