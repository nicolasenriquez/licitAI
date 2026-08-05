# Completar presentación accesible y responsive

Status: ready-for-human
Blocked by: 23
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Completar la composición B6 reimplementada con semántica de datos precisa, estados de producto, interacción por teclado y adaptación verificable a escritorio, laptop, móvil, temas y zoom.

## Acceptance criteria

- [ ] La tabla desktop mantiene exactamente cinco columnas y la jerarquía aprobada.
- [ ] Cero, nulo, `unavailable` y `not_applicable` reciben presentaciones distintas y accesibles.
- [ ] Fechas muestran Santiago y acceso a ISO/zona; montos conservan decimal y moneda fuente.
- [ ] Carga, vacío, error, parcial y poblado funcionan en 1440, 1280 y 390, claro y oscuro.
- [ ] Teclado, foco, zoom 200 %, reduced motion y Axe pasan sin ocultar campos silenciosamente.
- [ ] Consola, GraphQL inesperado o llamadas del navegador al proveedor hacen fallar el harness.

## Blocked by

- 23 — Mostrar analítica del universo filtrado.

