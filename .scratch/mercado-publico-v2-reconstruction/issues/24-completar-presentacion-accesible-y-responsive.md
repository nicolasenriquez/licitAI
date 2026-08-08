# Completar presentación accesible y responsive

Status: ready-for-human
Blocked by: 23
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Completar la composición B6 reimplementada con semántica de datos precisa, estados de producto, interacción por teclado y adaptación verificable a escritorio, laptop, móvil, temas y zoom.

## Acceptance criteria

- [x] La tabla desktop mantiene exactamente cinco columnas y la jerarquía aprobada.
- [x] Cero, nulo, `unavailable` y `not_applicable` reciben presentaciones distintas y accesibles.
- [x] Fechas muestran Santiago y acceso a ISO/zona; montos conservan decimal y moneda fuente.
- [ ] Carga, vacío, error, parcial y poblado funcionan en 1440, 1280 y 390, claro y oscuro.
- [ ] Teclado, foco, zoom 200 %, reduced motion y Axe pasan sin ocultar campos silenciosamente.
- [ ] Consola, GraphQL inesperado o llamadas del navegador al proveedor hacen fallar el harness.

## Blocked by

- 23 — Mostrar analítica del universo filtrado.

## Progress

- 2026-08-08: Started implementation; tracing V2 page, filters, read contracts, and existing accessibility/test seams.
- 2026-08-08: Added explicit source-value states, Santiago time/ISO semantics, state and llamado context, responsive mobile row stacking, focus rings, form keyboard submit, retryable load/error states, and diagnostics/Axe checks to the V2 harness.
- 2026-08-08: Focused URL Jest passed 3/3; changed frontend oxlint and oxfmt checks passed; Playwright test discovery passed.
- 2026-08-08: Live Playwright validation blocked by `ERR_CONNECTION_REFUSED` at `http://localhost:3001`; frontend typecheck/build remain blocked by pre-existing missing role-permission modules outside this change.
