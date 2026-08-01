# Historical Documentation Assessment

## Classification

| Material | Classification | Canonical route |
| --- | --- | --- |
| Mercado Público source contract and ingestion context | Current domain guidance | `docs/business/` |
| Deployment-local `mp` schema decision and data model | Current architecture boundary | `docs/architecture/` and ADR 0005 |
| Ingestion procedure | Current operator guidance | `docs/operations/mercado-publico-ingestion.md` |
| Active Mercado Público changes | Change-local implementation work | Their active OpenSpec folders |
| Archived ingestion and command-center changes | Historical evidence and rationale | `openspec/changes/archive/` |

## Reading rule

AI work starts with current durable documentation. Archived changes provide
provenance and rationale only; they are not current instructions. No archived
artifact is rewritten or relocated by this change.

## Result

The Storybook contract remains product-design guidance only. Mercado Público
knowledge keeps its existing business, architecture, and operations routes, so
the new AI adapter does not absorb or reinterpret domain history.
