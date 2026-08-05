# Mostrar analítica del universo filtrado

Status: ready-for-human
Blocked by: 22
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Mostrar resumen factual y analítica secundaria calculados sobre la población completa seleccionada por los mismos filtros de Activas, sin fabricar métricas desde la página visible.

## Acceptance criteria

- [ ] Listado y analytics comparten exactamente el contrato de filtros de negocio.
- [ ] Cursor, página y orden no cambian métricas ni buckets.
- [ ] Respuestas incluyen población, hora de cálculo, frescura, completitud y disponibilidad.
- [ ] La UI diferencia resultados completos, parciales y no disponibles sin inventar cifras.
- [ ] Integración con base de datos demuestra coherencia entre población filtrada, `totalCount` y agregados.

## Blocked by

- 22 — Navegar Activas mediante URL y keyset.

