## Context

G2 lane B termina el workspace de lectura. La base ya registra cambios
semánticos en `mp.v2_history`; cada fila contiene el estado semántico antes y
después, las observaciones de origen y sus tiempos. Activas ya expone una
población filtrada y analítica completa mediante `mercadoPublicoV2`.

El seam correcto es el namespace GraphQL autenticado, no una ruta que consulte
SQL desde el cliente ni un nuevo producto de comprador. El cliente compone rutas
de lectura locales con Apollo, React Router y tokens existentes de Twenty.

## Goals / Non-Goals

**Goals**

- Exponer cambios semánticos y procedencia sin mezclar el snapshot actual.
- Agrupar la demanda de la misma población que seleccionan los filtros V2.
- Llevar desde un comprador a Activas mediante una URL compartible y reversible.
- Mantener las dos vistas disponibles sólo dentro del acceso autenticado V2.

**Non-Goals**

- Añadir tablas, migraciones, ingesta, operaciones o llamadas al proveedor.
- Exponer JSON crudo, errores técnicos, comandos de SyncRun o un detalle de
  comprador.
- Duplicar primitives, navegación global, tokens o la tabla metadata-driven.

## Boundary and Ownership

### GraphQL read boundary

`MercadoPublicoV2NamespaceResolver` conserva la Interface pública. Añade
campos `history` y `buyers` que delegan en lectores dedicados. El Adapter de
Historial exige `codigo` y sólo consulta sus filas de `mp.v2_history` y
metadatos de `mp.v2_observation`. No une `mp.gold_detected_process`; así no
puede sustituir un evento histórico por un snapshot actual. Esta restricción
usa el índice existente por oportunidad y evita una consulta global o una
migración fuera del alcance.

El Adapter de Compradores parte de la misma población V2 que Activas. Se extrae
el builder de filtro y validación actual a un helper interno pequeño para que
`opportunities`, `analytics` y `buyers` mantengan un solo contrato SQL.

### Product route boundary

Las páginas V2 conservan URL, shell y autenticación de Twenty. Una navegación
local privada compone Activas, Historial y Compradores. Cada agregado usa
`buyerCode` como identidad y conserva el nombre sólo como etiqueta. Al
seleccionar un comprador, navega a
`/mercado-publico?buyer=<buyerCode>` sin `replace`; Back vuelve a Compradores
con su URL previa. Las oportunidades sin `buyerCode` aportan a la cobertura,
pero no forman un agregado ni una selección navegable.

Historial usa `/mercado-publico/historial?codigo=<codigo>`. La página sólo se
abre desde el detalle de la oportunidad o con un `codigo` válido en la URL. Si
falta, muestra una instrucción sin consultar el historial global.
El detalle sólo añade este enlace de lectura; no cambia su contrato ni sus
datos.

## Decisions

1. Crear lectores de Historial y Compradores separados.

   Rationale: `MercadoPublicoV2ReadService` ya contiene el contrato de
   Activas. Separar consultas temporales y agregadas mantiene Locality y evita
   convertirlo en un módulo de lectura sin límite.

   Alternatives considered:
   - Extender `MercadoPublicoV2ReadService` con todas las consultas.
     - Rejected because mezcla tres modelos de lectura y agranda su Interface.
   - Consultar SQL en las páginas React.
     - Rejected because rompe autenticación, encapsulación y testabilidad.

2. Historial expone un resumen de diff derivado de las claves semánticas ya
   versionadas, más procedencia y tiempos.

   Rationale: el resumen es estable, útil y no publica JSON de evidencia ni
   errores internos. La fuente es append-only.

   Alternatives considered:
   - Mostrar `before_json` y `after_json` completos.
     - Rejected because aumenta superficie de datos y no mejora la tarea.
   - Unir el evento con `gold_detected_process` para completar campos.
     - Rejected because mezcla el presente con el hecho histórico.

3. Compradores agrega la población filtrada y devuelve cobertura y frescura.

   Rationale: la demanda debe ser factual. `buyerCoverage` es la razón entre
   oportunidades con `buyerCode` y la población filtrada. `amountCoverage` es
   la razón entre oportunidades con monto válido y las oportunidades del
   agregado. `availability` es `available`, `partial` o `unavailable` según
   esas coberturas; `completeness` sólo es completa cuando ambas son 100 %.
   `asOf` es la observación más reciente disponible. No se devuelve un total
   monetario ni se convierten monedas. Los valores faltantes siguen siendo
   faltantes; no se estiman desde la página.

   Alternatives considered:
   - Agregar las filas visibles en el navegador.
     - Rejected because pierde páginas y crea cifras falsas.
   - Crear un detalle o perfil persistente de comprador.
     - Rejected because está fuera del alcance de Issue 27.
   - Normalizar monedas y calcular un total monetario.
     - Rejected because requiere una política de conversión y datos de tipo de
       cambio fuera del alcance.

4. Las rutas reutilizan la guardia existente de workspace y no exponen acciones
   operativas.

   Rationale: el namespace V2 ya protege lectura. La UI no requiere un rol ni
   una capacidad nueva para ocultar datos de operación.

   Alternatives considered:
   - Añadir una guardia de analista nueva.
     - Rejected because no existe una política adicional que imponer.
   - Confiar sólo en ocultar enlaces.
     - Rejected because no protege consultas directas.

5. Compradores agrupa y filtra por `buyerCode`.

   Rationale: el código es estable para agrupación y ya funciona con el filtro
   de Activas. El nombre puede cambiar y sólo se muestra como etiqueta.

   Alternatives considered:
   - Agrupar por nombre normalizado.
     - Rejected because puede unir compradores distintos o separar el mismo
       comprador tras un cambio de nombre.
   - Usar código y nombre como clave compuesta.
     - Rejected because cambia el contrato de URL sin mejorar la identidad.

6. Historial se limita a una oportunidad identificada por `codigo`.

   Rationale: el historial sirve para auditar un hecho y usa el índice ya
   disponible por oportunidad. No exige una migración ni una consulta global.

   Alternatives considered:
   - Exponer un feed global de cambios.
     - Rejected because su coste y ordenación requieren una decisión de
       rendimiento fuera de este cambio.
   - Exponer un feed global con filtro opcional por oportunidad.
     - Rejected because añade la complejidad del feed global sin necesidad
       para la auditoría de una oportunidad.

## Blast Radius

### Touched runtime areas

- DTOs y campos del namespace `mercadoPublicoV2`.
- Lectura SQL V2, con helper de filtros compartido.
- Rutas React, navegación local y páginas de Historial/Compradores.
- Codegen GraphQL y pruebas unitarias, de integración y Playwright.

### Untouched runtime areas

- Ingesta V2, `SyncRun`, migraciones y esquema `mp`.
- SidePanel, detalle V2, payload sanitizado y relaciones hijas.
- Centro de control, V1, CSV y prototipos retirables.

## Risks / Trade-offs

- [Datos históricos incompletos] → Renderizar valores no disponibles y no
  complementar desde `gold_detected_process`.
- [Deriva entre filtros de Activas y Compradores] → Un helper SQL único y una
  prueba que compara población y agregados.
- [Cursores inestables] → Ordenar Historial por `created_at, id` y Compradores
  por clave de comprador estable con desempate.
- [Ruta visible sin acceso] → Mantener `WorkspaceAuthGuard` en el namespace y
  probar rutas autenticadas.

## Migration Plan

No hay migración. La entrega queda detrás de la bandera V2 existente. El
rollback elimina las nuevas rutas y campos GraphQL del despliegue; no modifica
evidencia ni datos persistidos.

## Verification Strategy

- La primera prueba de Historial falla si se consulta una fila de
  `gold_detected_process` o si no se muestra procedencia/diff.
- La primera prueba de Compradores falla si la consulta no comparte el filtro
  parametrizado de Activas o inventa cobertura/montos.
- Playwright crea o selecciona un workspace aislado con datos V2 sembrados y
  autentica por el flujo real. Abre ambas rutas, verifica
  loading/vacío/error/poblado, usa teclado y confirma que Back restaura
  Compradores después de ir a Activas. No simula respuestas GraphQL ni depende
  de datos residuales del Compose.

## Open Questions

Ninguna. El alcance usa la evidencia y las decisiones cerradas de Issues 25 y
26; no amplía el contrato de detalle.
