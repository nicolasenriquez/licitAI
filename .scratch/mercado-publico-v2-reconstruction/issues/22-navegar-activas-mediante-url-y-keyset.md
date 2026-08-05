# Navegar Activas mediante URL y keyset

Status: ready-for-human
Blocked by: 21
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Permitir que el analista busque, filtre, ordene y recorra Activas desde el servidor, conservando en la URL un contexto compartible y restaurable.

## Acceptance criteria

- [ ] Texto, cohorte, estado, organismo/RUT, región, fechas, documentos, llamado, monto y moneda se filtran en servidor.
- [ ] Orden y paginación keyset son estables y limitan cada página a 100 filas.
- [ ] La URL representa superficie, búsqueda, filtros, orden, cursor y proceso seleccionado.
- [ ] Deep links y Back/Forward restauran listado y SidePanel; Back cierra primero el panel.
- [ ] Rangos inválidos fallan como entrada, cero filas es normal y cursor inválido vuelve al inicio con aviso accesible.

## Blocked by

- 21 — Preservar evidencia, historial y replay.

