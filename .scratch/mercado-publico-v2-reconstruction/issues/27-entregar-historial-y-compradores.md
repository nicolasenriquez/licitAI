# Entregar Historial y Compradores

Status: done
Completed: 2026-08-12
Evidence: `openspec/changes/archive/2026-08-12-mercado-publico-v2-history-and-buyers/tasks.md` (authenticated Playwright 9/9, focused server 16/16, quality gates, and OpenSpec validation); `packages/twenty-e2e-testing/tests/mercado-publico/history-and-buyers.spec.ts`
Blocked by: 26
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Entregar superficies autenticadas de Historial y Compradores que reutilicen el contrato V2 y permitan volver a oportunidades filtradas sin introducir un producto de comprador separado.

## Acceptance criteria

- [x] Historial permite consultar cambios semánticos y su procedencia sin mezclar snapshots actuales.
- [x] Compradores agrega demanda con cobertura y frescura sobre la población correspondiente.
- [x] Elegir comprador navega a Activas con el filtro aplicado y preserva navegación histórica.
- [x] Analista accede a ambas superficies; no aparecen acciones operativas ni datos protegidos.
- [x] Estados, URLs, responsive, accesibilidad y analytics se prueban mediante rutas autenticadas reales.

## Progress

- 2026-08-12 — Cierre validado contra el cambio OpenSpec archivado: la prueba Playwright autenticada aislada registra 9/9; las suites focalizadas de servidor registran 16/16; los quality gates y `openspec validate mercado-publico-v2-history-and-buyers` pasan.
- 2026-08-12 — Revisión independiente: `just runtime-check`, `git diff --check` y descubrimiento Playwright pasan. La ejecución local directa no llegó a aserciones porque el setup configurado de `npx serve` agotó el tiempo; no hubo fallo de producto. Se conserva como evidencia primaria el cierre aislado 9/9 registrado en OpenSpec.

## Blocked by

- 26 — Entregar investigación detallada.
