# Preservar evidencia, historial y replay

Status: ready-for-human
Blocked by: 20
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Conservar cada interacción aceptada con el proveedor como evidencia trazable e inmutable, derivar historial sólo ante cambios semánticos y reconstruir proyecciones faltantes mediante replay idempotente.

## Acceptance criteria

- [ ] Payloads iguales comparten blob por checksum, pero cada request aceptado crea una observación nueva.
- [ ] Evidencia, staging, `current`, `history` e hijos mantienen referencias de procedencia.
- [ ] Sólo un cambio semántico añade historial con before/after y observaciones de origen.
- [ ] Dedupe distingue `codigo`, cambio del proveedor y hash incluso con timestamps defectuosos.
- [ ] Replay y backfill desde evidencia retenida crean faltantes sin consultar nuevamente al proveedor.
- [ ] Nulo, vacío, cero, decimal, moneda y las tres clases de tiempo sobreviven sin pérdida semántica.

## Blocked by

- 20 — Hacer durable descubrimiento e hidratación.

