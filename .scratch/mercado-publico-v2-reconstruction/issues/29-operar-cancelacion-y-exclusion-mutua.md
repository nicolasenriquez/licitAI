# Operar cancelación y exclusión mutua

Status: done
Source: ../PRD.md
OpenSpec: mercado-publico-v2-sync-operations

## Review (2026-08-13)

Completado. La cancelación cooperativa, el outbox y la exclusión de una
corrida global están implementados y cubiertos por pruebas. G3 reemplaza la
cola de alcances incompatibles con una sola corrida global y recuperación del
outbox.

## What to build

Completar el control operacional con cancelación segura, exclusión de escrituras incompatibles, cola explícita y auditoría íntegra de cada orden e intento.

## Acceptance criteria

- [x] Sólo existe una escritura V2 activa global. G3 no implementa una cola de alcances incompatibles.
- [x] Cancelar una corrida en cola es inmediato; cancelar una activa espera la operación atómica actual.
- [x] La cancelación conserva checkpoint, evidencia confirmada y posibilidad de reintento.
- [x] Inicio, reanudación y cancelación registran actor, acción, intención, alcance, clave, tiempos, corrida e intentos.
- [x] Pruebas concurrentes demuestran exclusión, idempotencia, cancelación cooperativa y denegación al analista.
