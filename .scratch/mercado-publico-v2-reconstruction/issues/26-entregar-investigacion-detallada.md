# Entregar investigación detallada

Status: done
Completed: 2026-08-10
Evidence: packages/twenty-e2e-testing/tests/mercado-publico/detail-panel.spec.ts; `yarn playwright test tests/mercado-publico/detail-panel.spec.ts`
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

- 2026-08-10 — Reanudación desde el checkpoint `238c8c578f`; el árbol está limpio y la implementación está presente. Se inicia validación independiente antes del cierre.
- 2026-08-10 — Validación unitaria del checkpoint: frontend `MercadoPublicoV2FilterBar` 1/1; detalle backend 3/3; normalizador V2 7/7; proyección V2 4/4.
- 2026-08-10 — `oxlint` directo pasó en frontend (5 archivos) y backend (16 archivos); `oxfmt` corrigió solo dos archivos backend del checkpoint; `git diff --check` pasó.
- 2026-08-10 — Runtime Compose existente verificado como saludable sin cambios. Playwright autenticado pasó 5/5: deep link, paginación hija independiente, disclosure explícito del JSON y retorno de foco por teclado. La integración Jest no pudo ejecutar por PostgreSQL no expuesto al host; no se inició ni reseteó infraestructura.
- 2026-08-10 — Pasadas completas: frontend 841/842 suites y 5003/5004 tests; backend 766/782 suites y 6336/6403 tests. Las fallas globales son ajenas al ticket: exhaustividad de `usePageChangeEffectNavigateLocation`, rutas Windows de `file-storage` y módulo incompleto de `cloudflare`.
- 2026-08-10 — Cierre: los seis criterios permanecen satisfechos; typecheck backend, lint/formato directos, pruebas focalizadas y Playwright autenticado pasan. Typecheck frontend conserva errores preexistentes en `useFrontComponentExecutionContext.ts`; integración Jest requiere PostgreSQL accesible desde el host.
- 2026-08-10 — Start implementation. Plan audited and approved: relation-level availability snapshot table, flat quoted-products connection, sanitized individual payload via existing redaction, dedicated GraphQL detail DTO, independent child cursors, SidePanel rebuild. Contract frozen per ticket-25 detail contract.
- 2026-08-10 — Implementación completada: resolver y servicio de lectura V2, conexiones hijas keyset, disponibilidad por relación, procedencia, payload sanitizado individual y SidePanel estructurado. `npx jest src/modules/mercado-publico/components/__tests__/MercadoPublicoV2FilterBar.test.tsx` pasó (1/1); Playwright autenticado `npx playwright test tests/mercado-publico/detail-panel.spec.ts` pasó (5/5). `lingui:extract`, `lingui:compile`, formato y `git diff --check` pasaron. `npx nx typecheck twenty-front` mantiene errores preexistentes de tipos implícitos en `useFrontComponentExecutionContext.ts`.
