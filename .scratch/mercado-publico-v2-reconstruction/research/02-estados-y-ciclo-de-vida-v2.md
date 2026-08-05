# Compra Ágil V2: estados y ciclo de vida verificable

Fecha de investigación: 2026-08-04  
Tipo: investigación para Wayfinder  
Alcance: API V2 de Compra Ágil, dataset local, payload de detalle y pipeline actual.

## Resultado

La cohorte debe descubrirse exclusivamente cuando `estado.codigo = publicada`.
Desde ese momento, el proceso se sigue aunque deje de ser participable, hasta
observar una condición terminal verificable. `cerrada` no es terminal;
`proveedor_seleccionado` tampoco lo es por sí solo porque la API agrupa allí
casos con y sin orden de compra. El primer llamado `desierta` cierra ese llamado,
pero todavía puede anteceder un segundo llamado. Ningún dato se elimina al
terminalizar: se detiene el sondeo individual y se conserva el historial; una
observación posterior de la ventana global de cambios puede reabrir el
seguimiento.

La clasificación usa `estado.codigo` como discriminante oficial. El ID y la
glosa se conservan como evidencia, pero la documentación oficial no publica una
tabla estable de IDs numéricos. No se debe inferir participabilidad a partir de
la fecha de cierre, `fecha_cierre_segundo_llamado`, la glosa o `oc_emitida`
aisladamente.

## Fuentes y nivel de autoridad

1. **Oficial:** [Guía de uso API Compra Ágil V2](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf),
   especialmente §§5.1-6.3 y 8.6. La guía define los estados, combinaciones con
   convocatoria, `fecha_ultimo_cambio` y la comprobación de OC mediante
   `orden_compra.id_orden_compra`.
2. **Oficial:** [Centro de ayuda de Mercado Público: Compra Ágil](https://ayuda.mercadopublico.cl/preguntasfrecuentes/article/KA-01979/es-es).
   Confirma que `Publicada` recibe cotizaciones, que la edición es limitada en
   ese estado y que una compra `Cerrada` sin selección se cancela
   automáticamente después de 30 días.
3. **Oficial:** [ChileCompra: funcionamiento del segundo llamado](https://www.chilecompra.cl/2026/03/compra-agil-conoce-como-funciona-un-segundo-llamado-y-como-participar-correctamente/).
   El segundo llamado puede abrirse cuando el primero no fue adjudicado; las
   ofertas anteriores no se trasladan y permanecen como antecedente histórico.
4. **Evidencia observada:**
   `C:\Users\nenri\Downloads\compra-agil-v2-resultados-2026-08-02.json`,
   SHA-256
   `88B7D555A5C6D8CF484CF91463FD8FBEA1B7E061A370B04CBDF8A8B1EFACFA5E`.
5. **Contrato del repositorio:**
   [`docs/business/compra-agil-ai-contract.md`](../../../docs/business/compra-agil-ai-contract.md),
   [`docs/business/mercado-publico-source-contract.md`](../../../docs/business/mercado-publico-source-contract.md)
   y [`docs/operations/mercado-publico-compra-agil-v2-research.md`](../../../docs/operations/mercado-publico-compra-agil-v2-research.md).
6. **Implementación observada:** extractor, normalización temporal, tipos de
   detalle y servicio incremental bajo
   `packages/twenty-server/src/engine/core-modules/mercado-publico/`.

Las conclusiones llamadas **política propuesta** no se presentan como garantía
del proveedor.

## Perfil del dataset

El documento declara extracción `2026-08-02T17:25:32.0750192Z`, fecha solicitada
`2026-08-02`, fecha efectiva `2026-07-31` y fallback activado. Contiene 3.000
códigos únicos, pero el proveedor reportó 3.126 resultados y 63 páginas; solo se
descargaron 60 páginas. Es una muestra grande pero incompleta y ordenada por
fecha de publicación, no un catálogo histórico de transiciones.

| Estado observado | ID observado | Cantidad | Primer llamado | Segundo llamado |
| --- | ---: | ---: | ---: | ---: |
| `publicada` | 2 | 2.337 | 2.296 | 41 |
| `cerrada` | 3 | 549 | 537 | 12 |
| `cancelada` | 5 | 98 | 98 | 0 |
| `proveedor_seleccionado` | 4 | 15 | 15 | 0 |
| `desierta` | 6 | 1 | 1 | 0 |

En estos 3.000 registros no faltan código, ID, glosa, convocatoria,
`fecha_cierre` ni `fecha_ultimo_cambio`, y cada código de estado mantiene un
único par ID/glosa. Esto es evidencia del archivo, no un contrato futuro. Los
98 motivos de cancelación, el motivo de deserción y los 15 motivos de selección
coinciden con sus respectivos estados.

Contraejemplos importantes:

- 2.799 de 2.947 registros en primer llamado traen
  `fecha_cierre_segundo_llamado` no nula. Ese campo no identifica por sí solo un
  segundo llamado; manda `convocatoria.estado_convocatoria`.
- Al momento observado en Chile (`2026-08-02 13:25`) existe un registro todavía
  `publicada` cuya `fecha_cierre` ya había transcurrido. El reloj es señal de
  posible desfase, no sustituto del estado fuente.
- `fecha_publicacion` y `fecha_cierre` usan en los 3.000 casos el formato local
  sin offset `yyyy-MM-dd HH:mm`; `fecha_ultimo_cambio` y los cierres por llamado
  usan ISO-8601 con offset o `Z`.
- No se observó `oc_emitida`, coherente con la advertencia oficial de que el
  código está definido pero no se utiliza en la práctica.

## Matriz de estados

| Estado fuente y condición | Clasificación de dominio | Participable | Acción de ingesta/seguimiento | Ubicación UI | Confianza |
| --- | --- | --- | --- | --- | --- |
| `publicada`, convocatoria 1 | `OPEN_FIRST_CALL` | Sí | Descubrir si es nueva; capturar lista y detalle; incorporar a la cohorte; consultar diariamente | Activas → Participables, “Primer llamado” | Alta, oficial |
| `publicada`, convocatoria 2 | `OPEN_SECOND_CALL` | Sí | Mantener la misma oportunidad raíz, abrir una nueva etapa de llamado y capturar un nuevo detalle; no reutilizar ofertas del primer llamado | Activas → Participables, “Segundo llamado” | Alta, oficial; la identidad de UI requiere decisión |
| `cerrada`, convocatoria 1 | `CLOSED_FIRST_CALL_AWAITING_OUTCOME` | No | Mantener seguimiento diario y detalle; esperar selección, cancelación, deserción o segundo llamado; nunca terminalizar por fecha | Activas → En seguimiento | Alta |
| `cerrada`, convocatoria 2 | `CLOSED_SECOND_CALL_AWAITING_OUTCOME` | No | Mantener seguimiento diario y detalle hasta resultado final | Activas → En seguimiento | Alta |
| `desierta`, convocatoria 1 | `FIRST_CALL_ENDED_AWAITING_SECOND_CALL_DECISION` | No | Cerrar la etapa, conservar ofertas como historia y continuar seguimiento porque el segundo llamado es opcional | Activas → En seguimiento, “Primer llamado desierto” | Media-alta |
| `desierta`, convocatoria 2 | `TERMINAL_DESERTED` | No | Persistir observación final; detener sondeo individual después de detalle exitoso | Historial → Desiertas | Alta por existir solo dos convocatorias documentadas |
| `cancelada`, cualquier convocatoria | `TERMINAL_CANCELLED` | No | Persistir fecha/motivo; detener sondeo individual después de detalle exitoso | Historial → Canceladas | Alta semántica; la guía no publica una tabla formal de transiciones |
| `proveedor_seleccionado` sin `id_orden_compra`/`id_oc` | `SELECTED_AWAITING_PURCHASE_ORDER` | No | Continuar seguimiento y detalle diario; no afirmar OC emitida | Activas → En seguimiento, “Proveedor seleccionado” | Alta, oficial |
| `proveedor_seleccionado` con `id_orden_compra` o `id_oc` | `TERMINAL_SELECTED_WITH_OC` | No | Reconciliar por ID, persistir resultado y detener sondeo individual | Historial → Seleccionadas / OC emitida | Alta, oficial para emisión de OC; no significa recepción contractual |
| `oc_emitida` con ID de OC | `TERMINAL_SELECTED_WITH_OC` | No | Aceptar como alias fuente, verificar ID en detalle y reconciliar | Historial → Seleccionadas / OC emitida | Media: definido oficialmente, no observado en la práctica |
| `oc_emitida` sin ID de OC | `SOURCE_CONFLICT_AWAITING_DETAIL` | No determinada | Conservar raw, marcar anomalía, refrescar detalle y continuar seguimiento | Revisión de datos | Alta como política conservadora |
| Código nulo, vacío o nuevo | `UNKNOWN_SOURCE_STATE` | No determinada | Conservar raw sin coerción, hidratar detalle, alertar contrato y continuar seguimiento; nunca descartar ni terminalizar | Revisión de datos | Alta como política propuesta |
| Código conocido con ID/glosa discordante | Estado derivado de `estado.codigo` + `SOURCE_CONTRACT_WARNING` | Según código, con advertencia | Preservar los tres valores, refrescar detalle y emitir telemetría; no remapear por el ID observado | Ubicación del código + advertencia no intrusiva | Media-alta |

“Terminal” aquí significa fin observable del proceso Compra Ágil para este
producto. No afirma que una orden haya sido aceptada, ejecutada, recepcionada o
pagada; esos hitos pertenecen al ciclo de la OC y requieren otra fuente.

## Reglas de transición y proyección

1. La identidad raíz recomendada es `codigo`; la convocatoria es una etapa
   versionada dentro de esa raíz. Las observaciones deben preservar al menos
   `codigo + estado_convocatoria + payload raw + fecha_ultimo_cambio +
   observed_at`.
2. No imponer una máquina de estados que rechace “retrocesos”. Un cambio con
   `fecha_ultimo_cambio` posterior se acepta como nueva observación aunque
   parezca volver atrás: puede representar corrección del proveedor o apertura
   del segundo llamado. Se conserva y se marca anomalía cuando la convocatoria
   no explica el cambio.
3. Una observación atrasada se agrega al historial pero no reemplaza la
   proyección actual. Orden recomendado: `provider_changed_at` válido; luego
   `observed_at`; ante mismo tiempo y payload distinto, conservar ambos y marcar
   conflicto.
4. Al terminalizar se detiene únicamente el sondeo individual de detalle. El
   proceso sigue siendo elegible para la ventana incremental global; si aparece
   un cambio posterior, se reabre el seguimiento y se hidrata el detalle.
5. Un estado desconocido nunca entra a “Participables” y nunca detiene el
   seguimiento automáticamente.

## Semántica temporal

Se deben persistir tres relojes distintos:

| Tiempo | Origen | Uso |
| --- | --- | --- |
| `provider_changed_at_raw` y normalizado | `fechas.fecha_ultimo_cambio` | Watermark y orden de versión de fuente |
| `observed_at` | instante UTC en que el cliente recibió la respuesta | Auditoría, desempate y medición de frescura |
| `persisted_at` | commit de persistencia en PostgreSQL | Operación interna; nunca sustituye al tiempo de fuente |

La guía oficial usa ISO-8601 y `fecha_ultimo_cambio` para sincronización, pero
no declara `America/Santiago` como timezone universal del proveedor. El dataset
demuestra formatos mixtos. La política actual del repositorio es correcta y
debe conservarse: un valor con offset respeta su offset; un valor local sin
offset se interpreta en `America/Santiago`, conservando siempre el raw. Esta
regla está implementada en
`normalize-v2-compra-agil-date.util.ts:5-30`.

El watermark debe usar el máximo `provider_changed_at` válido de una ejecución
completa y una ventana solapada. No debe avanzar con ejecuciones parciales ni
comparar lexicográficamente timestamps de formatos distintos. Si la fecha es
inválida, se conserva raw, se ordena provisionalmente por `observed_at` y se
marca el registro para revisión.

## Contraste con la implementación actual

- El tipo de registro acepta `estado` escalar u objeto y mantiene fechas y
  detalle opcionales en
  `drivers/api/types/mercado-publico-api-v2-compra-agil-record.type.ts:1-127`.
- El normalizador reconoce el formato beta local y los valores con offset en
  `drivers/api/utils/normalize-v2-compra-agil-date.util.ts:5-30`.
- El servicio incremental procesa y canonicaliza todas las filas listadas,
  pero solo encola hidratación de detalle cuando el estado actual es
  exactamente `publicada`
  (`mercado-publico-api-v2-compra-agil-incremental.service.ts:205,286-303`).
  Por lo tanto, el código actual no cumple el seguimiento de la cohorte después
  del cierre ni puede verificar OC/terminalidad con detalle actualizado.
- Las fixtures locales demuestran que el detalle puede venir `cerrada` con
  `id_orden_compra`/`id_oc`, y también `publicada` sin OC:
  `drivers/api/__tests__/fixtures/v2-compra-agil-detail-with-oc.json:4-13` y
  `v2-compra-agil-detail-without-oc.json:3`.

## Casos representativos sanitizados

Los identificadores `R####` son posiciones determinísticas, 1-based, dentro
del JSON auditado; no exponen el código del proceso.

| Caso | Registro | Qué prueba |
| --- | --- | --- |
| Publicada, primer llamado | `R0001` | Camino normal de descubrimiento |
| Publicada, segundo llamado | `R0006` | Una convocatoria 2 vuelve a ser participable |
| Cerrada, primer llamado | `R0016` | Cierre no equivale a terminalidad |
| Cerrada, segundo llamado | `R1623` | Debe seguirse hasta resultado |
| Cancelada | `R0004` | Motivo condicional presente |
| Proveedor seleccionado | `R0027` | La lista no permite distinguir OC emitida |
| Desierta, primer llamado | `R0706` | Etapa cerrada que aún puede anteceder convocatoria 2 |
| Publicada con cierre transcurrido | `R1279` | El reloj no puede reemplazar el estado fuente |

## Incertidumbres que requieren decisión humana

1. **Timeout del primer llamado desierto.** La segunda convocatoria es
   opcional y la fuente no expone una señal “no habrá segundo llamado”. Decidir
   si se consulta indefinidamente o si pasa a una bandeja inactiva después de
   un plazo configurable, sin declararlo terminal como hecho del proveedor.
2. **Proveedor seleccionado sin OC.** No existe en las fuentes revisadas un
   plazo máximo verificable para que aparezca la OC. Decidir política de
   envejecimiento/escalamiento; no inventar terminalidad.
3. **Fin de ciclo del producto.** Este informe recomienda terminar en emisión
   de OC porque es el último hito confiable de la API Compra Ágil V2. Si el
   negocio exige aceptación, recepción o pago, se debe incorporar explícitamente
   el contrato de la fuente de órdenes de compra.
4. **Representación del segundo llamado.** Recomendación: una oportunidad raíz
   por `codigo` con etapas separadas y visibles. El artículo oficial llama al
   segundo llamado una publicación independiente; validar con analistas si la
   tabla debe mostrar una fila raíz o una fila por convocatoria.
5. **IDs numéricos.** El dataset observa el mapping 2-6, pero la guía no lo
   promete. No hacerlo enum contractual hasta obtener una fuente oficial o un
   contrato versionado.

## Criterios de salida para tickets posteriores

- Pruebas de contrato para todas las filas de la matriz, incluyendo estados
  desconocidos, código/glosa discordante y timestamps fuera de orden.
- Prueba de cohorte: `publicada → cerrada → proveedor_seleccionado sin OC →
  proveedor_seleccionado con OC`, manteniendo historial y deteniendo detalle
  solo al final.
- Prueba de segundo llamado: primer llamado cerrado/desierto y convocatoria 2
  publicada, sin arrastrar cotizaciones anteriores.
- Prueba temporal con formato local beta, `Z`, offset explícito, fecha inválida
  y transición de horario de verano en `America/Santiago`.
- Prueba de reapertura por una observación incremental posterior a la
  terminalización.

