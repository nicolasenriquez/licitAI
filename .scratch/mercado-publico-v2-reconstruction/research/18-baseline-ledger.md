# Ledger del baseline reproducible — Issue 18

Status: done
Branch: `feat/mercado-publico-v2-baseline`
Base: `origin/main` @ `7fd1601f83` (merge PR #1, ingestion backbone)
Provenance: `git log --oneline --first-parent` desde la rama; ningún merge/rebase/cherry-pick masivo desde `feat/mercado-publico-ingestion-backbone` (congelada como evidencia).

## Elementos salvados

### Ya presentes en `main` (registrados y verificables)

| Elemento | Verificación |
| --- | --- |
| Cliente V2 `mercado-publico-api-v2-compra-agil-client.service.ts` + spec | `cd packages/twenty-server && npx jest "mercado-publico-api-v2-compra-agil-client"` |
| `extract-v2-compra-agil-list-records.util.ts` + spec | `npx jest "extract-v2-compra-agil-list-records"` |
| `validate-compra-agil-params.util.ts` + spec | `npx jest "validate-compra-agil-params"` |
| `classify-http-failure.util.ts` + spec | `npx jest "classify-http-failure"` |
| `coerce-to-nullable-string.util.ts`, `parse-mercado-publico-body-error.util.ts`, `parse-mercado-publico-date.util.ts` | `git log --oneline -- <path>` |
| Tipos V2 `mercado-publico-api-v2-compra-agil-record.type.ts` | idem |
| Módulo, constantes, jobs, `mercado-publico:run` command | `npx jest "mercado-publico-run.command"` |
| Seam `SidePanelPages` (twenty-shared) y navegación por drawer | `git log --oneline -- packages/twenty-shared/src/types/SidePanelPages.ts` |
| Persistencia/canonical/reconciliación (en main, pero REWRITE según issue 03 — no contrato del baseline) | slices 4-5 |

### PORTADOS en este baseline (desde rama congelada, archivo por archivo, sanitizados)

| Archivo | Procedencia | Estado |
| --- | --- | --- |
| `drivers/api/utils/normalize-v2-compra-agil-date.util.ts` | rama congelada | portado, 4 tests verdes |
| `drivers/api/utils/__tests__/normalize-v2-compra-agil-date.util.spec.ts` | idem | portado |
| `drivers/api/utils/parse-retry-after-seconds.util.ts` | idem | portado, 4 tests verdes |
| `drivers/api/utils/__tests__/parse-retry-after-seconds.util.spec.ts` | idem | portado |
| `utils/redact-mercado-publico-request-params.util.ts` | idem | portado |
| `utils/__tests__/redact-mercado-publico-request-params.util.spec.ts` | nuevo (la rama no tenía spec) | 3 tests verdes |
| `drivers/api/__tests__/fixtures/v2-compra-agil-*.json` (8 archivos) | idem | portados, sin tickets/secretos (`git grep -iE "ticket|[0-9]{9,}"` = 0) |

Verificación conjunta: `cd packages/twenty-server && npx jest "normalize-v2-compra-agil-date|parse-retry-after-seconds|redact-mercado-publico-request-params"` → 3 suites, 11 tests.

### Diferidos (registrados, no portados)

| Elemento | Trigger |
| --- | --- |
| `useOpenMercadoPublicoProcessInSidePanel` + `useListenToSidePanelClosing` (frontend seam) | slice 19, cuando exista consumidor de ruta V2 |
| Bandera backend `MERCADO_PUBLICO_V2_ENABLED` | primer resolver/DTO V2 |
| Fixtures determinísticas del dataset de 3.000 registros | slice 4/5 (ampliación según issue 03) |

### Excluidos (issue 03)

V1/CSV, generados/`generated/graphql.ts`, skills de agente, wayfinder anterior, tres `styled.table` paralelas, prototipos/stories, migraciones históricas, credenciales/storage state/screenshots.

## Bandera local (AC: alterna rutas completas)

- `REACT_APP_MERCADO_PUBLICO_V2_ENABLED=true` (frontend `.env.local`) → `AppRouter` registra la ruta completa `/mercado-publico-v2` (composición V2 entera, read-only).
- Sin la bandera (default) → la ruta no existe; cero mezcla de composiciones en la misma superficie.
- Fuente: `packages/twenty-front/src/modules/app/components/AppRouter.tsx`, `useCreateAppRouter.tsx`, `AppPath.MercadoPublicoV2Baseline`.

## Entorno desechable + smoke

- Composición Docker Compose de `packages/twenty-docker` con almacenamiento aislado (volumen desechable); identidades `analista`/`operador` vienen del dev-seed (`phil.schiler@apple.dev` / `jane.austen@apple.dev`, `seed-users.util.ts`), entorno local desechable, nunca credenciales productivas.
- Contraseña de identidades: el dev-seed comparte un hash bcrypt versionado (password `tim@apple.dev`) — diseño upstream de Twenty, no un secreto; el provisioner lo declara y no se inventa un mecanismo de env para datos locales desechables.
- Provisioner: reutiliza `workspace:seed:dev --light` para el workspace e identidades; escribe la bandera en `.env.local` del frontend y en `.env` de e2e (el spec la lee de `process.env` vía dotenv de Playwright).
- Smoke autenticado: Playwright `packages/twenty-e2e-testing/tests/mercado-publico/baseline.spec.ts` — login real (`login.setup.ts` + storage state), bandera on → ruta V2 renderiza; bandera off → ruta ausente; evidencia (screenshot + trace + log de red) en directorio ignorado por Git; cero llamadas del navegador al proveedor.
- Evidencia: directorio fuera de artefactos versionados (ver `.gitignore` de e2e).

## Rollback explícito (AC: sin alterar datos existentes)

1. Quitar `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` del `.env.local` (o poner `false`).
2. Reiniciar el frontend → la ruta `/mercado-publico-v2` desaparece; el estado previo de `main` queda intacto (ninguna ruta canónica tocada).
3. La ruta V2 es read-only: no escribe en esquemas existentes; los fixtures viven solo en el volumen del Compose desechable.
4. Verificación de rollback: re-correr `baseline.spec.ts` con bandera off → espera ruta ausente y evidencia guardada.
5. Restaurar: volver a activar la bandera y re-correr el smoke; los datos existentes no se modifican en ningún paso.

## Validación del baseline (2026-08-05)

| Chequeo | Resultado |
| --- | --- |
| Jest utilidades portadas (3 suites) | 11/11 verdes |
| oxlint twenty-server | 0 errores; 6 warnings preexistentes en módulo heredado de main |
| oxfmt twenty-server | 2 archivos propios formateados; 60 archivos del módulo heredado con formato suelto — deuda de `main`, no tocada (baseline no reformatea código ajeno) |
| oxlint twenty-front | verde |
| tsgo twenty-front | 5 errores preexistentes (settings role-permissions), 0 del baseline |
| tsgo twenty-server | 48 errores preexistentes (workspace-manager + integration specs MP), 0 del baseline |
| Playwright `--list` | 10 tests listados, baseline compilando |
| nx typecheck | bloqueado por lockfile preexistente (`licitai` vs `twenty@workspace:.`); verificado con `tsgo --noEmit` directo |

Deudas de entorno preexistentes registradas (fuera de alcance): lockfile workspace-name mismatch, 48 errores tsgo server, 6 warnings oxlint server, 60 archivos sin formato oxfmt, 5 errores tsgo frontend.

## Smoke autenticado ejecutado (2026-08-06)

| Chequeo | Resultado |
| --- | --- |
| Compose up (db/redis/server healthy) | ✅ 3/3 healthy; seed `workspace:seed:dev --light` ejecutado vía contenedor (nx/yarn bloqueado por lockfile) |
| Frontend dev con bandera | ✅ vite directo (`npx vite --port 3001`, nx bloqueado por lockfile) |
| `--flag on` → smoke (setup + test 1) | ✅ 2 passed, 1 skipped (test 2 es del build off) |
| `--flag off` → smoke (setup + test 2) | ✅ 2 passed, 1 skipped (test 1 es del build on) |
| Evidencia | ✅ screenshot `run_results/baseline-v2-route.png`, trace, network log (solo fonts CDN, cero llamadas al proveedor) |
| Rollback | ✅ bandera off → ruta ausente, sin tocar datos (verificación `--flag off` arriba) |

### Correcciones encontradas y aplicadas en el smoke (2026-08-06)

| Bug | Fix |
| --- | --- |
| `provision-baseline.mjs` resolvía rutas relativas a cwd | anclado a `import.meta.dirname` (funciona desde cualquier cwd) |
| `--flag on|off` escribía `=on/=off`; consumidores comparan `=== 'true'` | mapeo a `true`/`false` |
| Bandera `VITE_` nunca llegaba a `import.meta.env` (vite usa `envPrefix: 'REACT_APP_'`) | renombrada a `REACT_APP_MERCADO_PUBLICO_V2_ENABLED` (código, provisioner, spec, .env.example, ledger) |
| `login.setup.ts` exigía picker de workspace; dev-seed = 1 workspace por usuario | picker condicional (solo multi-workspace) |
| Smoke exigía cero red externa; Twenty carga fonts de Google CDN | allow-list fonts.googleapis.com/.gstatic.com; cero llamadas al proveedor sigue verificado |
| `.auth/user.json` obsoleto de sesión previa rompía el login | storage state regenerado por el setup en cada run (`.auth/` ignorado) |

Nota operativa: `nx start`/`nx build` siguen bloqueados por el lockfile (`licitai` vs `twenty@workspace:.`); el smoke usa vite directo y comandos vía contenedor. Deuda ya registrada arriba.

