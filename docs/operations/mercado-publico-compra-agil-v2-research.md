---
type: operations-guide
title: "Guía de usuario para Compra Ágil V2"
description: "Guía operativa y contrato de evidencia para extracciones paginadas, reproducibles y seguras desde la API oficial Compra Ágil V2 de ChileCompra."
okf_version: "0.1"
researched_at: "2026-08-02"
---

# Compra Ágil V2 de ChileCompra: guía de usuario para IA y operadores

## Resultado ejecutivo

La documentación del repositorio ya cubre correctamente la base de la API:
endpoint V2, header `ticket`, separación de Compra Ágil respecto de licitaciones,
paginación, preservación de evidencia raw, relación con órdenes de compra y
protección de secretos.

El diagnóstico identificó brechas para una extracción autónoma y repetible; la
guía y el cliente V2 quedaron actualizados para cubrir el flujo seguro. Las
decisiones que siguen siendo políticas del repositorio, no garantías de la API,
son:

1. La fecha solicitada por negocio debe mantenerse separada de la ventana UTC
   enviada al proveedor.
2. El fallback de fin de semana es una política del repositorio, no una regla
   oficial de la API, y no debe activarse solo porque el resultado sea pequeño.
3. Las dos fuentes oficiales no expresan exactamente igual la cuota: la página
   general indica 10.000 solicitudes diarias por ticket; la guía V2 describe una
   cuota determinada por el tipo de ticket, incluyendo `-1` como ilimitada.
4. La ejecución debe usar una matriz de errores y una regla única para
   distinguir ejecución completa de ejecución parcial.
5. El calendario de fallback y la normalización de fechas de negocio deben
   registrarse explícitamente.

La guía establece un procedimiento explícito con: objetivo
de extracción, ventana temporal, política de fallback, presupuesto de llamadas,
paginación basada en `payload.paginacion`, validación del envelope de respuesta,
persistencia por página sin headers secretos y un resultado final marcado como
`complete`, `partial`, `empty` o `failed`.

## 1. Alcance y fuentes

La investigación externa usa únicamente fuentes primarias de ChileCompra:

- [API de Mercado Público — ChileCompra](https://www.chilecompra.cl/api/),
  incluyendo sus condiciones de uso y el enlace oficial a la guía de Compra
  Ágil.
- [Guía de uso API Compra Ágil V2 — PDF oficial](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf),
  que documenta autenticación, cuota, endpoints, filtros, paginación,
  respuestas y errores.

El contraste local se hizo contra:

- [Contrato Compra Ágil V2 para agentes](../business/compra-agil-ai-contract.md).
- [Contrato de fuente Mercado Público](../business/mercado-publico-source-contract.md).
- [Runbook de ingestión Mercado Público](mercado-publico-ingestion.md).

### Etiquetas usadas en este informe

- **oficial**: afirmación expresada por la página o guía primaria de ChileCompra.
- **repository-implemented**: comportamiento documentado como existente en el
  repositorio.
- **repository-policy**: regla de seguridad u operación definida por el repo.
- **propuesta**: recomendación para que una IA pueda repetir la extracción sin
  convertir una suposición en un hecho del proveedor.

La guía oficial enlazada desde la página de API debe tratarse como una fuente
versionable y revisable: la URL contiene `2-1`, mientras el PDF presenta su
propia historia de versiones. Para futuras consultas conviene registrar la URL,
fecha de consulta y título visible del PDF, no solo el nombre del archivo.

## 2. Contrato oficial relevante

### 2.1 Autenticación y base URL

**Oficial:** la base de Compra Ágil V2 es:

```text
https://api2.mercadopublico.cl
```

Toda solicitud V2 debe llevar el ticket en el header HTTP `ticket`. La [guía
oficial, secciones 2.2-3](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
indica que la ausencia del header produce `401` y que el ticket debe guardarse
de forma segura y no incluirse en repositorios públicos.

La página general de API contiene ejemplos históricos de API V1 donde el ticket
aparece como parámetro de la URL. Ese patrón **no debe copiarse a Compra Ágil
V2**: para V2 se debe usar exclusivamente el header documentado por la guía.

### 2.2 Endpoints

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/v2/compra-agil` | Listado y búsqueda paginada. |
| `GET` | `/v2/compra-agil/{codigo}` | Detalle de una Compra Ágil. |

El código de detalle es el código externo del proceso, por ejemplo
`1057539-228-COT26` ([guía oficial, sección 5](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)).
Los ejemplos de este informe usan solo placeholders o valores públicos de
documentación; nunca un ticket real.

### 2.3 Filtros y combinaciones

La guía oficial documenta estos grupos:

| Grupo | Parámetros | Regla operativa |
| --- | --- | --- |
| Cambios | `ttl_cambio_ms` **o** `cambio_desde` + `cambio_hasta` | Elegir una alternativa dentro del grupo. |
| Publicación | `publicado_desde` + `publicado_hasta` | Ventana de fecha/hora de publicación. |
| Estado | `estado` | Varios valores separados por coma. |
| Región | `region` | Código entero entre 1 y 16; puede repetirse. |
| Búsqueda | `id` **o** `q` | Son mutuamente excluyentes. |
| Orden | `ordenar_por` | `FechaUltimaModificacion` por defecto o `FechaPublicacion`. |

La [guía oficial, secciones 5.1 y 5.2](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
no documenta `codigo_organismo`. Para acotar un organismo se debe
consultar por región cuando corresponda y filtrar localmente por los campos de
`institucion`, como RUT o nombre del organismo.

### 2.4 Fechas y horas

**Oficial:** los parámetros de fecha/hora son `datetime` ISO-8601. La [guía
oficial, sección 5.1](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
usa UTC con sufijo `Z`, por ejemplo:

```text
2026-04-01T00:00:00Z
2026-04-02T23:59:59Z
```

La guía no establece que el proveedor interprete una fecha simple como día
chileno, ni define una política de días hábiles, feriados o fallback de fin de
semana. Por tanto, esas decisiones deben estar en la solicitud y en el
resultado de la IA, no quedar implícitas.

### 2.5 Paginación

**Oficial:** la [guía, secciones 5.1 y 6.2](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
documenta `tamano_pagina` con default `15` y máximo `50`; `numero_pagina`
comienza en `1`. La respuesta informa en `payload.paginacion`:

- `total_paginas`;
- `numero_pagina`;
- `tamano_pagina`;
- `total_resultados`.

La guía recomienda incrementar `numero_pagina` secuencialmente hasta alcanzar
`total_paginas`. Para una extracción de aproximadamente 3.000 elementos, usar
`tamano_pagina=50` implica un máximo teórico de 60 llamadas de listado si todos
los elementos existen y no se deduplican; la IA debe seguir siempre el total
declarado por el proveedor y no asumir que habrá 60 páginas.

### 2.6 Envelope de respuesta y datos de detalle

Las respuestas exitosas documentadas en la [sección 6 de la guía oficial](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
tienen esta forma conceptual:

```json
{
  "success": "OK",
  "trace": null,
  "payload": {},
  "errors": null
}
```

Las respuestas de error usan `success: "NOK"`, `payload: null` y un arreglo
`errors[]` con `codigo`, `mensaje` y `detalle`. La IA debe validar tanto el
HTTP status como este envelope; un HTTP 200 no debe convertirse
automáticamente en una extracción exitosa si el envelope es `NOK`.

Para relacionar una Compra Ágil con una orden de compra, la [guía oficial,
sección 6.3](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
indica que
`orden_compra.id_orden_compra` distinto de `null` es el indicador confiable de
que existe una OC. También documenta `id_oc` como identificador adicional.
`codigo_orden_compra` puede venir `null` incluso cuando la OC existe y el
estado `oc_emitida` no aparece en la práctica como indicador suficiente.

### 2.7 Errores oficiales

La matriz siguiente resume la [sección 7 de la guía oficial](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf).

| HTTP | Significado documentado | Decisión segura |
| ---: | --- | --- |
| `400` | Parámetros inválidos o combinación no permitida. | No reintentar sin corregir parámetros. |
| `401` | Falta el header `ticket`. | Detener; no imprimir ni solicitar el secreto en texto. |
| `403` | Ticket inexistente, inactivo o bloqueado. | Detener y requerir configuración segura. |
| `404` | Código de detalle inexistente o no público. | Registrar fallo de ese detalle; no convertirlo en detalle vacío. |
| `429` | Cuota agotada. | Obedecer `Retry-After` si viene; de lo contrario esperar al siguiente día calendario según la guía. |
| `500` | Error inesperado del servidor. | Reintento acotado y luego `failed` o `partial`. |
| `503` | Servicio temporalmente no disponible. | Reintento acotado; conservar evidencia y estado. |

### 2.8 Cuota

Las fuentes oficiales deben conservarse juntas porque no expresan exactamente
la misma granularidad:

- La [página general de condiciones de uso](https://www.chilecompra.cl/api/)
  indica un límite diario de 10.000 solicitudes por ticket y recomienda
  consultas masivas entre las 22:00 y las 07:00.
- La [guía específica V2](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf)
  describe una cuota diaria determinada por el tipo de ticket, cuyo valor
  `-1` significa ilimitado, y documenta el reinicio al cambiar el día
  calendario.

**Regla conservadora:** no asumir una cuota ilimitada. Antes de
comenzar, presupuestar `páginas de listado + detalles solicitados + reintentos`
y usar como techo local el límite conocido más restrictivo. Si se recibe `429`,
no hacer reintentos inmediatos en bucle.

## 3. Diagnóstico frente al repositorio

| Tema | Estado actual del repo | Diagnóstico |
| --- | --- | --- |
| Base URL y endpoints | Alineado en el contrato de fuente y el contrato AI. | Sin brecha sustantiva. |
| Header y secreto | Alineado: `COMPRA_AGIL_API_TICKET` en configuración gestionada; no hardcodear ni serializar. | La regla operativa es header `ticket`, nunca query string. |
| Separación de dominios | Alineado: Compra Ágil no es una licitación. | Correcto; conservar. |
| Parámetros | Alineado: el cliente valida pares de fechas, exclusividad de ventanas y valores oficiales de `ordenar_por`. | El mínimo `tamano_pagina=10` sigue siendo local; no debe presentarse como límite oficial. |
| Tamaño de página | El repo exige `10..50`; la guía oficial solo fija default `15` y máximo `50`. | El mínimo 10 es una restricción del repo, no una garantía de ChileCompra. `50` es la opción operativa recomendada. |
| Paginación | Alineado: página inicial 1, recorrido secuencial, guard `MP_COMPRA_AGIL_MAX_PAGES` y raw por página. | Alcanzar el guard finaliza como `partial`; no es una extracción completa. |
| Fechas | El repo conserva ISO-8601 y usa `America/Santiago` como política de scheduling/fallback. | Falta exigir que la intención local y la ventana UTC enviada queden registradas juntas. El timezone local no es una garantía del proveedor. |
| Domingo/fallback | El repo propone una política de fallback chilena. | No es comportamiento oficial. No sustituir domingo por viernes solo por baja cantidad; hacerlo solo con objetivo o opción explícita de “último día hábil”. |
| Cuota | El repo conserva la política general de 10.000 y reconoce que la implementación actual no es un contador preventivo por ticket. | La guía futura debe reflejar la discrepancia oficial y presupuestar llamadas antes de iniciar. |
| Errores | El repo exige manejo de `429` y detalle faltante auditable. | La matriz operativa de `400/401/403/404/429/500/503`, envelope `NOK` y `Retry-After` queda definida en esta guía. |
| Respuesta y OC | Alineado: raw-first, estado escalar/objeto, `id_orden_compra`/`id_oc`, no depender de `oc_emitida`. | Correcto; mantener los campos raw aunque sean `null`. |
| Organismo comprador | Alineado: no se inventa `codigo_organismo`; se filtra localmente. | Correcto; mantener esta limitación visible para la IA. |

## 4. Procedimiento recomendado para futuras llamadas de IA

Este es el flujo recomendado para una extracción repetible. Las reglas marcadas
como propuesta son de operación del repositorio, no afirmaciones adicionales
sobre el proveedor.

### Paso 1: fijar el objetivo antes de construir la URL

La solicitud debe declarar:

- si busca publicaciones (`publicado_desde/hasta`), cambios
  (`cambio_desde/hasta` o `ttl_cambio_ms`), un código exacto (`id`) o palabras
  clave (`q`);
- el día o rango solicitado y su zona horaria de negocio;
- si busca todos los resultados o aproximadamente un número, por ejemplo
  3.000;
- si necesita solo el listado o también el detalle por cada `codigo`;
- si el fallback a un día hábil anterior está autorizado;
- el límite de llamadas disponible para la ejecución.

No iniciar una extracción si “domingo sin datos” puede significar tanto “el
domingo exacto” como “el último día hábil disponible”. Son objetivos distintos.

### Paso 2: resolver la ventana temporal

**Normalización recomendada:**

1. Interpretar el día de negocio en `America/Santiago` solo porque es la
   política local del repositorio, no porque la guía oficial lo establezca.
2. Convertir los límites a instantes UTC y enviarlos en ISO-8601 con `Z`, como
   en los ejemplos oficiales.
3. Guardar en el manifiesto de ejecución ambos valores:
   `requestedLocalWindow` y `sentUtcWindow`. En el codebase, el manifiesto se
   persiste en `mp.stg_job_run.manifest_json`.
4. No confundir fecha de publicación con fecha de último cambio.

Para el fallback:

- `empty` significa que la ventana solicitada no devolvió registros; no es un
  error y no prueba que falten datos en otra fecha.
- `low_count` no debe activar fallback automáticamente.
- Si el objetivo explícito es “último día hábil” o existe una opción de
  fallback autorizada, consultar el día hábil anterior y conservar también la
  primera consulta vacía.
- El proveedor no define en la guía el calendario de feriados chilenos. La
  elección de viernes, lunes u otro día debe provenir de una política de
  calendario separada y quedar registrada.
- El resultado debe declarar `fallback_used`, el día solicitado, el día
  efectivo y el motivo. Nunca presentar el viernes como si fuera el domingo.

### Paso 3: construir una llamada segura

Para una consulta de publicaciones, el patrón documentado es equivalente a:

```text
GET https://api2.mercadopublico.cl/v2/compra-agil
    ?publicado_desde=<UTC_INICIO>
    &publicado_hasta=<UTC_FIN>
    &tamano_pagina=50
    &numero_pagina=1
    &ordenar_por=FechaPublicacion
```

El header se inyecta desde una variable segura en tiempo de ejecución:

```text
ticket: <valor cargado desde COMPRA_AGIL_API_TICKET>
```

El placeholder no debe reemplazarse en la documentación con un valor real.
No colocar `ticket` en la URL, en una captura de pantalla, en logs, en
fixtures, en mensajes de error ni en el JSON de resultados.

Para sincronización incremental, usar `cambio_desde` + `cambio_hasta` y
`ordenar_por=FechaUltimaModificacion`, o usar `ttl_cambio_ms`; no combinar las
dos alternativas del grupo de cambios.

### Paso 4: presupuestar la extracción

Para aproximadamente 3.000 elementos con páginas de 50:

```text
llamadas_de_listado_teóricas = ceil(3000 / 50) = 60
llamadas_totales = llamadas_de_listado + detalles_solicitados + reintentos
```

El cálculo es una estimación, no una orden de hacer exactamente 60 llamadas:

- si `total_resultados` es menor, detenerse al terminar las páginas declaradas;
- si se requiere exactamente 3.000 únicos y hay duplicados entre páginas, puede
  ser necesario leer más páginas, siempre dentro del guard y la cuota;
- consultar detalles de 3.000 procesos puede añadir hasta 3.000 llamadas;
- reservar margen para errores transitorios y no empezar si el presupuesto no
  alcanza;
- mantener el recorrido secuencial para poder auditar página por página.

### Paso 5: validar la primera respuesta antes de continuar

Para cada respuesta:

1. comprobar el HTTP status;
2. parsear JSON sin registrar headers; solo conservar `Retry-After` como
   `retryAfterSeconds` cuando el proveedor lo envíe;
3. comprobar `success == "OK"`;
4. comprobar que `payload.items` y `payload.paginacion` existan en un listado
   exitoso;
5. comprobar que `numero_pagina` corresponda a la página solicitada;
6. registrar `total_paginas`, `total_resultados` y `tamano_pagina`;
7. solo entonces continuar con la página siguiente.

Una respuesta `NOK`, un payload ausente o una estructura inesperada no debe
guardarse como página vacía exitosa.

### Paso 6: recorrer páginas y consolidar

La IA debe:

- comenzar en página `1`;
- enviar `tamano_pagina=50` salvo que el presupuesto u objetivo requiera otra
  cosa;
- incrementar `numero_pagina` de uno en uno;
- detenerse al alcanzar el `total_paginas` informado por el proveedor;
- detenerse y marcar `partial` si alcanza `MP_COMPRA_AGIL_MAX_PAGES`;
- conservar una evidencia raw por página, con URL sin ticket, parámetros,
  timestamp, HTTP status, checksum del cuerpo y conteo de elementos;
- deduplicar el resultado consolidado por `codigo`, sin borrar las páginas raw;
- no afirmar “3.000 completos” si el servidor, el guard, un error o un límite
  de cuota impidió terminar.

La evidencia de la solicitud debe excluir el header `ticket`. Si se persiste la
respuesta raw, debe persistirse separada de metadatos sensibles y sin incluir
la configuración de entorno.

### Paso 7: manejar errores sin falsos éxitos

Aplicar la matriz oficial de la sección 2.7. En particular:

- `400`: corregir parámetros; no reintentar la misma llamada.
- `401/403`: detener la ejecución; revisar la configuración segura del ticket.
- `404` en detalle: registrar el `codigo` fallido y continuar solo si el modo de
  extracción lo permite; el job queda con fallos auditables.
- `429`: conservar `Retry-After` como `retryAfterSeconds` y usarlo para
  programar un reintento acotado; si no viene, esperar el siguiente día
  calendario. El cliente no hace un `sleep` automático dentro de esta llamada.
  Si ocurrió después de comenzar, conservar las páginas y marcar `partial`, no
  reiniciar ciegamente.
- `500/503`: usar reintentos limitados con espera creciente como política local;
  si no se recupera, marcar `failed` o `partial` según exista evidencia parcial.
- `success: "NOK"` con HTTP inesperado: tratar como error del proveedor y
  conservar `errors[]`, nunca como lista vacía.

### Paso 8: entregar un manifiesto de resultado

Cada job V2 de listado termina con un resumen pequeño y sin secretos. El
codebase lo persiste como `manifest_json` en `mp.stg_job_run`; no reemplaza las
respuestas raw por página:

```json
{
  "schemaVersion": 1,
  "source": "api-v2-compra-agil",
  "jobName": "api-v2-compra-agil-by-publication-window",
  "requestParams": {},
  "requestedLocalWindow": null,
  "sentUtcWindow": null,
  "fallbackUsed": false,
  "fallbackReason": null,
  "effectiveDate": null,
  "pagesRequested": 0,
  "pagesCompleted": 0,
  "providerTotalPages": 0,
  "providerTotalResults": 0,
  "rawItemsReceived": 0,
  "uniqueCodes": 0,
  "retryAfterSeconds": null,
  "status": "complete",
  "errorSummary": null
}
```

El manifiesto es telemetría, no reemplaza las respuestas raw. No debe contener
el ticket, headers, secretos ni el contenido completo de un archivo de datos.
Los estados del manifiesto son `running`, `complete`, `empty`, `partial`,
`failed`, `retryable_failed` y `param_error`. Un manifest `empty` se refleja en
el job existente como `soft_miss`, sin ampliar innecesariamente el enum de
estados persistidos.

## 5. Mantenimiento documental aplicado y pendientes

Esta guía funciona como procedimiento para agentes y operadores, mientras los
contratos existentes conservan sus responsabilidades específicas. En esta
actualización se aplicó:

1. enlazar esta guía desde índices, contrato AI, contrato de fuente, gobernanza
   y runbook operativo;
2. validar en el cliente que `ordenar_por` use valores oficiales, que las
   ventanas se envíen completas y sin mezclar alternativas, y que las fechas
   sean ISO-8601 válidas con orden temporal correcto;
3. unificar el estado de una ejecución que alcanza el guard de páginas como
   `partial` y distinguir un listado vacío como `empty` en el manifest;
4. capturar `Retry-After` sin persistir headers completos ni secretos;
5. persistir el manifest JSONB asociado al job run, con migración reversible;
6. documentar UTC, fallback explícito, presupuesto de llamadas y la matriz de
   errores;
7. conservar la fecha de consulta y las URLs oficiales para detectar cambios
   de versión o de contrato.

Queda pendiente únicamente, como decisión separada, resolver una fuente
oficial para el calendario chileno de feriados si el producto necesita
automatizar “último día hábil”. Sin esa fuente, el fallback sigue siendo
explícito y no se inventa en el código.

## Conclusión

La forma correcta de repetir una llamada V2 no es “pedir la fecha y recorrer
páginas” de manera implícita. La IA debe fijar el objetivo, convertir y
registrar la ventana temporal, consultar con `ticket` solo en header, usar
`tamano_pagina=50`, seguir `total_paginas`, respetar un presupuesto por ticket,
tratar el fallback como política explícita, distinguir vacío de parcial y
preservar evidencia por página sin secretos.

Con esas reglas, la extracción de aproximadamente 3.000 registros es
reproducible y auditable: normalmente requiere hasta 60 llamadas de listado a
50 elementos por página, pero el resultado final depende de los filtros, del
total declarado por la API y de la cuota disponible.
