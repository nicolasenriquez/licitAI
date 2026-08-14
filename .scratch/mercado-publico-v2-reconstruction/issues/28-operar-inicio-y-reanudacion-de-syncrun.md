# Operar inicio y reanudación de SyncRun

Status: done
Source: ../PRD.md
OpenSpec: mercado-publico-v2-sync-operations

## Review (2026-08-13)

Completado. La prueba de `resume` verifica el contrato real: sólo recibe una
clave de idempotencia y no exige confirmación. Centro de control muestra los
contadores persistidos y un resumen seguro. No expone la causa técnica.

## What to build

Permitir que un operador autorizado inicie y reanude sincronizaciones desde Centro de control mediante órdenes asíncronas idempotentes, auditadas y visibles, sin ejecutar proveedor dentro de la request web.

## Acceptance criteria

- [x] Sólo operador entra a Centro de control; analista queda denegado también por ruta y resolver directos.
- [x] Iniciar muestra alcance, exige confirmación y persiste una `idempotencyKey` UUID con actor e intención.
- [x] Repetir la clave retorna el resultado original y una solicitud compatible retorna la corrida activa.
- [x] Reanudar una corrida recuperable conserva checkpoints y no exige una confirmación nueva.
- [x] La UI observa estados, contadores y errores sanitizados; la causa técnica permanece protegida.
- [x] Ninguna request web consulta directamente al proveedor ni ejecuta la ingesta sincrónicamente.
