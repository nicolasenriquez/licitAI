# Activar cutover reversible

Status: ready-for-human
Blocked by: 29
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Cambiar de forma controlada la ruta completa hacia la reconstrucción V2, mantener temporalmente el camino anterior y demostrar que la bandera permite rollback inmediato sin perder evidencia `mp`.

## Acceptance criteria

- [ ] La bandera conmuta la ruta completa y no mezcla implementaciones en una misma vista.
- [ ] Ruta nueva y anterior pasan smoke autenticado antes del cambio.
- [ ] El rollback se ensaya y restaura el camino anterior sin transformar ni borrar evidencia V2.
- [ ] Métricas, logs, estado de corridas y procedimiento operativo permiten detectar y explicar una reversión.
- [ ] Ningún consumidor anterior se retira todavía.

## Blocked by

- 29 — Operar cancelación y exclusión mutua.

