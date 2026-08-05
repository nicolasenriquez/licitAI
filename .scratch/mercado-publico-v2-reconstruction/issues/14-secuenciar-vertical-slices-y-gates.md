# Secuenciar vertical slices y gates SDLC

Type: grilling
Status: resolved
Blocked by: 04, 05, 06, 07, 10, 12, 13

## Question

¿En qué orden deben entregarse las vertical slices para reducir riesgo de datos,
integración, UX y limpieza, y qué evidencia impide avanzar prematuramente?

## Decision record expected

- Slices end-to-end con objetivo de usuario, contrato, persistencia, UI y test.
- Gates para baseline, datos, ingesta, metadata/GraphQL, prototipo, navegación,
  rendimiento, accesibilidad, cutover y limpieza.
- Trabajo secuencial, paralelizable y bloqueado.
- Definition of Ready y Definition of Done por slice.
- Estrategia de rollback y observabilidad en cada frontera.

## Answer

Decisión humana confirmada. El trabajo avanza por una sola cadena de slices
end-to-end; no se amplía UX antes de que datos y evidencia sean confiables.

| Orden | Slice y objetivo | Contrato, persistencia, UI y prueba que lo cierran |
| --- | --- | --- |
| Gate 0 | Baseline | nueva rama desde `main`, salvamento aprobado, bandera local, Compose/harness reproducible y validación base verde |
| 1 | Camino dorado de lectura | fixture V2 → `SyncRun` → evidencia/proyección → conexión GraphQL keyset → Activas autenticada y panel lateral; Playwright real |
| 2 | Confiabilidad de datos | descubrimiento/hidratación, checkpoint, dedupe, replay, historial y observabilidad; camino dorado permanece verde |
| 3 | Workspace analista | búsqueda, filtros/URL, orden keyset, analytics de población completa, estados y accesibilidad; sin Control |
| 4 | Investigación completa | detalle enriquecido, hijos paginados, procedencia/JSON sanitizado, Historial y Compradores; sólo lectura |
| 5 | Operación controlada | Centro de control: iniciar/reanudar/cancelar `SyncRun`, auditoría y exclusión mutua; analista no accede |
| Gate final | Cutover y retiro | paridad autenticada, cambio de ruta y retiro de UI/prototipos desplazados |

Cada slice sólo empieza con Definition of Ready: contrato explícito, fixtures y
escenarios representativos, ruta de migración reversible y rollback definido.
Sólo termina con Definition of Done: migración `up/down` cuando aplique,
observabilidad de versión/`SyncRun`, pruebas unitarias e integración, Playwright
del harness, accesibilidad, visuales revisadas y gates de rendimiento local
verdes.

La cadena Gate 0 → slices 1–5 → gate final es secuencial. Dentro de un slice,
contrato, UI, pruebas y documentación pueden avanzar en paralelo sólo tras
estabilizar el seam; cutover y limpieza esperan todos los gates.

Cada frontera conserva bandera local y ruta previa. Migraciones son reversibles;
logs y `SyncRun` identifican versión. Rollback de cutover vuelve a la ruta
anterior sin borrar evidencia `mp`. El cutover requiere paridad local
autenticada completa, consola/red sin regresiones, visual/a11y/rendimiento
verdes y rollback ensayado; recién entonces se retiran rutas, CSS y prototipos
desplazados.
