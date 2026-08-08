# Mostrar analítica del universo filtrado

Status: done
Completed: 2026-08-08
Evidence: `packages/twenty-server/src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service.ts`, `packages/twenty-front/src/pages/mercado-publico/MercadoPublicoV2ActivePage.tsx`, `packages/twenty-server/test/integration/mercado-publico/suites/v2-activas-filter-keyset.integration-spec.ts`, focused Jest and direct oxlint/oxfmt commands
Blocked by: 22
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Mostrar resumen factual y analítica secundaria calculados sobre la población completa seleccionada por los mismos filtros de Activas, sin fabricar métricas desde la página visible.

## Acceptance criteria

- [x] Listado y analytics comparten exactamente el contrato de filtros de negocio.
- [x] Cursor, página y orden no cambian métricas ni buckets.
- [x] Respuestas incluyen población, hora de cálculo, frescura, completitud y disponibilidad.
- [x] La UI diferencia resultados completos, parciales y no disponibles sin inventar cifras.
- [x] Integración con base de datos demuestra coherencia entre población filtrada, `totalCount` y agregados.

## Blocked by

- 22 — Navegar Activas mediante URL y keyset.

## Progress

- 2026-08-08: Started implementation; tracing existing V2 filter, listing, count, and analytics seams.
- 2026-08-08: Added full-population analytics through shared server filters, metadata, coverage, and secondary buckets; added truthful UI states and GraphQL fixtures.
- 2026-08-08: Focused server unit tests passed 11/11; DB-backed V2 filters/keyset/analytics passed 9/9; frontend URL tests passed 3/3; direct lint and format checks passed.
- 2026-08-08: GraphQL codegen could not reach `http://localhost:3000/graphql`; Playwright setup could not reach `http://localhost:3001`; runtime browser validation remains local-environment gated.
- 2026-08-08: Implementation complete; all acceptance criteria marked done.
