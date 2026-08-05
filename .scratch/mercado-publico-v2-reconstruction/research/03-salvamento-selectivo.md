# Salvamento selectivo de la rama actual

Fecha de corte: 2026-08-04  
Rama auditada: `feat/mercado-publico-ingestion-backbone`  
Base comparada: `origin/main`  
Merge-base: `accbf901f9e8cb10c49109ef1d4fea37678d88a4`

## Dictamen

No se debe trasladar la rama mediante merge, rebase ni cherry-pick masivo. La
estrategia segura es comenzar desde `main` y rescatar manualmente contratos V2,
fixtures y pruebas pequeñas; reescribir los seams de ingesta, proyección,
GraphQL y UI; conservar los prototipos y documentos únicamente como evidencia;
y excluir el alcance V1/CSV, los generados y el tooling no relacionado.

La razón principal no es solo el volumen. La rama mezcla producto, ingesta,
migraciones, documentación, skills, archivos generados y prototipos, mientras
los dos recorridos productivos V2 no completan el mismo pipeline. Portar el
conjunto perpetuaría esa divergencia.

## Método y límites

- Revisión estrictamente de solo lectura del diff desde `origin/main` hasta el
  working tree actual.
- Orientación inicial con el grafo existente y verificación posterior directa
  en código, tests y consumidores. La consulta Graphify partió de nodos
  genéricos de migraciones/analytics y no recuperó de forma fiable el módulo de
  Mercado Público; por ello no se usó como fuente concluyente.
- Se inspeccionaron los contratos de `packages/`, `twenty-server`,
  `twenty-front`, `twenty-shared`, `twenty-ui` y `twenty-e2e-testing`.
- No se ejecutaron tests ni migraciones: el objetivo es inventario, no validar
  como portable una implementación todavía acoplada a la rama.
- Las categorías cuantitativas se superponen; por ejemplo, una fixture CSV
  también pertenece al módulo backend. No deben sumarse entre sí.
- Los archivos no rastreados se identifican por separado porque no aparecen en
  las estadísticas del diff comprometido.

## Magnitud comprobada

| Corte | Archivos | Adiciones | Eliminaciones |
| --- | ---: | ---: | ---: |
| `origin/main...HEAD` | 765 | 151.252 | 70.633 |
| `origin/main` a working tree | 768 | 152.449 | 70.633 |
| Módulo backend Mercado Público | 102 | 7.878 | 1.184 |
| Frontend Mercado Público | 45 | 6.171 | 0 |
| Migraciones MP rastreadas | 23 | 863 | 20 |
| Nombres V2 / Compra Ágil | 50 | 4.099 | 243 |
| Nombres V1 / licitación / OC | 39 | 1.113 | 244 |
| Nombres CSV | 34 | 847 | 185 |
| Generados, locales y `graphql.ts` | 71 | 105.109 | 60.366 |
| Wayfinder/rediseño anterior | 104 | 8.470 | 0 |
| OpenSpec | 68 | 8.581 | 37 |
| Tooling de agentes | 138 | 4.291 | 7.075 |
| Playwright E2E | 0 | 0 | 0 |

La rama tiene 34 commits sobre `origin/main`. El working tree agrega además
cuatro archivos de migración analytics no rastreados, una composición UI y sus
query/hook/test no rastreados, junto con cambios locales sobre persistencia,
reconciliación, read models y GraphQL. Estos archivos no comprometidos no son
una autoridad de contrato.

## Ledger de salvamento

### PORTAR

Portar significa trasladar de manera selectiva al nuevo diseño, archivo por
archivo o incluso caso de prueba por caso de prueba. No significa cherry-pick
del commit que los contiene.

| Conjunto coherente | Evidencia y consumidores | Dependencias | Riesgo / condición de entrada |
| --- | --- | --- | --- |
| Fixtures reales reducidas V2 de lista y detalle en `packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-*.json` | Cubren sobre de lista, detalle productivo, detalle sin registro, con/sin OC y variantes de `estado`. Son consumidas por specs del cliente/extractor. | Contrato oficial V2 y sanitización permanente. | Portar solo fixtures sanitizadas. Ampliarlas con casos determinísticos del dataset de 3.000 registros; las actuales no prueban el universo real. |
| Casos de contrato de `extract-v2-compra-agil-list-records.util.spec.ts` | El extractor es consumido directamente por el cliente V2 en `mercado-publico-api-v2-compra-agil-client.service.ts:163,230`; el spec cubre envelopes, valores inválidos y variantes observadas. | Nuevo adaptador V2 y definición explícita de payload retenido versus proyección. | Portar los casos de aceptación, no asumir que el actual objeto aplanado es el nuevo modelo final. El payload original completo debe conservarse aparte. |
| Normalización temporal en `normalize-v2-compra-agil-date.util.ts` y su spec | Consumida por persistencia en `mercado-publico-persistence.service.ts:737-743`; los tests cubren offset, fecha sin offset y entradas inválidas. | Política de timezone `America/Santiago` y columnas `timestamptz`. | Portar como contrato test-first; revisar la interpretación de fechas sin offset antes de portar la implementación literal. |
| Semántica HTTP acotada: `parse-retry-after-seconds.util.ts`, `classify-http-failure.util.ts` y specs | Consumida por el cliente V2; preserva reintentos/rate-limit sin filtrar secretos. | Cliente HTTP, política de reintentos y observabilidad. | Portar si los tests siguen describiendo la API V2. Evitar trasladar utilidades genéricas sin consumidor V2 comprobado. |
| Validación de parámetros V2 y sus tests | `validate-compra-agil-params.util.ts` tiene consumidor en la capa API y cobertura específica. | Contrato de búsqueda por fecha/código, paginación y límites del proveedor. | Portar las reglas que coincidan con el flujo diario/manual acordado; retirar opciones heredadas que no sean necesarias. |
| Principio de evidencia cruda y redacción de parámetros | `redact-mercado-publico-request-params.util.ts` y el almacenamiento `mp.raw_api_payload` aportan trazabilidad sin exponer tickets. | Nuevo módulo de evidencia V2, política de retención y logs. | Portar el contrato de seguridad y pruebas; no portar el servicio monolítico de persistencia completo. |
| Comportamiento de apertura/cierre del SidePanel y restitución de foco | `useOpenMercadoPublicoProcessInSidePanel.ts`, su spec y `useListenToSidePanelClosing` demuestran integración con el shell Twenty. | `SidePanelPages`, estado por instancia y nueva ruta/estado navegable. | Absorber el seam y los criterios de foco. La nueva implementación debe añadir URL persistente; no portar el estado local como contrato completo. |
| Primitives Twenty ya elegidos en la página | `PageCardLayout` y `SettingsTabBar` son usados en `MercadoPublicoCommandCenterPage.tsx:74,83`; el SidePanel también es nativo. | Shell, navegación metadata-driven, Lingui y tokens. | Portar la decisión de integración, no necesariamente la composición actual. Validar que el workspace del analista no herede semántica de Settings por conveniencia. |

### REESCRIBIR

| Conjunto coherente | Evidencia de por qué no es portable | Dependencias / riesgo |
| --- | --- | --- |
| Orquestación V2 de descubrimiento y seguimiento: `mercado-publico-api-v2-compra-agil-incremental.service.ts`, `...publication-window.service.ts`, job y orchestrator | El incremental encola hidratación y reconciliación en líneas 205-206; publication-window solo depende de canonical refresh y no contiene `enqueue`. Son dos recorridos que terminan en capas distintas. | Reescribir como un único caso de uso idempotente compartido por cron diario y acción manual. Debe descubrir solo publicadas, mantener la cohorte hasta terminal y registrar watermark/ventana solapada. Riesgo alto de pérdida silenciosa. |
| Persistencia/proyección V2 en `mercado-publico-persistence.service.ts` | El servicio mezcla API V1, V2 y CSV. En líneas 482-489 solo proyecta staging cuando el raw fue insertado; reproducir un payload deduplicado no repara staging tras cambiar el mapper. | Separar evidencia raw inmutable de proyección reproducible. Añadir backfill/replay explícito y pruebas sobre el dataset representativo. Riesgo alto de datos retenidos pero invisibles. |
| Canonical y gold: `mercado-publico-canonical-refresh.service.ts` y `mercado-publico-reconciliation.service.ts` | Canonical escribe `mp.compra_agil` en líneas 383-446; gold se materializa en reconciliación (`INSERT INTO mp.gold_detected_process`, línea 695). La ruta diaria puede quedar antes de gold. | Una transacción/cadena observable hasta la proyección leída por UI. Definir current projection e historial inmutable. Riesgo P0/P1 de UI desactualizada aunque el job figure exitoso. |
| Detalle V2 y ciclo de vida | El servicio actual de detalle es llamado desde jobs heredados y el panel lee evidencia retenida; el destino requiere consultar asincrónicamente cada oportunidad de la cohorte hasta estado terminal y exponer payload completo bajo demanda. | Scheduler, cola, rate-limit, retención y snapshot/event history. No llamar al proveedor desde el navegador. |
| Modelo de lectura, DTO y resolver: `mercado-publico-query.dto.ts`, `mercado-publico-query.resolver.ts`, `detected-process-read.*`, `process-detail-read.*` | El DTO nuevo suma 1.012 líneas y el read service 483, señal de contrato ancho. La rama usa `NoPermissionGuard` sin permiso MP específico. Analytics/local list tienen contratos todavía locales/no rastreados. | Reescribir GraphQL estrecho: paginación/filtros/orden server-side, agregados sobre universo completo, payload raw autorizado y permisos analista/operador. Riesgo alto de exposición y acoplamiento. |
| Migraciones V2 y backfills en `upgrade-version-command/2-16/*mp-compra-agil*` | Hay comandos fast/slow, modificaciones de migraciones ya existentes, cuatro nuevos archivos analytics no rastreados y registro local en `instance-commands.constant.ts`. Su orden depende de columnas y cobertura existentes; el backfill actualiza capas de forma parcial. | Una vez congelado el nuevo contrato, generar comandos inmutables nuevos con `up/down`, cobertura y rollback probado en DB desechable. Usar SQL/spec actual solo como evidencia. Nunca modificar o copiar una migración histórica. |
| Pipeline manual del Command Center | La rama actual define un Command Center de lectura; el destino autoriza una mutación operativa idempotente con prevención de duplicados y progreso. | Autorización operador/admin, BullMQ, auditoría y misma pipeline que cron. Requiere diseño nuevo, no ampliación ad hoc del resolver actual. |
| Workspace frontend y composición de Compra Ágil | `MercadoPublicoBrowseTab.tsx` (710 líneas), `MercadoPublicoControlCenterTab.tsx` (810) y el local `MercadoPublicoCompraAgilTab.tsx` (aprox. 978) duplican búsqueda, filtros, paginación y estados. | Prototipo A/B/C sobre shell real, selección por tareas, primitives Twenty, URL state, GraphQL nuevo y Playwright autenticado. |
| Table/read-only grid de oportunidades | Existen tres `styled.table` paralelas: Browse línea 159, Control Center línea 67 y Compra Ágil línea 220; también `styled.input/select` repetidos. | Reutilizar primitives nativos y crear una composición domain-local. Solo extraer un grid genérico a `twenty-ui` si aparece un segundo consumidor real. Riesgo alto de otra abstracción especulativa. |
| Navegación y permisos | El item actual es metadata-driven pero ubica Mercado Público como enlace secundario; el destino acordó workspace del analista como entrada y Command Center secundario. | Roles, feature visibility, orden de sidebar y deep-link post-login. Debe validarse con identidades locales analista/operador. |
| Harness de aceptación | No existe ningún cambio en `packages/twenty-e2e-testing` para esta rama. Los tests actuales son unitarios/Storybook y no prueban autenticación, ruta, permisos, red ni screenshots. | Crear aprovisionamiento idempotente de dos usuarios locales, `storageState` fuera del repo, dataset V2 representativo y Playwright desktop/responsive. |

### EVIDENCIA-ONLY

| Conjunto | Uso permitido | Por qué no cruza como producto |
| --- | --- | --- |
| `.scratch/mercado-publico-workspace-redesign/` (104 archivos, 8.470 líneas más binarios) | Screenshots, decisiones, problemas reproducidos y criterios visuales comparativos. | El mapa anterior declara cierre, pero convive con PRD/tickets derivados contradictorios. Es historia, no autoridad del nuevo alcance. |
| OpenSpecs activos/archivados de Mercado Público | Fuente de hipótesis, contratos intentados, SQL y fallas conocidas; se marcarán reemplazados cuando existan los nuevos tickets. | El workflow acordado es Wayfinder → `/to-spec` → `/to-tickets` → OpenSpec selectivo por ticket. No deben gobernar la reconstrucción. |
| `MercadoPublicoControlCenterPrototype.stories.tsx`, `MercadoPublicoWorkspace.stories.tsx` y la story eliminada localmente | Catálogo de estados loading/empty/error/partial, responsive y tema; inspiración para acceptance visual. | Son prototipos acoplados a queries/composición actuales y contienen tablas/CSS paralelos. No son validación de ruta autenticada. |
| Specs acoplados al frontend actual | Conservar como catálogo de comportamientos: foco, disclosure, loading/error, paginación y ausencia de overflow documental. | Muchos prueban mocks y estructura concreta de componentes descartables. Reescribirlos contra tareas y accesibilidad, no copiarlos en bloque. |
| Migraciones y backfills actuales | Referencia de columnas intentadas, orden, nulabilidad y SQL de recuperación. | No son seguras para cherry-pick por dependencia de historia/registro de comandos y por cambios locales no comprometidos. |
| Reportes, logs y artefactos visuales previos | Baseline para comparar datos/DOM/screenshot y documentar regresiones. | Deben permanecer fuera del bundle de producto y sin secretos. |

### RETIRAR-AFTER-PARITY

Estos elementos pueden seguir existiendo temporalmente en la rama antigua como
baseline. No deben quedar junto a la implementación elegida después del gate de
paridad funcional/visual:

1. `MercadoPublicoBrowseTab.tsx`, `MercadoPublicoControlCenterTab.tsx` y el
   local `MercadoPublicoCompraAgilTab.tsx`.
2. Sus tres tablas HTML, filtros, selects, inputs, paginadores, skeletons y CSS
   Linaria duplicados.
3. `MercadoPublicoControlCenterPrototype.stories.tsx`, variantes perdedoras
   A/B/C y stories históricas absorbidas.
4. La composición actual de `MercadoPublicoCommandCenterPage.tsx` cuando la
   ruta nueva haya pasado autenticación, deep-link, responsive y visual parity.
5. Queries/hooks/fragments de `detectedProcesses`, monitoring y analytics que
   queden sin consumidor tras introducir el contrato nuevo.
6. `MercadoPublicoProcessDetailPanel.tsx` y su estado/hook actuales si el panel
   nuevo absorbe navegación, accesibilidad y payload bajo demanda.
7. Tipos generados GraphQL y catálogos Lingui asociados a operaciones/textos
   eliminados; se regeneran al final, no se limpian manualmente.

Gate obligatorio: retirar solo cuando Playwright pruebe con usuario analista y
operador las tareas principales, permisos, conservación de URL/selección,
detalle, payload colapsado, sync manual y regreso al contexto previo.

### EXCLUIR

| Conjunto | Evidencia | Decisión |
| --- | --- | --- |
| Cambios V1 de licitaciones/órdenes de compra | 39 archivos nominales, +1.113/-244; clientes, fixtures, servicios por fecha/estado/detalle y tests. | No cruzan al alcance Compra Ágil V2. Inventariar dependencias compartidas antes de retirar en la rama antigua, pero no importarlas como “por si acaso”. |
| Cambios CSV | 34 archivos nominales, +847/-185; descargas, raw load, profiling, controller, read model y UI de health/download. | Excluir del nuevo vertical slice V2. No trasladar tablas/esquema CSV solo porque hoy conviven en el persistence/orchestrator. |
| Generados, locales y `generated/graphql.ts` | 71 archivos, +105.109/-60.366. | Nunca seleccionar como fuente. Regenerar desde el contrato final y revisar el diff resultante. |
| Agent skills, comandos Codex/OpenCode y plugin | 138 archivos, +4.291/-7.075. | Cambio repo-wide no relacionado con el producto. Debe vivir en una iniciativa separada o llegar desde `main`. |
| Wayfinder/OpenSpec/documentación anterior como código ejecutable | 172 archivos entre scratch anterior y OpenSpec, más docs. | Conservar solo en la rama congelada o como referencias enlazadas. No copiar al nuevo feature branch salvo el Wayfinder/spec/tickets nuevos de este workflow. |
| Design-token churn y cambios globales de UI | Cambios fuera del módulo MP y una alta superficie generada. | Excluir salvo que un ticket demuestre un token faltante con segundo consumidor. Primero reutilizar tokens de Twenty. |
| Docker/CI/runtime y cambios workspace-manager no indispensables | La rama contiene commits Docker-only, CI y snapshots globales junto al producto. | Excluir del rescate MP; incorporar desde `main` o ticket independiente si el acceptance harness demuestra una necesidad concreta. |
| Ruido accidental `AGENTS.md.bak` y `utputFormat` | Ambos aparecen en el diff de la rama. | No deben cruzar bajo ninguna circunstancia. |
| Credenciales, cookies, tickets API, `.env`, storage state, dumps y screenshots de sesión | Prohibidos por contrato del repositorio y por el happy path acordado. | No versionar ni copiar. Secretos por variables de entorno; artefactos de Playwright fuera del repo o en ubicación explícitamente ignorada. |
| Archivos locales analytics no rastreados | Query/hook/composición/test frontend y cuatro comandos fast/slow de migración. | No tratarlos como implementación aprobada. Usarlos como evidencia para el contrato y reescribir después de los tickets/decisiones correspondientes. |

## Elementos que no deben cruzar a la nueva rama

Lista explícita de no-cross:

- Ningún merge/rebase/cherry-pick masivo de los 34 commits.
- Ningún servicio V1 ni CSV, fixture V1/CSV, controller CSV o UI CSV.
- Ninguna de las tres tablas HTML/CSS actuales ni una abstracción genérica sin
  segundo consumidor.
- Ninguna migración histórica modificada; tampoco los cuatro comandos
  analytics locales como autoridad.
- Ningún `generated/graphql.ts`, locale generado o token generado trasladado a
  mano.
- Ningún prototipo/story perdedor como código productivo.
- Ningún skill, comando de agente, configuración OpenCode/Codex, cambio CI o
  Docker mezclado con el vertical slice.
- Ningún artifact de `.scratch`, log, screenshot autenticado, cookie, ticket,
  secreto o `.env` dentro del producto.
- `AGENTS.md.bak` y `utputFormat`.

## Orden recomendado de rescate

1. Portar fixtures y tests de contrato V2 pequeños a una rama nueva desde
   `main`; hacerlos fallar contra el nuevo seam antes de trasladar lógica.
2. Definir raw evidence, current projection, historial de estados y lifecycle
   de la cohorte publicada.
3. Reescribir un pipeline V2 único y reproducible, luego crear migraciones
   inmutables nuevas y un backfill explícito.
4. Exponer GraphQL paginado/autorizado y agregados completos.
5. Prototipar A/B/C sobre shell/auth/datos reales; elegir y absorber una sola
   composición.
6. Crear Playwright autenticado con dos roles y gate visual/funcional.
7. Retirar el código desplazado y regenerar GraphQL/Lingui una vez demostrada
   la paridad.

## Riesgos de salvamento

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Confundir raw retenido con proyección completa | Alta | Crítico | Tests de replay/backfill y trazabilidad raw → current → history → GraphQL. |
| Trasladar el pipeline divergente | Alta | Crítico | Un caso de uso V2 compartido por cron/manual con gate hasta gold/read model. |
| Copiar migraciones en orden incompatible | Alta | Alto | Nuevos comandos inmutables sobre DB desechable y prueba de `up/down`. |
| Portar mocks como prueba de calidad real | Alta | Alto | Dataset representativo, auth real, inspección de red/DOM y Playwright. |
| Repetir UI paralela a Twenty | Alta | Alto | Prototipo comparativo, primitives nativos y prohibición de grid genérico prematuro. |
| Arrastrar V1/CSV por dependencia monolítica | Media-alta | Alto | Separar interfaces V2 antes de portar y comprobar consumidores con búsqueda/test. |
| Exponer sync/payload a analistas sin permiso | Media | Crítico | Permisos explícitos operador/admin, pruebas negativas y redacción de secretos. |

## Criterio de cierre del ticket

El inventario queda apto para alimentar `/to-spec` y `/to-tickets` cuando cada
slice use estas categorías como allowlist/denylist, declare sus dependencias y
no trate ningún archivo de la rama congelada como portable por defecto. Cada
candidato debe volver a demostrar consumidor, prueba, compatibilidad con el
contrato V2 y responsabilidad única en la rama nueva.
