# Hacer durable descubrimiento e hidratación

Status: ready-for-human
Blocked by: 19
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Convertir descubrimiento e hidratación V2 en una corrida durable que congele cohortes, checkpointée progreso y se recupere sin perder oportunidades ni avanzar una marca de agua incompleta.

## Acceptance criteria

- [ ] Sólo `publicada` entra por descubrimiento inicial y las incorporadas siguen el ciclo de vida definido.
- [ ] Cohorte, páginas y oportunidades quedan congeladas y checkpointadas por `SyncRun`.
- [ ] Reanudar procesa pendientes; redescubrir crea una corrida distinta.
- [ ] Un fallo de detalle preserva la última proyección válida y produce `partial_failed`; un fallo sistémico falla la corrida.
- [ ] Estados desconocidos o discordantes permanecen observables y no terminalizan automáticamente.
- [ ] La marca de agua avanza únicamente tras completar confiablemente la corrida.

## Blocked by

- 19 — Entregar camino dorado V2.

