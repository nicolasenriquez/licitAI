# Preservar evidencia, historial y replay

Status: done
Completed: 2026-08-07
Blocked by: 20
Source: ../PRD.md
OpenSpec: decisión humana pendiente
Evidence: test/integration/mercado-publico/suites/v2-evidence-history-replay.integration-spec.ts (24/24 DB-backed V2 tests green)

## What to build

Conservar cada interacción aceptada con el proveedor como evidencia trazable e inmutable, derivar historial sólo ante cambios semánticos y reconstruir proyecciones faltantes mediante replay idempotente.

## Acceptance criteria

- [x] Payloads iguales comparten blob por checksum, pero cada request aceptado crea una observación nueva.
- [x] Evidencia, staging, `current`, `history` e hijos mantienen referencias de procedencia.
- [x] Sólo un cambio semántico añade historial con before/after y observaciones de origen.
- [x] Dedupe distingue `codigo`, cambio del proveedor y hash incluso con timestamps defectuosos.
- [x] Replay y backfill desde evidencia retenida crean faltantes sin consultar nuevamente al proveedor.
- [x] Nulo, vacío, cero, decimal, moneda y las tres clases de tiempo sobreviven sin pérdida semántica.

## Blocked by

- 20 — Hacer durable descubrimiento e hidratación.

## Progress

- 2026-08-07 — Implementado evidencia/historial/replay:
  - Migración `2-16-instance-command-fast-1787000000000-mp-v2-evidence-history-replay` (up/down reversible): elimina la dedupe de observaciones (`uq_mp_v2_observation_run_code_checksum`), agrega procedencia a `v2_observation` (source, endpoint, snapshot_kind, request_fingerprint, provider_changed_at_raw/at, semantic_fingerprint), `observation_id` + `amount_raw` en staging, `amount_raw` + `semantic_fingerprint` en current y gold, tabla append-only `mp.v2_history` (before/after JSON, fingerprint antes/después, observaciones previa/nueva) y tabla genérica `mp.v2_child_evidence` (clave proveedor o ordinal + checksum) para arrays conocidos del detalle.
  - `MercadoPublicoV2ProjectionService` (nuevo): seam transaccional `ingest`/`reproject`; upsert con guarda de staleness sin `COALESCE` (null/vacío/cero distintos), fingerprint semántico, historial sólo ante cambio semántico, proyección de hijos con procedencia y link de staging → observación.
  - `MercadoPublicoV2EvidenceReplayService` (nuevo): `replay(syncRunId)` y `backfill(scope)` desde evidencia retenida, sin dependencia del cliente del proveedor, idempotentes, no tocan el watermark.
  - `MercadoPublicoV2DurableSyncService` delega la proyección al nuevo seam; staging persiste `amount_raw`.
  - Normalización V2: cadena vacía se preserva distinta de `null` (title, estado, buyer, moneda, fecha cruda, decimal exacto).
  - Validación: 465 tests unitarios pasan; `tsgo` limpio en archivos tocados; `oxlint`/`oxfmt` limpios; 24/24 tests DB-backed verdes (suite nueva `v2-evidence-history-replay` con un caso por criterio + suites `v2-durable-sync` y `v2-golden-path` actualizadas).
- 2026-08-07 — Correcciones encontradas por validación DB real: `ADD CONSTRAINT IF NOT EXISTS` inválido en PostgreSQL (quitado), `paramIndex += 30` vs 29 placeholders en staging V2 (corregido a `+= 29`), helper de test generaba fingerprints idénticos entre respuestas distintas (dedupe de blob colapsaba observaciones; ahora derivados del contenido), test pre-existente de la suite durable con escenario contradictorio a la semántica `hydrate` (reescrito con mezcla éxito/fallo), orden de filas del query de scalares alineado a `ORDER BY codigo`.
  - Comando de validación: `cd packages/twenty-server && npx jest --config jest-integration.config.ts "v2-evidence-history-replay|v2-durable-sync|v2-golden-path"` (requiere Postgres en `PG_DATABASE_URL`; el `globalSetup` estándar falla por archivo upstream faltante pre-existente).



