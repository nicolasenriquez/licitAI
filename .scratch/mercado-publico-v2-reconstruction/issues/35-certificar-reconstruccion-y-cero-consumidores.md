# Certificar reconstrucción y cero consumidores

Status: ready-for-human
Blocked by: 34
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Cerrar la reconstrucción con evidencia consolidada de comportamiento, reversibilidad y cero consumidores del legado retirado, dejando enlazados los artefactos históricos sin convertirlos nuevamente en autoridad activa.

## Acceptance criteria

- [ ] Grafo, búsqueda de repositorio, tests, smoke autenticado y diff visual confirman cero consumidores desplazados.
- [ ] Todas las migraciones nuevas demuestran `up` y `down`; GraphQL/codegen y consumidores pasan compatibilidad final.
- [ ] El harness completo vuelve a pasar después del retiro y conserva sus artefactos revisados.
- [ ] La documentación identifica PRD, tickets, decisiones OpenSpec y evidencia operativa como autoridades de ejecución.
- [ ] El OpenSpec anterior se conserva enlazado como evidencia y sólo se marca `superseded` cuando la autoridad humana correspondiente lo aprueba.
- [ ] No queda trabajo de reconstrucción asignado al OpenSpec anterior.

## Blocked by

- 34 — Retirar servicios V1 y CSV desplazados.

