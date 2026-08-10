# Fijar contrato real de detalle V2

Status: needs-info
Blocked by: 24
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Inspeccionar evidencia autorizada del endpoint real de detalle V2 y convertirla en un contrato verificable de campos, relaciones, claves, nulabilidad y variaciones antes de construir Slice 4.

## Acceptance criteria

- [ ] El acceso, propósito y tratamiento de datos reales cuentan con autorización explícita.
- [ ] Se capturan fixtures sanitizados representativos, incluidos arrays grandes, ausencias y variantes observadas.
- [ ] Cada relación hija usa clave estable del proveedor o fallback documentado de ordinal más checksum.
- [ ] Se documentan tipos, nulabilidad, fechas, moneda, estados y discrepancias sin inventar campos.
- [ ] El manifest de fixtures y las expectativas de normalización quedan versionados y revisables.

## Blocked by

- 24 — Completar presentación accesible y responsive.
- External gate — evidencia real autorizada del endpoint V2 de detalle.

## Progress

- 2026-08-10 — Inicio de ejecución: se verificó el ticket. El acceso explícitamente autorizado, el propósito, el alcance de códigos/volumen y las reglas de sanitización siguen sin estar registrados; no se consultó el endpoint ni se infirió el contrato desde mocks o fixtures. Ticket permanece bloqueado.
