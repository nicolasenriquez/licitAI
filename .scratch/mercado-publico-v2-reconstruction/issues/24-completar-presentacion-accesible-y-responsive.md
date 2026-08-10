# Completar presentación accesible y responsive

Status: done
Completed: 2026-08-09
Evidence: `npx playwright test tests/mercado-publico --project=chrome`
Blocked by: 23
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Completar la composición B6 reimplementada con semántica de datos precisa, estados de producto, interacción por teclado y adaptación verificable a escritorio, laptop, móvil, temas y zoom.

## Acceptance criteria

- [x] La tabla desktop mantiene exactamente cinco columnas y la jerarquía aprobada.
- [x] Cero, nulo, `unavailable` y `not_applicable` reciben presentaciones distintas y accesibles.
- [x] Fechas muestran Santiago y acceso a ISO/zona; montos conservan decimal y moneda fuente.
- [x] Carga, vacío, error, parcial y poblado funcionan en 1440, 1280 y 390, claro y oscuro.
- [x] Teclado, foco, zoom 200 %, reduced motion y Axe pasan sin ocultar campos silenciosamente.
- [x] Consola, GraphQL inesperado o llamadas del navegador al proveedor hacen fallar el harness.

## Blocked by

- 23 — Mostrar analítica del universo filtrado.

## Progress

- 2026-08-09: Resumed implementation; reproducing remaining preview-harness failures for URL panel restoration and unavailable-data assertions.
- 2026-08-08: Started implementation; tracing V2 page, filters, read contracts, and existing accessibility/test seams.
- 2026-08-08: Added explicit source-value states, Santiago time/ISO semantics, state and llamado context, responsive mobile row stacking, focus rings, form keyboard submit, retryable load/error states, and diagnostics/Axe checks to the V2 harness.
- 2026-08-08: Focused URL Jest passed 3/3; changed frontend oxlint and oxfmt checks passed; Playwright test discovery passed.
- 2026-08-08: Live Playwright validation blocked by `ERR_CONNECTION_REFUSED` at `http://localhost:3001`; frontend typecheck/build remain blocked by pre-existing missing role-permission modules outside this change.
- 2026-08-08: Resumed implementation with Docker Compose green; expanding state, viewport, theme, keyboard, zoom, reduced-motion, Axe, and request-diagnostics coverage.
- 2026-08-09: Fixed URL-to-panel race during click/keyboard opening, regenerated Lingui catalogs, and scoped duplicate-title assertion to its fixture row.
- 2026-08-09: Validated `npx playwright test tests/mercado-publico --project=chrome`: 14 passed, 1 expected non-flagged-build skip; coverage includes state, viewport/theme, accessibility, and request diagnostics. `oxfmt --check`, direct type-aware `oxlint`, and `git diff --check` passed. `npx nx typecheck twenty-front` remains blocked by pre-existing implicit-any errors in `src/modules/front-components/hooks/useFrontComponentExecutionContext.ts`.
