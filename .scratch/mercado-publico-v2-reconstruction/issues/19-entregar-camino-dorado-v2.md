# Entregar camino dorado V2

Status: ready-for-human
Blocked by: 18
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Hacer que una oportunidad V2 sanitizada atraviese una ejecución durable, preserve evidencia y proyección, aparezca en Activas mediante GraphQL keyset y pueda abrirse en un SidePanel sin perder el listado.

## Acceptance criteria

- [ ] Un fixture entra por el mismo `SyncRun` y normalizador que usará producción.
- [ ] La observación, evidencia, proyección actual y procedencia son consultables y coherentes.
- [ ] `mercadoPublicoV2` devuelve una conexión keyset estable con `codigo` como desempate.
- [ ] Un analista autenticado ve la fila de cinco columnas y abre/cierra su detalle preservando foco y contexto.
- [ ] Pruebas de integración y Playwright cubren el recorrido completo y el rollback de schema.

## Blocked by

- 18 — Establecer baseline reproducible.

