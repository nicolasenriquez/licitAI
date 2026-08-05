# Retirar servicios V1 y CSV desplazados

Status: ready-for-human
Blocked by: 33
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Retirar al final los servicios V1/CSV y migraciones no adoptadas cuya sustitución V2 y ausencia de consumidores hayan sido demostradas, preservando toda evidencia pública válida.

## Acceptance criteria

- [ ] Grafo, imports, jobs, CLI, scheduler, GraphQL y búsquedas demuestran cero consumidores activos.
- [ ] Ninguna evidencia V2 se borra ni se transforma durante el retiro.
- [ ] Migraciones comprometidas no se editan; cualquier transición necesaria usa comandos nuevos, inmutables, con `up` y `down`.
- [ ] Scheduler, CLI, API, pruebas de persistencia y smoke autenticado quedan verdes sin V1/CSV.
- [ ] El rollback operativo y la recuperación de datos permanecen documentados y ensayables.

## Blocked by

- 33 — Retirar prototipos, stories y estilos desplazados.

