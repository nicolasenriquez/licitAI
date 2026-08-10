# Entregar camino dorado V2

Status: done
Blocked by: 18
Source: ../PRD.md
OpenSpec: decisión humana pendiente

Completed: 2026-08-06
Evidence: packages/twenty-server/test/integration/mercado-publico/suites/v2-golden-path.integration-spec.ts (3 db-backed tests executed: fixture golden path + schema rollback compatible + rollback refusal; serial suite run 6/6 pass, 38 tests)

## What to build

Hacer que una oportunidad V2 sanitizada atraviese una ejecución durable, preserve evidencia y proyección, aparezca en Activas mediante GraphQL keyset y pueda abrirse en un SidePanel sin perder el listado.

## Acceptance criteria

- [x] Un fixture entra por el mismo `SyncRun` y normalizador que usará producción.
- [x] La observación, evidencia, proyección actual y procedencia son consultables y coherentes.
- [x] `mercadoPublicoV2` devuelve una conexión keyset estable con `codigo` como desempate.
- [x] Un analista autenticado ve la fila de cinco columnas y abre/cierra su detalle preservando foco y contexto.
- [x] Pruebas de integración y Playwright cubren el recorrido completo y el rollback de schema.

## Blocked by

- 18 — Establecer baseline reproducible.

