# Establecer baseline reproducible

Status: ready-for-human
Blocked by: None
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Preparar una base ejecutable desde `main` que conserve únicamente el salvamento aprobado, proteja la ruta V2 completa con una bandera local y permita levantar y comprobar el producto mediante Docker Compose y autenticación real.

## Acceptance criteria

- [ ] La procedencia desde `main` y cada elemento salvado quedan registrados y verificables.
- [ ] La bandera alterna rutas completas sin mezclar composiciones en una misma superficie.
- [ ] El entorno desechable provisiona fixtures e identidades de analista y operador sin secretos versionados.
- [ ] Un smoke autenticado demuestra baseline verde y conserva evidencia diagnóstica.
- [ ] Existe rollback explícito para desactivar esta base sin alterar datos existentes.

## Blocked by

- None — can start immediately.

