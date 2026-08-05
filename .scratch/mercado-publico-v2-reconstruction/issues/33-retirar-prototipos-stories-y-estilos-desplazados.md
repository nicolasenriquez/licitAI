# Retirar prototipos, stories y estilos desplazados

Status: ready-for-human
Blocked by: 32
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Eliminar prototipos, stories, estilos y artefactos visuales desplazados después de demostrar que ningún consumidor productivo o prueba vigente depende de ellos.

## Acceptance criteria

- [ ] Grafo, imports y búsquedas demuestran cero consumidores antes de cada eliminación.
- [ ] No se eliminan primitives, tokens ni patrones Twenty aún usados por otros productos.
- [ ] Stories y fixtures que sigan aportando evidencia estable se migran antes de retirar su origen.
- [ ] Pruebas visuales, accesibilidad y smoke autenticado confirman que la composición V2 no cambia accidentalmente.
- [ ] El diff registra claramente qué evidencia histórica se conserva y qué código queda retirado.

## Blocked by

- 32 — Retirar consumidores UI y GraphQL desplazados.

