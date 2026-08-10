# Entregar investigación detallada

Status: ready-for-human
Dependency: 25 (done)
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Permitir investigar una oportunidad desde el SidePanel con detalle estructurado, relaciones reales paginadas, ciclo de vida, procedencia y acceso explícito a un payload sanitizado.

## Acceptance criteria

- [x] El detalle presenta identidad, estado, llamado, fechas, monto, necesidad, entrega y comprador según el contrato confirmado.
- [x] Documentos, ítems, cotizaciones, ofertas y demás relaciones reales usan conexiones keyset independientes.
- [x] Disponibilidad y fallos parciales no se confunden con ausencia informada ni cero.
- [x] Ciclo, motivos y procedencia enlazan snapshot, observación, normalizador y read model.
- [x] El JSON sanitizado requiere acción explícita, devuelve un payload individual y nunca aparece en listados o analytics.
- [x] Deep link, paginación hija, teclado y retorno de foco pasan en Playwright autenticado.

## Progress

- 2026-08-10 — Start implementation. Plan audited and approved: relation-level availability snapshot table, flat quoted-products connection, sanitized individual payload via existing redaction, dedicated GraphQL detail DTO, independent child cursors, SidePanel rebuild. Contract frozen per ticket-25 detail contract.
- 2026-08-10 — Implementación completada: resolver y servicio de lectura V2, conexiones hijas keyset, disponibilidad por relación, procedencia, payload sanitizado individual y SidePanel estructurado. `npx jest src/modules/mercado-publico/components/__tests__/MercadoPublicoV2FilterBar.test.tsx` pasó (1/1); Playwright autenticado `npx playwright test tests/mercado-publico/detail-panel.spec.ts` pasó (5/5). `lingui:extract`, `lingui:compile`, formato y `git diff --check` pasaron. `npx nx typecheck twenty-front` mantiene errores preexistentes de tipos implícitos en `useFrontComponentExecutionContext.ts`.
