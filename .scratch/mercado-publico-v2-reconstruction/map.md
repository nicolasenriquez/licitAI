# Reconstrucción profesional de Mercado Público Compra Ágil V2

## Destination

Entregar un mapa de decisiones completo, basado en evidencia y listo para
convertirse mediante `/to-spec` y después `/to-tickets` en un plan de
reconstrucción profesional de Mercado Público Compra Ágil V2. El resultado debe
definir producto, dominio, datos, arquitectura, UX, seguridad, validación,
vertical slices, transición y retiro de código, sin implementar producción.

## Notes

- Autoridad de planificación: este Wayfinder queda congelado al aprobar el
  handoff; luego el flujo será `/to-spec` → `/to-tickets` → evaluación
  individual de si cada ticket necesita OpenSpec.
- Skills por sesión: `prime-codebase`, `graphify`, `grill-with-docs`,
  `domain-modeling`, `codebase-design`; añadir `prototype` e `impeccable` en
  decisiones visuales, `frontend-ui-engineering` en UI productiva y `research`
  en investigaciones AFK.
- Rama de partida futura: una rama nueva desde `main`. La rama
  `feat/mercado-publico-ingestion-backbone` queda congelada como evidencia y
  fuente de salvamento selectivo; no es la base de reconstrucción.
- Producto: workspace de solo consulta para un analista de compras, centrado en
  buscar, filtrar y revisar Compra Ágil. Comparación entre oportunidades queda
  excluida. Command Center es una
  superficie operativa secundaria.
- Fuente: únicamente API V2. El navegador nunca llama directamente al
  proveedor. El backend retiene payload crudo, normaliza proyecciones y expone
  contratos internos paginados.
- Cohorte: se descubren oportunidades publicadas y participables. Una vez
  incorporadas, se siguen diariamente hasta completar su ciclo de vida; al
  terminar pasan a Historial.
- Veracidad: métricas y conteos se calculan sobre el universo completo. Un dato
  no disponible se declara como tal; no se estima desde la página visible.
- Payload: el detalle presenta toda la información disponible de forma
  estructurada y permite revelar, bajo acción explícita, el JSON original
  sanitizado. No se carga el conjunto completo en el navegador.
- Seguridad: dos identidades locales desechables, analista y operador. Solo el
  operador puede iniciar una sincronización manual; las contraseñas llegan por
  variables de entorno y nunca se versionan.
- Validación: Docker Compose local, autenticación real, datos V2
  representativos, Playwright, evidencia visual, consola/red, accesibilidad y
  responsive. Cloud es un gate posterior cuando exista acceso autorizado.
- Diseño: Twenty es la autoridad visual y de interacción. El HTML de referencia
  aporta intención, no shell, runtime, datos simulados ni un sistema visual
  paralelo.
- Prototipo: variantes temporales A–G sobre el shell real y referencia B6
  externa, con datos y autenticación reales donde aplique. La composición
  elegida se reescribe para producción y se eliminan todas las piezas
  temporales.
- Transición: vertical slices detrás de una bandera local hasta alcanzar
  paridad; luego cambio de ruta, retiro explícito del código desplazado y
  rollback documentado.

## Decisions so far

- [Fijar destination y guardrails de la reconstrucción](issues/01-fijar-destination-y-guardrails.md)
  — la reconstrucción parte desde `main`, es V2-only, orientada al analista,
  conserva trazabilidad completa y termina en `/to-spec` y `/to-tickets`.
- [Definir estados y ciclo de vida V2](issues/02-definir-estados-y-ciclo-de-vida-v2.md)
  — la cohorte nace publicada, conserva seguimiento hasta terminalidad
  verificable y separa tiempo fuente, observado y persistido.
- [Inventariar el salvamento selectivo de la rama actual](issues/03-inventariar-salvamento-selectivo.md)
  — solo contratos V2 pequeños y probados se portan; pipeline, proyecciones,
  GraphQL y UI se reescriben; V1, CSV, generados y UI paralela no cruzan.
- [Diseñar contrato profundo del módulo de ingesta V2](issues/04-disenar-contrato-modulo-ingesta-v2.md)
  — `SyncRun` durable orquesta intents V2 con cohorte checkpointada,
  exclusión mutua, deduplicación y recuperación parcial.
- [Diseñar evidencia, historial y proyecciones de lectura](issues/05-disenar-evidencia-y-proyecciones.md)
  — evidencia content-addressed con observaciones por request, proyecciones
  trazables/versionadas, historial semántico y replay que crea faltantes.
- [Definir contrato interno de lectura](issues/07-definir-contrato-interno-de-lectura.md)
  — `mercadoPublicoV2` ofrece conexiones keyset, detalle/hijos y evidencia
  explícita, con nulos trazables, analytics de población completa y DTOs V2
  generados.
- [Definir permisos y control de sincronización](issues/06-definir-permisos-y-control-de-sync.md)
  — operador controla `SyncRun` mediante comandos idempotentes, auditados y
  cancelables de forma cooperativa; analista queda en lectura.
- [Prototipar el workspace del analista en variantes A/B/C](issues/08-prototipar-workspace-analista-abc.md)
  — reacción humana prefiere B6: filtros y tabla lideran, inteligencia factual
  queda colapsable y detalle, compradores y control mantienen límites claros.
- [Seleccionar la composición productiva del workspace](issues/09-seleccionar-composicion-productiva.md)
  — B6 se reescribe con tabla y filtros como eje, analítica factual secundaria,
  detalle lateral y superficies operativas separadas; se descarta código y
  mecánicas temporales del prototipo.
- [Definir presentación, formato y disclosure de campos](issues/11-definir-presentacion-de-campos.md)
  — tabla de cinco columnas con fuente y timezone explícitos; panel progresivo,
  nulos distinguibles, hijos paginados y payload sanitizado bajo disclosure.
- [Definir arquitectura de información y navegación](issues/10-definir-arquitectura-de-informacion.md)
  — Mercado Público entra por Activas, separa Historial, Compradores y control
  de operador, y conserva workspace, filtros y detalle lateral en URLs
  compartibles.
- [Fijar seams nativos de Twenty y límite de UI local](issues/12-fijar-seams-nativos-de-twenty.md)
  — Twenty conserva shell, SidePanel, primitives y tokens; resultados V2 usan
  composición read-only local y los prototipos/CSS paralelos se retiran tras paridad.
- [Diseñar el harness local de aceptación](issues/13-disenar-harness-local-de-aceptacion.md)
  — Compose desechable, fixtures V2 por `SyncRun`, roles reales y Playwright
  validan producto, accesibilidad, visuales y red; cloud queda como gate separado.
- [Secuenciar vertical slices y gates SDLC](issues/14-secuenciar-vertical-slices-y-gates.md)
  — cadena segura: camino dorado, confiabilidad de datos, workspace, detalle,
  operación y cutover; cada frontera exige evidencia y rollback.
- [Definir cutover, retiro de código y rollback](issues/15-definir-cutover-retiro-y-rollback.md)
  — port selectivo, bandera de ruta completa, dos ciclos observados y retiro en
  orden inverso de dependencia preservan rollback y evidencia V2.
- [Definir el handoff a /to-spec y /to-tickets](issues/16-definir-handoff-to-spec-to-tickets.md)
  — spec única sintetiza el mapa; tracer bullets verticales y matriz de riesgo
  gobiernan ejecución, mientras el OpenSpec anterior queda superseded.
- [Confirmar destination y frontera de implementación](issues/17-confirmar-destination-y-frontera.md)
  — revisión humana cierra el fog, congela el mapa y confirma `/to-spec` →
  `/to-tickets`; payload real y cloud quedan como gates de ejecución.

## Not yet specified

Ninguna decisión de planificación. La forma real del detalle V2 es una
precondición de Slice 4 y cloud un gate remoto autorizado; ambos se registran
como gates explícitos de la spec y tickets, no como supuestos.

## Out of scope

- Implementar código productivo durante Wayfinder.
- Postular, ofertar o participar directamente en Mercado Público.
- Incorporar inicialmente oportunidades que ya eran históricas o terminales.
- Ampliar V1 o CSV; solo se inventariarán para una retirada segura.
- Llamar la API del proveedor desde el navegador.
- Copiar literalmente el HTML, su shell, sus datos simulados o su CSS.
- Crear un sistema de diseño paralelo o una tabla genérica sin un segundo
  consumidor demostrado.
- Validar cloud sin acceso y credenciales explícitamente autorizados.
- Renombrar paquetes o imports heredados `twenty-*`.
