# Hacer durable descubrimiento e hidratación

Status: done
Blocked by: 19
Source: ../PRD.md
OpenSpec: decisión humana pendiente

Completed: 2026-08-06
Evidence: packages/twenty-server/test/integration/mercado-publico/suites/v2-durable-sync.integration-spec.ts (5 db-backed tests: frozen pages/cohort, pending-only resume, rediscovery, projection preservation, systemic failure); focused V2 Jest (24 tests); v2-golden-path.integration-spec.ts (3 db-backed tests)

## What to build

Convertir descubrimiento e hidratación V2 en una corrida durable que congele cohortes, checkpointée progreso y se recupere sin perder oportunidades ni avanzar una marca de agua incompleta.

## Acceptance criteria

- [x] Sólo `publicada` entra por descubrimiento inicial y las incorporadas siguen el ciclo de vida definido.
- [x] Cohorte, páginas y oportunidades quedan congeladas y checkpointadas por `SyncRun`.
- [x] Reanudar procesa pendientes; redescubrir crea una corrida distinta.
- [x] Un fallo de detalle preserva la última proyección válida y produce `partial_failed`; un fallo sistémico falla la corrida.
- [x] Estados desconocidos o discordantes permanecen observables y no terminalizan automáticamente.
- [x] La marca de agua avanza únicamente tras completar confiablemente la corrida.

## Blocked by

- 19 — Entregar camino dorado V2.
