# Definir el contrato interno de lectura

Type: grilling
Status: resolved
Blocked by: 04, 05

## Question

¿Qué contrato GraphQL o interno necesita el workspace para listar, buscar,
filtrar, ordenar, agregar y abrir detalles/payloads sobre el universo completo
sin exponer el contrato del proveedor ni cargar todo en el navegador?

## Decision record expected

- DTOs y null semantics para lista, detalle, analytics y estados parciales.
- Cursor/paginación, límites máximos y total confiable.
- Filtros, búsqueda y ordenamiento soportados por servidor.
- Agregaciones independientes de la página visible.
- Contrato de detalle enriquecido, payload sanitizado y disponibilidad.
- Compatibilidad, permisos y estrategia de codegen.

## Comments

- 2026-08-04 — Decisión humana: el listado usa cursor opaco/keyset con orden
  estable y desempate por `codigo`; máximo 100 resultados. Montos se exponen
  como decimal serializado (`String`) más moneda fuente; filtros y agregaciones
  se calculan en servidor.
- 2026-08-04 — Decisión humana: `null` expresa ausencia conocida en fuente;
  `unavailable` expresa hidratación pendiente, fallo parcial o no aplicable.
  Listado, detalle y analytics exponen `asOf`, `observationId`, cobertura y
  frescura; las agregaciones se calculan sobre la población filtrada completa.
- 2026-08-04 — Decisión humana: el detalle operativo es liviano; cada relación
  hija se pagina. El JSON crudo sanitizado se consulta separadamente y solo por
  acción explícita para una observación concreta, con procedencia y versiones;
  nunca forma parte del listado.
- 2026-08-04 — Decisión humana: se expone un namespace aditivo
  `mercadoPublicoV2` con `opportunities`, `opportunity`, `analytics`,
  `rawPayload` y relaciones hijas paginadas. Sus DTOs son propios, pasan por
  codegen y no reutilizan ni exponen tipos V1 o del proveedor; los permisos
  concretos quedan para el ticket de control de sincronización.

## Answer

El contrato interno de lectura se expone bajo el namespace aditivo
`mercadoPublicoV2`. Es un módulo profundo de lectura: recibe filtros y cursores
de producto, encapsula la proyección `mp`, paginación, orden, agregación,
trazabilidad y disponibilidad; no expone el payload ni los tipos de la API V2.

- **Listado:** `opportunities(filter, cursor, sort)` devuelve una conexión
  keyset con `edges`, `pageInfo` y `totalCount` confiable sobre la población
  filtrada. El cursor es opaco; cada orden permitido termina con `codigo` como
  desempate estable. El máximo es 100 filas y nunca se ofrece una consulta sin
  límite. Filtros y búsqueda se resuelven en servidor para cohorte/estado,
  texto, organismo/RUT, región, fechas, documentos, llamado y monto/moneda.
  Rangos inválidos o combinaciones contradictorias responden error de entrada;
  cero resultados es un resultado normal.
- **Valores y disponibilidad:** cada valor de negocio conserva su semántica:
  `null` significa ausencia conocida en la fuente, y una disponibilidad
  explícita distingue `unavailable`, `not_applicable` y los fallos parciales.
  Montos son decimal serializado como `String` junto a moneda fuente, sin
  conversión CLP implícita. Cada respuesta incluye `asOf`, `observationId`,
  versión de normalizador/esquema y estado de frescura; el modelo no mezcla
  nulo, vacío y cero.
- **Detalle:** `opportunity(codigo)` devuelve el snapshot estructurado de una
  Compra Ágil, sus hechos de ciclo de vida, procedencia y conexiones keyset
  independientes para documentos, ítems, cotizaciones y otros hijos. Abrir el
  detalle no descarga el payload completo.
- **Evidencia:** `rawPayload(observationId)` devuelve un único JSON sanitizado,
  su checksum y procedencia solamente después de la acción explícita del
  usuario. No existe en listados ni analytics. Su autorización detallada se
  decide en [Definir permisos y control de sync](06-definir-permisos-y-control-de-sync.md).
- **Analytics:** `analytics(filter)` recibe el mismo filtro de negocio (sin
  cursor), calcula métricas, buckets y cobertura sobre todo el universo
  filtrado y declara población, hora de cálculo, frescura y completitud. Nunca
  deriva números desde las filas visibles.
- **Evolución:** DTOs V2 propios, aditivos y generados mediante codegen. Toda
  incompatibilidad futura crea campo/tipo V2 nuevo y depreca explícitamente el
  anterior; no se reutilizan contratos V1, `Float` de dinero ni nombres del
  proveedor. La guardia de workspace se aplica en el resolver; roles y alcance
  fino no se adelantan a la decisión de permisos.
