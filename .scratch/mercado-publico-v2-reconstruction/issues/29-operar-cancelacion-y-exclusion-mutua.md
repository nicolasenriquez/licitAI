# Operar cancelación y exclusión mutua

Status: ready-for-human
Blocked by: 28
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Completar el control operacional con cancelación segura, exclusión de escrituras incompatibles, cola explícita y auditoría íntegra de cada orden e intento.

## Acceptance criteria

- [ ] Sólo existe una escritura V2 activa por alcance global y los alcances incompatibles quedan en cola.
- [ ] Cancelar una corrida en cola es inmediato; cancelar una activa espera la operación atómica actual.
- [ ] La cancelación conserva checkpoint, evidencia confirmada y posibilidad de reintento.
- [ ] Inicio, reanudación y cancelación registran actor, acción, intención, alcance, clave, tiempos, corrida e intentos.
- [ ] Pruebas concurrentes demuestran exclusión, idempotencia, cancelación cooperativa y denegación al analista.

## Blocked by

- 28 — Operar inicio y reanudación de SyncRun.

