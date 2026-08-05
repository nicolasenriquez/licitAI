# Reconstrucción profesional de Mercado Público Compra Ágil V2

Status: ready-for-agent

## Problem Statement

El analista de compras necesita encontrar, filtrar y revisar oportunidades de
Compra Ágil con datos confiables, completos y trazables. La solución actual no
ofrece una frontera coherente: mezcla generaciones de ingesta, contratos V1,
CSV, proyecciones parciales, prototipos y una ruta cuyo foco principal es la
operación. Esto dificulta saber qué representa cada dato, si una cifra cubre el
universo completo, por qué cambió una oportunidad y qué evidencia del proveedor
respalda la vista.

La reconstrucción debe partir desde `main`, usar exclusivamente la API V2 y
preservar la evidencia pública en el esquema `mp`, sin convertirla en objetos
CRM por tenant. Debe reemplazar progresivamente la experiencia existente sin
promover código de prototipo, sin cargar miles de registros en el navegador y
sin perder rollback. La ingesta manual y diaria deben compartir una única
orquestación durable; la interfaz web nunca debe llamar al proveedor ni ejecutar
la ingesta dentro de una request.

El resultado debe ser verificable localmente con autenticación real, roles,
fixtures V2, Docker Compose y pruebas end-to-end. La forma real de los detalles
V2 y cualquier validación cloud se tratan como gates explícitos de ejecución,
no como supuestos ni como bloqueos para esta especificación.

## Solution

Construir un workspace autenticado y de solo lectura para Mercado Público, con
`Activas` como entrada principal y con `Historial`, `Compradores` y `Centro de
control` como superficies separadas. La experiencia productiva seguirá la
composición B6 aprobada: búsqueda y filtros primero, tabla exacta como superficie
central, resumen factual y analítica secundaria colapsable, y detalle lateral
que conserva el contexto.

Un módulo profundo de ingesta V2 recibirá intenciones y producirá ejecuciones
durables `SyncRun`. El pipeline descubrirá oportunidades publicadas y
participables, congelará y checkpointará cohortes, hidratará detalles, conservará
payloads y observaciones inmutables, actualizará proyecciones trazables y seguirá
cada oportunidad hasta terminalidad verificable. Replay, backfill,
reconciliación, ejecución diaria y ejecución manual reutilizarán esta misma
orquestación.

Un contrato interno aditivo `mercadoPublicoV2` encapsulará el esquema `mp` y
expondrá conexiones keyset, detalle e hijos paginados, analytics sobre la
población filtrada completa y payload sanitizado bajo acción explícita. La UI
reutilizará shell, routing, SidePanel, primitives, tokens, estados y patrones de
accesibilidad de Twenty. La transición se entregará mediante slices verticales
protegidas por una bandera local hasta alcanzar paridad, ensayar rollback,
observar dos ciclos diarios correctos y retirar el código desplazado en orden
inverso de dependencia.

## User Stories

1. Como analista de compras, quiero entrar a Mercado Público y llegar a las oportunidades activas, para comenzar directamente mi trabajo de búsqueda.
2. Como analista de compras, quiero buscar por texto relevante, para localizar una oportunidad sin recorrer páginas manualmente.
3. Como analista de compras, quiero filtrar por estado y cohorte, para concentrarme en oportunidades participables o en seguimiento.
4. Como analista de compras, quiero filtrar por organismo, RUT y región, para revisar demanda de compradores específicos.
5. Como analista de compras, quiero filtrar por fechas de cierre, para priorizar oportunidades dentro de mi ventana operativa.
6. Como analista de compras, quiero filtrar por documentos, llamado, monto y moneda, para reducir resultados usando evidencia real del proveedor.
7. Como analista de compras, quiero ordenar resultados con estabilidad, para recorrer páginas sin duplicados ni saltos.
8. Como analista de compras, quiero que la búsqueda, filtros, orden y cursor vivan en la URL, para compartir y recuperar exactamente mi contexto.
9. Como analista de compras, quiero que Back y Forward restauren el listado y el detalle, para navegar sin perder trabajo.
10. Como analista de compras, quiero recibir un aviso accesible cuando un cursor venza, para volver a la primera página sin resultados reconstruidos en cliente.
11. Como analista de compras, quiero ver una tabla de cinco columnas con oportunidad, comprador/región, cierre, monto y antecedentes, para revisar rápidamente los hechos principales.
12. Como analista de compras, quiero distinguir estado y llamado dentro de la identidad de la oportunidad, para interpretar su etapa sin agregar ruido de columnas.
13. Como analista de compras, quiero ver montos decimales exactos con su moneda fuente, para evitar conversiones o redondeos implícitos.
14. Como analista de compras, quiero ver fechas normalizadas en `America/Santiago` y poder consultar su valor ISO y zona, para interpretar cierres sin ambigüedad.
15. Como analista de compras, quiero distinguir cero, ausencia informada y dato aún no disponible, para no confundir evidencia con fallos de hidratación.
16. Como analista de compras, quiero abrir una oportunidad en un panel lateral, para investigar sin salir del listado.
17. Como analista de compras, quiero enlazar directamente una oportunidad y restaurar el panel abierto, para compartir una investigación reproducible.
18. Como analista de compras, quiero revisar necesidad, entrega, institución, fechas y monto en secciones claras, para entender el contexto comercial.
19. Como analista de compras, quiero paginar documentos, ítems, cotizaciones y ofertas dentro del detalle, para consultar relaciones grandes sin descargar todo el payload.
20. Como analista de compras, quiero revisar el ciclo de vida y los motivos observados, para comprender por qué una oportunidad está activa o histórica.
21. Como analista de compras, quiero consultar procedencia, observación y versiones de normalización, para auditar de dónde salió cada proyección.
22. Como analista de compras, quiero revelar el JSON original sanitizado sólo cuando lo solicite, para inspeccionar evidencia sin penalizar la navegación normal.
23. Como analista de compras, quiero que ninguna relación abra o consulte directamente al proveedor, para mantener seguridad, trazabilidad y estabilidad.
24. Como analista de compras, quiero ver un resumen factual del universo filtrado completo, para tomar decisiones sin métricas fabricadas desde la página visible.
25. Como analista de compras, quiero explorar analítica secundaria de prioridad operativa, demanda y competencia observada, para profundizar sólo cuando lo necesite.
26. Como analista de compras, quiero que cada visualización vuelva a oportunidades concretas, para verificar cualquier agregado contra sus registros fuente.
27. Como analista de compras, quiero que la competencia use sólo procesos terminales con ofertas observadas, para evitar conclusiones prematuras.
28. Como analista de compras, quiero revisar compradores en una superficie separada, para explorar demanda sin mezclarla con la tabla activa.
29. Como analista de compras, quiero seleccionar un comprador y volver a Activas o Historial con el filtro aplicado, para continuar la investigación en oportunidades reales.
30. Como analista de compras, quiero consultar Historial separado de Activas, para distinguir seguimiento vigente de oportunidades terminales.
31. Como analista de compras, quiero conservar filtros de comprador al cambiar entre Activas e Historial, para mantener continuidad analítica.
32. Como analista de compras, quiero usar la experiencia con teclado, foco visible y lector de pantalla, para completar las mismas tareas sin ratón.
33. Como analista de compras, quiero usar la experiencia con zoom al 200 %, reduced motion y temas claro/oscuro, para trabajar según mis necesidades de accesibilidad.
34. Como analista de compras móvil, quiero que cada resultado se apile sin ocultar silenciosamente datos, para revisar oportunidades en una pantalla de 390 px.
35. Como analista de compras, quiero estados claros de carga, vacío, error y disponibilidad parcial, para entender si faltan resultados o datos.
36. Como operador, quiero acceder a un Centro de control separado, para gestionar sincronizaciones sin interferir con el trabajo del analista.
37. Como operador, quiero iniciar una sincronización manual indicando alcance y confirmación, para ejecutar una intención consciente y auditada.
38. Como operador, quiero que reenviar la misma orden con su clave idempotente devuelva el resultado original, para evitar ejecuciones duplicadas.
39. Como operador, quiero reutilizar una corrida diaria compatible ya activa, para no crear trabajo redundante.
40. Como operador, quiero ver etapa, progreso, alcance, tiempos, resultado y errores sanitizados de un `SyncRun`, para supervisar la operación con seguridad.
41. Como operador, quiero reanudar un `SyncRun` parcial desde sus pendientes, para recuperarlo sin redescubrir la cohorte.
42. Como operador, quiero cancelar una corrida de forma cooperativa y conservar su checkpoint, para detenerla sin corromper evidencia.
43. Como auditor, quiero una bitácora inmutable de actor, intención, alcance, clave idempotente, tiempos e intentos, para reconstruir cada acción operativa.
44. Como administrador, quiero gestionar identidades sin recibir poderes funcionales extra sobre sincronización, para mantener separación de responsabilidades.
45. Como analista, quiero que la ruta directa al Centro de control devuelva un estado estándar sin acceso y sin datos operativos, para que la autorización también se cumpla en backend.
46. Como responsable de datos, quiero preservar cada payload aceptado y cada observación de request, para mantener evidencia incluso cuando el contenido no cambie.
47. Como responsable de datos, quiero distinguir tiempo del proveedor, tiempo observado y tiempo persistido, para explicar la historia temporal de una oportunidad.
48. Como responsable de datos, quiero que estados nuevos, nulos o discordantes permanezcan visibles y no terminalicen automáticamente, para evitar pérdida silenciosa.
49. Como responsable de datos, quiero que replay y backfill creen filas faltantes desde evidencia retenida, para reparar proyecciones sin volver a consultar al proveedor.
50. Como responsable de datos, quiero que el watermark avance sólo tras una ejecución completa, para no saltar oportunidades después de un fallo.
51. Como desarrollador, quiero un único contrato de `SyncRun` para scheduler, operación manual, replay, backfill y reconciliación, para evitar pipelines divergentes.
52. Como desarrollador, quiero una conexión keyset limitada y determinista, para ofrecer paginación escalable sin cargar miles de filas en el navegador.
53. Como desarrollador, quiero DTOs V2 propios y generados, para desacoplar producto de tipos V1 y del proveedor.
54. Como desarrollador, quiero reutilizar shell, SidePanel, primitives y tokens de Twenty, para mantener consistencia sin crear un sistema visual paralelo.
55. Como desarrollador, quiero una composición read-only local para resultados V2, para evitar forzar evidencia pública a objetos CRM editables.
56. Como revisor, quiero que cada slice tenga contrato, fixtures, migración reversible, rollback y evidencia antes de empezar, para controlar riesgo de entrega.
57. Como revisor, quiero que cada slice demuestre comportamiento externo mediante pruebas unitarias, integración y Playwright, para cerrar trabajo con evidencia verificable.
58. Como responsable de release, quiero activar la nueva ruta sólo después de paridad autenticada y rollback ensayado, para reducir el riesgo de cutover.
59. Como responsable de release, quiero conservar ruta previa y compatibilidad durante dos ciclos diarios correctos, para disponer de una ventana real de observación.
60. Como mantenedor, quiero retirar consumidores, UI temporal y servicios desplazados sólo cuando exista cero uso demostrado, para eliminar deuda sin romper dependencias.

## Implementation Decisions

### Autoridad, alcance y transición

- La reconstrucción nace en una rama nueva desde `main`. La rama de trabajo
  anterior y los OpenSpecs previos son evidencia para salvamento selectivo, no
  bases de merge.
- Quedan prohibidos merge, rebase y cherry-pick masivo desde la rama congelada.
  Cada pieza rescatada exige consumidor actual, prueba, compatibilidad V2 y un
  responsable claro.
- Se pueden portar fixtures V2 sanitizadas, contratos pequeños de extracción,
  normalización temporal, utilidades HTTP/reintento V2, evidencia raw redactada
  y pruebas de SidePanel/foco. Pipeline, persistencia, proyecciones, GraphQL,
  Command Center, workspace, migraciones y harness se reescriben.
- Una bandera local protege la ruta V2 completa. No se usa como experimento
  parcial ni mezcla dos composiciones dentro de la misma superficie.
- El trabajo avanza secuencialmente por Gate 0, slices 1–5 y gate final. Dentro
  de una slice sólo se paraleliza después de estabilizar su seam.

### Modelo de dominio y ciclo de vida

- Una oportunidad raíz se identifica por `codigo`; cada convocatoria es una
  etapa versionada de esa raíz.
- Sólo el estado `publicada` entra por descubrimiento inicial. Una oportunidad
  incorporada continúa en seguimiento aunque cambie a `cerrada`, quede
  `desierta` en primer llamado o tenga proveedor seleccionado sin orden de
  compra verificable.
- Son terminales `cancelada`, `desierta` en segundo llamado y selección con
  `id_orden_compra` o `id_oc` verificable.
- Estados nuevos, nulos, desconocidos o discordantes nunca se descartan ni se
  vuelven terminales automáticamente. `estado.codigo` discrimina; identificador
  y glosa se preservan como evidencia.
- Se conservan por separado `provider_changed_at`, `observed_at` y
  `persisted_at`. Fechas locales sin offset se interpretan en
  `America/Santiago` conservando también el valor original.
- La marca de agua usa cambios válidos del proveedor y un solapamiento de
  seguridad. Sólo avanza después de una ejecución completa.

### Orquestación de ingesta V2

- El módulo recibe un `SyncIntent` de tipo `scheduled`, `manual`, `replay`,
  `backfill` o `reconcile`, con alcance y actor opcional, y devuelve un
  `SyncRun` durable.
- `SyncRun` transita por `queued`, `discovering`, `hydrating`, `projecting` y
  `reconciling`, hasta `succeeded`, `partial_failed`, `failed` o `cancelled`.
  Expone cohorte, checkpoints, contadores y errores con etapa, alcance,
  posibilidad de reintento y causa protegida.
- Descubrimiento correcto congela la cohorte. Páginas y oportunidades quedan
  checkpointadas; reanudar procesa pendientes y redescubrir crea otra corrida.
- Existe una sola escritura V2 activa por alcance global. Una solicitud manual
  compatible retorna la corrida activa; un alcance incompatible queda en cola.
- Cada oportunidad confirma evidencia y proyección de forma atómica. Un fallo
  de detalle conserva la última proyección válida, registra el error y permite
  seguir la cohorte. Un fallo sistémico o descubrimiento no confiable falla la
  corrida.
- La deduplicación usa `codigo`, tiempo de cambio del proveedor y hash del
  payload. El hash cubre timestamps nulos o defectuosos.
- Scheduler, web y CLI son adaptadores. La web sólo autoriza y solicita trabajo
  asíncrono; nunca consulta al proveedor ni ejecuta ingesta en la request.

### Evidencia, persistencia e historial

- Toda evidencia pública vive en el esquema `mp`, separada de objetos CRM y de
  metadata por tenant.
- El payload crudo es un blob inmutable deduplicado por checksum. Cada request
  aceptado crea una observación inmutable que conserva corrida, endpoint,
  parámetros, tiempos, origen y referencia al blob, aun si el contenido ya
  existía.
- Staging es reproducible desde la observación. `current` mantiene una fila
  mutable por `codigo`. `history` es append-only y registra sólo cambios
  semánticos con before/after y observaciones de origen.
- Documentos, ítems, cotizaciones, ofertas y demás arrays reales se modelan
  como relaciones hijas `mp`, usando clave estable del proveedor o, si falta,
  ordinal más checksum. La evidencia conserva siempre el array original.
- `null`, cadena vacía y cero son valores distintos. Los montos usan decimal y
  moneda fuente; no existe conversión implícita a CLP.
- Cada proyección conserva `observationId`, fingerprint del esquema del
  proveedor y versión del normalizador. El read model también se versiona.
- Replay y backfill operan sobre evidencia retenida, son idempotentes y crean
  proyecciones, historial e hijos faltantes. Volver a consultar al proveedor es
  una sincronización distinta.
- Toda modificación de schema se implementa mediante comando de instancia
  generado, inmutable y reversible con `up` y `down`.

### Contrato interno de lectura

- El namespace aditivo `mercadoPublicoV2` encapsula proyecciones, paginación,
  orden, filtros, agregaciones, procedencia y disponibilidad. No expone tipos
  V1 ni tipos o nombres internos del proveedor.
- `opportunities(filter, cursor, sort)` devuelve conexión keyset con cursor
  opaco, `edges`, `pageInfo` y `totalCount` confiable. Todo orden permitido usa
  `codigo` como desempate; el máximo es 100 filas.
- Búsqueda y filtros de cohorte/estado, texto, organismo/RUT, región, fechas,
  documentos, llamado, monto y moneda se ejecutan en servidor. Rangos inválidos
  o filtros contradictorios producen error de entrada; cero filas es normal.
- `opportunity(codigo)` devuelve snapshot estructurado, ciclo de vida,
  procedencia y conexiones keyset independientes para relaciones hijas.
- `analytics(filter)` comparte exactamente los filtros de negocio, omite
  cursor y calcula métricas, buckets y cobertura sobre la población filtrada
  completa. Expone población, hora de cálculo, frescura y completitud.
- `rawPayload(observationId)` devuelve un solo JSON sanitizado, checksum y
  procedencia tras acción explícita. Nunca forma parte de listados o analytics.
- `null` representa ausencia conocida en fuente. Disponibilidad explícita
  distingue `unavailable`, `not_applicable` y fallo parcial. Las respuestas
  incluyen `asOf`, observación, versión y frescura.
- Los DTOs V2 son propios, aditivos y pasan por codegen. Cambios incompatibles
  crean un campo o tipo nuevo y deprecación explícita del anterior.

### Roles, autorización y operación

- Analista sólo consulta Activas, Historial, Compradores y detalle. Operador
  añade acceso al Centro de control. Administrador gestiona identidades, sin
  una capacidad funcional adicional sobre sincronizaciones.
- Resolver y backend aplican la guardia de workspace y rol. Ocultar navegación
  no sustituye autorización.
- Inicio y cancelación muestran alcance y requieren confirmación. Reanudar el
  mismo run recuperable no requiere una confirmación nueva.
- Cada orden confirmada usa una `idempotencyKey` UUID persistida con actor,
  intención y alcance. Repetirla devuelve el resultado original.
- Cancelación en cola es inmediata; cancelación activa es cooperativa después
  de la operación atómica en curso, conserva checkpoint y permite reintento.
- Auditoría inmutable conserva actor, acción, intención, alcance, clave,
  timestamps, corrida resultante e intentos. La UI muestra errores sanitizados;
  la causa técnica queda en logs protegidos.

### Arquitectura de información y navegación

- `Mercado Público` es una entrada fija de primer nivel en la navegación de
  Workspace. La raíz `/mercado-publico` abre `Activas`.
- Las superficies hermanas son `/mercado-publico/historial`,
  `/mercado-publico/compradores` y
  `/mercado-publico/centro-de-control`.
- La navegación local ordena Activas, Historial, Compradores y, separada al
  final sólo para operador, Centro de control.
- La URL serializa superficie, búsqueda, filtros, orden, cursor y proceso
  seleccionado. Back cierra primero el panel; Back/Forward restaura el estado.
  Escribir búsqueda reemplaza la entrada actual; filtros aplicados y paginación
  crean historia navegable.
- Un cursor inválido vuelve a la primera página con aviso accesible. No se
  reconstruyen resultados en cliente.
- Compradores es analítica separada. Elegir comprador navega a oportunidades
  con filtro aplicado. No existe detalle de comprador ni comparación de
  oportunidades.
- Gates globales de autenticación, suspensión y onboarding se resuelven antes
  de cargar el shell Mercado Público.

### Composición y presentación productiva

- B6 define intención y jerarquía, pero se reescribe desde cero. Ningún TSX,
  HTML, CSS, dato simulado, switcher o agregación del prototipo pasa a
  producción por copia.
- La jerarquía primaria es búsqueda/filtros, tabla exacta y detalle lateral.
  La secundaria es resumen factual y analítica colapsable de prioridad
  operativa, demanda y competencia observada.
- La tabla desktop contiene exactamente cinco columnas: Oportunidad,
  Comprador/región, Cierre, Monto y Documentos/ofertas. Estado y llamado viven
  dentro de Oportunidad.
- El panel progresa por identidad/estado/llamado; fechas y monto;
  necesidad/entrega/comprador; hijos paginados; ciclo/motivos/procedencia; y
  disclosure del JSON sanitizado.
- `null` se presenta como “No informado por fuente”; `unavailable` como “Aún
  no disponible” con causa y reintento cuando aplique; cero se muestra como
  cero.
- Textos largos ocupan hasta dos líneas en tabla con acceso por foco a contenido
  completo. Estados combinan texto y color. Fechas muestran hora Santiago con
  valor ISO/zona accesible; montos muestran moneda fuente.
- En móvil cada fila apila título/estado, cierre/monto y luego comprador/región/
  antecedentes. A 200 % de zoom la tabla desktop conserva scroll horizontal
  accesible. No se ocultan campos silenciosamente.
- Se excluyen comparación, score, elegibilidad, probabilidad de adjudicación,
  categorías inferidas, notas/guardados locales, calendario, radar y mesa de
  decisión como superficies primarias.

### Seams nativos de Twenty

- Twenty conserva shell, routing, autenticación, navegación, SidePanel, foco,
  stack, primitives, iconos, feedback, skeletons, paginación, modales, temas,
  tokens, motion y patrones responsive.
- Una página V2 registrada en el SidePanel compone el detalle y usa identidad
  de proceso por instancia.
- `MercadoPublicoV2Results` es un módulo profundo local de lectura: traduce DTO
  V2 a tabla, estado URL, keyset, foco y aperturas del SidePanel mediante una
  interfaz pequeña.
- No se utiliza `RecordTable` metadata-driven: presupone records CRM editables,
  metadata, permisos, selección y drag/drop incompatibles con esta proyección
  pública read-only.
- No se crean primitives, paletas, escalas o tokens específicos de Mercado
  Público. Una extracción a la librería compartida exige segundo consumidor
  real y contrato estable.

### Slices, cutover y retiro

- Gate 0 establece rama nueva, salvamento aprobado, bandera local, Compose y
  harness reproducible, con baseline verde.
- Slice 1 entrega el camino dorado completo: fixture V2, `SyncRun`, evidencia,
  proyección, GraphQL keyset, Activas autenticada y SidePanel.
- Slice 2 entrega confiabilidad: descubrimiento, hidratación, checkpoints,
  deduplicación, replay, historial y observabilidad.
- Slice 3 entrega workspace: búsqueda, filtros URL, orden, analytics de universo
  completo, estados y accesibilidad, todavía sin operación.
- Slice 4 entrega investigación: detalle enriquecido, hijos paginados,
  procedencia, JSON sanitizado, Historial y Compradores.
- Slice 5 entrega operación: iniciar, reanudar y cancelar `SyncRun`, auditoría,
  exclusión mutua y denegación al analista.
- Gate final exige paridad autenticada, cambio de ruta, dos ciclos diarios V2
  correctos, harness completo y rollback ensayado.
- La retirada sigue orden inverso: consumidores/rutas GraphQL y UI; CSS,
  stories y prototipos; finalmente servicios V1/CSV y migraciones no adoptadas.
- Cada borrado exige búsqueda de repo, grafo/imports, pruebas, smoke autenticado
  y diff visual que demuestren cero consumidores. Rollback cambia ruta/bandera
  y preserva evidencia `mp`.

### Autoridad posterior a la spec

- El flujo aprobado es `/to-spec` → `/to-tickets`. Los tickets serán tracer
  bullets demoables, con blockers explícitos y tamaño ejecutable en un contexto
  fresco.
- Después de crear tickets, el usuario decide individualmente si cada ticket
  requiere OpenSpec. Schema/migraciones, GraphQL o contratos cross-package,
  permisos, ingesta/evidencia, rollout/cutover y decisiones arquitectónicas son
  señales obligatorias para proponerlo.
- Un ticket sólo puede implementarse directamente cuando es acotado y no toca
  esos riesgos.
- El OpenSpec activo de analytics deja de recibir trabajo dentro de esta
  reconstrucción y se marcará `superseded` cuando esta spec sea aprobada,
  preservándolo como evidencia enlazada.

## Testing Decisions

### Principios

- Las pruebas validan comportamiento externo observable en el seam más alto
  que permita diagnosticar el fallo. Roles, texto visible, estado de URL,
  GraphQL, datos persistidos y resultados de `SyncRun` importan más que detalles
  internos de componentes.
- Cada slice comienza con fixtures y escenarios representativos, contrato
  explícito, migración reversible cuando aplique y rollback definido.
- Cada slice termina con pruebas unitarias e integración enfocadas, Playwright
  autenticado, accesibilidad, evidencia visual revisada, observabilidad y
  umbrales locales de rendimiento verdes.
- No se acepta éxito de una suite amplia como sustituto de la prueba del seam
  propietario. Se ejecutan primero checks estrechos y luego validaciones de los
  paquetes afectados.

### Seams de prueba

- El seam de ingesta es `SyncRun`: se prueba la misma orquestación con intents
  scheduled, manual, replay, backfill y reconcile; checkpoints, idempotencia,
  exclusión, reanudación, cancelación y fallos parciales se observan desde su
  contrato durable.
- El seam de persistencia prueba la cadena observación → staging → current/
  history/hijos → read model. Debe demostrar deduplicación, atomicidad,
  trazabilidad, creación de faltantes, nulo/vacío/cero, moneda y tiempos.
- El seam de lectura es el namespace GraphQL `mercadoPublicoV2`. Integración
  con base de datos demuestra filtros parametrizados, keyset estable,
  `totalCount`, detalle/hijos, disponibilidad, autorización y analytics
  independientes del cursor.
- El seam principal de producto son las rutas autenticadas reales, el estado de
  URL y el SidePanel. Playwright demuestra tareas completas de analista y
  operador, no componentes aislados.
- Migraciones se validan con `up` y `down`; cambios GraphQL requieren codegen y
  revisión de compatibilidad de consumidores.

### Harness local

- Cada ejecución usa Docker Compose limpio con almacenamiento aislado y un
  manifest versionado de fixtures V2 sanitizadas para Activas, Historial,
  poblado, vacío, carga, error, parcial, valores ausentes y relaciones grandes.
- El provisioner es idempotente e introduce fixtures mediante `SyncRun` y el
  normalizador real; nunca inserta directamente las proyecciones esperadas.
- Se crean identidades desechables de analista y operador. Credenciales sólo
  llegan por variables de entorno y no se versionan en fixtures, repositorio,
  `storageState` ni artefactos.
- Playwright inicia sesión por la UI y regenera `storageState` en cada corrida.
  Cubre Activas, Historial, Compradores y, sólo para operador, Centro de control.
- Matriz obligatoria: desktop 1440, laptop 1280 y móvil 390; temas claro y
  oscuro; estados carga, vacío, error, parcial y poblado; teclado, foco, zoom
  200 %, reduced motion y Axe.
- Cada caso conserva screenshot y trace. Falla ante error de consola, operación
  GraphQL inesperada, llamada del navegador al proveedor o violación de
  accesibilidad.
- Baselines visuales sólo cubren rutas estables. Toda actualización exige diff
  revisado por humano, motivo explícito y repetición de viewport/tema.
- Rendimiento local sirve para detectar regresiones comparables; no declara un
  SLA cloud.

### Gates específicos

- Gate de lifecycle: estados desconocidos y discordantes permanecen en cohorte;
  primer llamado desierto y selección sin OC no terminalizan prematuramente.
- Gate de evidencia: repetir payload no duplica blobs, pero conserva una nueva
  observación; un cambio semántico crea historial y mantiene procedencia.
- Gate de analytics: mismo filtro selecciona la misma población para listado y
  agregados; cambiar página u orden no altera resultados analíticos.
- Gate de seguridad: analista no ve ni ejecuta Control; ruta directa tampoco
  filtra datos operativos. Proveedor nunca recibe llamadas desde navegador.
- Gate de navegación: deep links, Back/Forward, filtros, cursor y panel se
  restauran; cursor inválido degrada con aviso accesible.
- Gate de cutover: ruta nueva y anterior pasan smoke; rollback está ensayado;
  dos ciclos diarios correctos y un harness completo preceden cualquier retiro.
- Gate cloud: sólo se habilita con URL, identidad, autorización y datos
  permitidos. Ejecuta un smoke autenticado sin versionar secretos ni evidencia
  sensible y no bloquea la aceptación local.

### Prior art

- Se reutilizan los patrones existentes de autenticación y rutas profundas de
  Twenty, SidePanel y retorno de foco, GraphQL/codegen, comandos de instancia
  reversibles, tests de servicios de lectura con PostgreSQL y pruebas
  productivas de Mercado Público.
- Las stories y prototipos previos son evidencia de estados y composición, no
  una segunda autoridad de producto ni código reutilizable automáticamente.

## Out of Scope

- Implementar código productivo como parte de esta especificación.
- Postular, ofertar, adjudicar o participar directamente en Mercado Público.
- Comparar oportunidades, calcular scores, inferir elegibilidad o probabilidad
  de adjudicación, o crear categorías no respaldadas por fuente.
- Incorporar inicialmente oportunidades que ya eran históricas o terminales
  antes del descubrimiento de la nueva cohorte.
- Ampliar V1 o CSV. Sólo se conservan temporalmente para compatibilidad y retiro
  seguro.
- Llamar la API del proveedor desde el navegador o enlazar relaciones como una
  vía de consulta directa al proveedor.
- Cargar el universo completo de oportunidades o relaciones en el navegador.
- Convertir evidencia pública `mp` en objetos CRM tenant-scoped o forzarla a
  `RecordTable` metadata-driven.
- Copiar literalmente el HTML/TSX B6, su shell, sus datos simulados, sus
  agregaciones locales o su CSS.
- Crear un sistema de diseño, primitives, tokens, tabla genérica o librería de
  componentes paralelos sin segundo consumidor demostrado.
- Crear un producto de detalle de comprador, notas, guardados, decisiones
  locales, calendario, radar o mesa de decisión como superficie primaria.
- Inferir valores ausentes, convertir monedas implícitamente o fabricar
  métricas desde la página visible.
- Renombrar paquetes o imports heredados `twenty-*`.
- Validar cloud sin acceso, credenciales, autorización y alcance de datos
  explícitos.
- Borrar evidencia V2, transformar datos V1/CSV durante cutover o eliminar
  código antes de demostrar reemplazo y cero consumidores.

## Further Notes

- Esta spec sintetiza el Wayfinder cerrado y congelado. Sus decisiones y
  evidencia permanecen indexadas en [el mapa](map.md).
- El vocabulario canónico distingue `SyncIntent` (solicitud), `SyncRun`
  (ejecución durable), cohorte (conjunto congelado tras descubrimiento),
  observación (request aceptado con procedencia), evidencia (payload inmutable),
  `current` (snapshot mutable), `history` (deltas append-only) y read model
  (proyección versionada para producto).
- `null` significa ausencia conocida en fuente; `unavailable` significa que el
  valor todavía no puede entregarse; `not_applicable` significa que no
  corresponde. Ninguno equivale a cero o cadena vacía.
- Antes de implementar Slice 4 se debe inspeccionar evidencia real del endpoint
  de detalle y fijar relaciones/campos desde esa evidencia. La spec prohíbe
  inventarlos mientras ese gate no se cumpla.
- La rama y OpenSpecs anteriores se preservan como evidencia. No reciben trabajo
  nuevo de esta reconstrucción.
- Próximo paso: ejecutar `/to-tickets` sobre este documento. El usuario conserva
  autoridad para decidir OpenSpec por ticket una vez publicado el grafo de
  tracer bullets.
