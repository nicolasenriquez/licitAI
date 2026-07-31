---
type: research
title: "Ítems de Compra Ágil V2: fuente, persistencia y disponibilidad para ofertar"
description: "Investigación de los endpoints oficiales Compra Ágil V2 y de la ruta de ingestión del repositorio."
---

# Ítems de Compra Ágil V2: fuente, persistencia y disponibilidad para ofertar

Fecha de revisión: 2026-07-30

## Conclusión ejecutiva

Compra Ágil V2 es una familia de procesos distinta de una licitación V1; no se
debe tratar como una variante de `licitacion`. Para saber qué bienes o servicios
debe cotizar un proveedor, el endpoint de listado **no basta**: `GET
/v2/compra-agil` entrega `payload.items[]` con un resumen del proceso (código,
nombre, estado, fechas, institución, montos resumidos, documentos y
paginación), pero no entrega `productos_solicitados[]`.

El endpoint de detalle, `GET /v2/compra-agil/{codigo}`, sí entrega el detalle
necesario: `productos_solicitados[]` con código de producto/servicio, nombre,
descripción, cantidad y unidad de medida. La guía oficial además describe el
detalle como incluyendo productos solicitados, proveedores, montos y documentos.

En el código actual del repositorio hay una pérdida material entre esa fuente y
la vista de aplicación:

* El cliente conserva el JSON completo en `rawPayload` y la persistencia lo
  guarda en `mp.raw_api_payload.raw_payload`.
* El tipo de registro y el staging solo proyectan campos compactos (título,
  comprador, estado, vínculo OC, ventanas/fechas y región). Los arrays
  `productos_solicitados[]` y `proveedores_cotizando[]`, además de descripción,
  entrega, presupuesto detallado y flags, no se copian al staging ni al
  canónico.
* Existe una tabla canónica `mp.compra_agil_producto_solicitado` y el lector de
  detalle la consulta, pero la búsqueda estática del código no encuentra ningún
  `INSERT`/`UPDATE` que la alimente desde la respuesta V2. Por tanto, con el
  flujo actual, los ítems pueden existir solo dentro del JSON crudo y no estar
  disponibles en `items` de la respuesta de detalle de proceso.

Resultado práctico: para proporcionar elementos a una licitación/Compra Ágil,
hay que consultar el detalle por código y, en este repositorio, todavía falta
materializar esos productos en la tabla canónica que usa la lectura de detalle.

## Qué declara la fuente oficial

Fuente primaria: [Guía de uso API Compra Ágil V2, versión 3.0 (mayo de 2026)](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil.pdf).

La guía identifica dos endpoints principales (p. 5): listado/búsqueda
`/v2/compra-agil` y detalle `/v2/compra-agil/{codigo}`. El listado es paginado,
mientras que el detalle es el proceso completo (PDF, pp. 5–7).

### Listado (`payload.items[]`)

La referencia de campos del listado (PDF, p. 8) enumera `codigo`, `nombre`,
estado, convocatoria, documentos, fechas, montos, institución, resumen,
motivos y enlace de detalle. No aparece `descripcion` de la necesidad ni
`productos_solicitados[]` en ese contrato. La propia guía usa el listado para
imprimir código, nombre y estado, y para recorrer paginación (PDF, pp. 13–16).

### Detalle (`payload`)

La referencia de campos del detalle (PDF, pp. 8–10) agrega, entre otros:

* `descripcion` de la necesidad publicada;
* `entrega.direccion_entrega` y `entrega.plazo_entrega_dias`;
* presupuesto completo y vínculo a la OC;
* `productos_solicitados[]`:
  `codigo_producto`, `nombre`, `descripcion`, `cantidad`, `unidad_medida`;
* `proveedores_cotizando[]` y sus líneas cotizadas (PDF, pp. 10–11).

La guía recomienda detectar una OC haciendo primero listado y después detalle:
`orden_compra.id_orden_compra` no nulo es el indicador confiable (PDF, p. 16).
Esto confirma que el listado sirve para descubrir códigos y el detalle para
obtener la información operativa completa.

La [noticia oficial de ChileCompra sobre la nueva API](https://www.chilecompra.cl/2026/05/chilecompra-presenta-nueva-api-compra-agil-en-feria-de-estado-abierto-2026/)
describe la API como acceso directo a datos de procesos Compra Ágil y señala
que la versión beta fue disponibilizada el 22-05-2026. La [página oficial de API](https://www.chilecompra.cl/api/)
enlaza la guía específica de Compra Ágil.

## Qué hace el repositorio

### Llamadas y extracción

* `getList` llama al endpoint de listado, normaliza estado/fechas y devuelve
  `rawPayload`, `compraAgil` y paginación ([cliente, líneas 113–181](../../packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service.ts:113)).
* `getByCodigo` llama a `.../v2/compra-agil/{codigo}` pero reutiliza el mismo
  extractor tipado ([cliente, líneas 184–245](../../packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service.ts:184)).
* El tipo `MercadoPublicoApiV2CompraAgilRecord` contiene campos compactos
  (`codigo`, `nombre`, estado, institución, montos, documentos, convocatoria,
  OC), pero no declara `descripcion`, `entrega`, `presupuesto`,
  `productos_solicitados` ni `proveedores_cotizando` ([tipo, líneas 28–64](../../packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type.ts:28)).
* El extractor exige únicamente un `codigo` y devuelve el objeto propagado con
  spread; por ello los campos desconocidos pueden sobrevivir en memoria, pero
  no quedan disponibles en el contrato TypeScript ni se proyectan por sí solos
  ([extractor, líneas 22–30 y 49–82](../../packages/twenty-server/src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util.ts:22)).

### Persistencia de fuente frente a staging/canónico

La tabla raw conserva `raw_payload jsonb` junto con checksum, esquema,
parámetros y endpoint ([migración raw, líneas 12–37](../../packages/twenty-server/src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload.ts:12)). El método común de persistencia serializa el
`rawPayload` completo ([persistencia, líneas 507–568](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service.ts:507)).

En cambio, `persistV2CompraAgilSnapshot` inserta en staging solamente 22
columnas: `codigo`, título, comprador, estado, tres campos de OC, ventanas de
consulta, fechas raw/normalizadas, región y `fetched_at` ([persistencia, líneas 652–728](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service.ts:652)). La tabla staging base y sus campos de browse reflejan la misma
proyección ([migración staging, líneas 12–40](../../packages/twenty-server/src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007830-mp-stg-api-v2-compra-agil.ts:12), [campos browse, líneas 12–20](../../packages/twenty-server/src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1785354861317-mp-compra-agil-v2-browse-fields.ts:12)).

El refresh canónico vuelve a copiar únicamente esos campos compactos; no lee
`raw_payload` para construir productos o cotizaciones
([refresh canónico, líneas 326–428](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service.ts:326)).

### Tabla de productos y lectura de detalle

El modelo canónico sí define `mp.compra_agil_producto_solicitado` con código,
ordinal, nombre y cantidad ([migración canónica, líneas 40–57](../../packages/twenty-server/src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007880-mp-canonical-compra-agil.ts:40)). El lector de detalle espera que esa tabla esté poblada y la convierte en `items` ([SQL de lectura, líneas 119–127](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service.ts:119), [mapeo, líneas 373–381](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service.ts:373)).

Sin embargo, el writer de V2 solo inserta en `mp.stg_api_v2_compra_agil`; la
búsqueda estática de `packages/twenty-server/src` no encuentra un writer para
`mp.compra_agil_producto_solicitado`. En consecuencia, el campo `items` del
detalle de proceso no puede derivarse automáticamente del `productos_solicitados`
que trae el API.

El mismo lector obtiene desde el JSON raw estado, fechas adicionales, montos,
motivos, documentos, institución y convocatoria, pero tampoco expone productos
ni cotizaciones ([lectura raw, líneas 227–308](../../packages/twenty-server/src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service.ts:227)).

## Matriz de pérdida por capa

| Dato oficial V2 | Listado | Detalle fuente | `raw_api_payload` | Staging/canónico actual | Lectura de proceso |
| --- | --- | --- | --- | --- | --- |
| Código, nombre, estado, institución, fechas | Sí (resumen) | Sí | Conservado | Sí, parcialmente normalizado | Sí |
| `descripcion` de necesidad | No documentado en listado | Sí | Conservado | No | No |
| `productos_solicitados[]` (código/nombre/descripción/cantidad/unidad) | No | Sí | Conservado dentro de JSON | **No proyectado** | Tabla prevista, pero sin writer V2 |
| `proveedores_cotizando[]` y líneas cotizadas | No | Sí | Conservado dentro de JSON | **No proyectado** | No |
| `entrega.*`, presupuesto detallado, flags | No | Sí | Conservado dentro de JSON | **No proyectado** | No |
| Documentos, montos resumidos, convocatoria | Sí | Sí | Conservado | Staging no los materializa | Parte de `compraAgilSource` |

## Dictamen

1. **Para descubrir oportunidades:** usar listado V2; contiene suficientes
   campos para indexar, filtrar y decidir qué códigos requieren consulta de
   detalle.
2. **Para proporcionar bienes/servicios a una oferta:** usar siempre detalle
   V2; ahí están los elementos solicitados y su cantidad/unidad.
3. **Estado del repo:** la fuente completa no se pierde del todo porque queda
   en `raw_api_payload`, pero sí se pierde para las lecturas tipadas/canónicas.
   La brecha concreta es persistir `productos_solicitados[]` (y, si el alcance
   lo requiere, cotizaciones) en sus tablas canónicas antes de afirmar que una
   Compra Ágil contiene ítems entregables.
