## 1. Reconciliação observable

- [x] 1.1 Persistir `stg_job_run` success/failed alrededor de `reconciliation-refresh` y relanzar el error original.
- [x] 1.2 Mantener `requestedBy` tipado como `command | schedule` y cubrir command/schedule en el payload del executor.

## 2. Scheduler BullMQ

- [x] 2.1 Implementar el cron command/job diario que solo encola `MercadoPublicoJob` con `requestedBy: schedule`.
- [x] 2.2 Registrar el cron en `CronRegisterAllCommand`, agregar providers/módulos requeridos y usar el job ID estable.
- [x] 2.3 Agregar pruebas de registro idempotente, cadencia de 24 horas y delegación al domain queue.

## 3. Materialización gold

- [x] 3.1 Incluir `compra_agil` en unmatched y usar el mapping de fuente API V2 específico.
- [x] 3.2 Reemplazar el writer gold por una materialización set-based de licitaciones, órdenes de compra y Compra Ágil.
- [x] 3.3 Aplicar precedencia `exact > candidate > unmatched > null`, preservar nulls y actualizar sin deletes ni retroceso de `last_seen_at`.
- [x] 3.4 Renombrar la métrica interna a `goldProcessesMaterialized` y agregar cobertura de filas, estados, nulls e idempotencia.

## 4. Validación y entrega

- [x] 4.1 Ejecutar pruebas enfocadas de Mercado Público, lint diff y typecheck de `twenty-server`.
- [x] 4.2 Validar el cambio con `openspec validate` y revisar el diff para excluir migraciones, dependencias y UI fuera de alcance.
- [x] 4.3 Documentar el backfill operacional único y los queries de verificación en el runbook del cambio.
