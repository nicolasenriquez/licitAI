# Operar inicio y reanudación de SyncRun

Status: ready-for-human
Blocked by: 27
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Permitir que un operador autorizado inicie y reanude sincronizaciones desde Centro de control mediante órdenes asíncronas idempotentes, auditadas y visibles, sin ejecutar proveedor dentro de la request web.

## Acceptance criteria

- [ ] Sólo operador entra a Centro de control; analista queda denegado también por ruta y resolver directos.
- [ ] Iniciar muestra alcance, exige confirmación y persiste una `idempotencyKey` UUID con actor e intención.
- [ ] Repetir la clave retorna el resultado original y una solicitud compatible retorna la corrida activa.
- [ ] Reanudar una corrida recuperable conserva checkpoints y no exige una confirmación nueva.
- [ ] La UI observa estados, contadores y errores sanitizados; la causa técnica permanece protegida.
- [ ] Ninguna request web consulta directamente al proveedor ni ejecuta la ingesta sincrónicamente.

## Blocked by

- 27 — Entregar Historial y Compradores.

