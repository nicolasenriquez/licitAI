# Docs Index

## Purpose

Use this index to route durable repository documentation work inside `docs/`
without replacing the existing `docs/README.md` baseline.

## Start Here

1. Read `docs/AGENTS.md`.
2. Read `docs/index.md`.
3. Read `docs/README.md` for the durable documentation baseline.
4. Enter the specific docs area relevant to the task.

## Major Areas

| Area | Path | Focus |
| --- | --- | --- |
| Architecture | `architecture/` | Current state, target state, topology, security, repository strategy |
| Business | `business/` | Domain workflows, source contracts, business context |
| Decisions | `decisions/` | Repository ADRs and long-lived architectural choices |
| Design | `design/` | Design system and wireframe guidance |
| Governance | `governance/` | Delivery rules, ownership boundaries, operating model |
| Operations | `operations/` | Command surface, local development, database and Mercado Publico ingestion operations, authoring guidance |
| Standards | `standards/` | Repository documentation and technology standards |
| Templates | `templates/` | ADR and documentation templates |

## Mercado Público reading map

1. [Compra Agil V2 contract for AI agents](business/compra-agil-ai-contract.md)
2. [Compra Agil V2 user and AI extraction guide](operations/mercado-publico-compra-agil-v2-research.md)
3. [Source and ingestion contract](business/mercado-publico-source-contract.md)
4. [Data model boundary](architecture/data-model.md) and
   [ADR 0005](decisions/0005-deployment-local-mercado-publico-schema.md)
5. [Operator runbook](operations/mercado-publico-ingestion.md)

Archived OpenSpec changes provide provenance; they are not current instructions.

## Routing Rule

- Stay in `docs/` for durable repository docs.
- Bounce back through root `index.md` if the task is really an active OpenSpec
  change, package implementation work, or repo-local tooling work.
