# Establecer baseline reproducible

Status: done
Blocked by: None
Source: ../PRD.md
OpenSpec: decisión humana pendiente

Completed: 2026-08-06
Evidence: ../research/18-baseline-ledger.md

## What to build

Preparar una base ejecutable desde `main` que conserve únicamente el salvamento aprobado, proteja la ruta V2 completa con una bandera local y permita levantar y comprobar el producto mediante Docker Compose y autenticación real.

## Acceptance criteria

- [x] La procedencia desde `main` y cada elemento salvado quedan registrados y verificables.
- [x] La bandera alterna rutas completas sin mezclar composiciones en una misma superficie.
- [x] El entorno desechable provisiona fixtures e identidades de analista y operador sin secretos versionados.
- [x] Un smoke autenticado demuestra baseline verde y conserva evidencia diagnóstica.
- [x] Existe rollback explícito para desactivar esta base sin alterar datos existentes.

Gate 0 complete. Full V2 product slices remain tracked in issues 19–35.

## Blocked by

- None — can start immediately.
