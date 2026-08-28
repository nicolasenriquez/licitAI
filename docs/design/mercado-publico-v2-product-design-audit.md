---
type: design-audit
title: Auditoría UX/UI de Mercado Público V2
description: Especificación ejecutable para corregir el flujo de Procesos y conectarlo con investigación CRM.
okf_version: "0.1"
status: proposed
---

# Auditoría UX/UI de Mercado Público V2

## Propósito y alcance

Este documento convierte la auditoría de Mercado Público V2 en una especificación ejecutable. Cubre solo el flujo observado de `Procesos`: filtros, resultados, detalle, relaciones, datos técnicos, historial y recuperación de errores. `Compradores` y `Control de sincronización` quedan fuera.

La audiencia principal es una pyme chilena con uno a tres operadores. Su trabajo principal es encontrar procesos, revisar evidencia pública y marcar un proceso para investigación en el CRM. La interfaz debe conservar la densidad y los componentes de Twenty. No debe añadir dashboards decorativos, puntuaciones, probabilidades, rentabilidad ni datos derivados sin respaldo.

Las diez capturas curadas son la evidencia visual principal. Este documento no afirma una reproducción directa del MP4. La revisión técnica usa además el código vigente y [el contrato local](./mercado-publico-v2-ui.md). `graphify-out/graph.json` no aportó información útil para esta superficie.

## Resultado ejecutivo

| Medida | Resultado inicial | Meta de cierre |
| --- | ---: | ---: |
| Auditoría técnica | 15/20 | 18/20 o más |
| Evaluación Nielsen | 25/40 | Sin P1 abiertos |
| P0 | 0 | 0 |
| P1 | 5 | 0 |
| P2 | 8 | Sin incidencias nuevas |
| P3 | 2 | Evaluar después de P1 y P2 |

Fortalezas confirmadas:

- La URL preserva filtros, orden, cursor y proceso seleccionado.
- La lista usa tabla, caption, encabezados y elementos `time` semánticos.
- La interfaz diferencia datos conocidos, cero y datos no informados.
- Las relaciones y el payload se consultan de forma diferida.
- El código reutiliza tokens y componentes del sistema Twenty.

Riesgo central: la interfaz permite consultar procesos, pero todavía no conduce con suficiente claridad hacia una investigación CRM.

## Evidencia y método

Fuentes locales:

- `docs/design/mercado-publico-v2-ui.md`: contrato de producto y presentación.
- `packages/twenty-front/src/pages/mercado-publico/MercadoPublicoV2ActivePage.tsx`: lista, tabla, estados y paginación.
- `packages/twenty-front/src/modules/mercado-publico/components/MercadoPublicoV2FilterBar.tsx`: filtros básicos y avanzados.
- `packages/twenty-front/src/modules/mercado-publico/hooks/useMercadoPublicoV2UrlState.ts`: contrato de URL.
- `packages/twenty-front/src/modules/side-panel/pages/mercado-publico-v2/components/SidePanelMercadoPublicoV2OpportunityPage.tsx`: detalle, relaciones y payload.
- Diez capturas curadas entregadas para la auditoría.

Referencias externas:

- [Nielsen Norman Group: heurísticas de usabilidad](https://media.nngroup.com/media/articles/attachments/Heuristic_Summary_compressed.pdf).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), con énfasis en [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) y [Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html).
- [GOV.UK Design System: paginación](https://design-system.service.gov.uk/components/pagination/).
- [ChileCompra: Compra Ágil para proveedores](https://capacitacion.chilecompra.cl/mod/folder/view.php?id=21357).
- [ChileCompra: Directivas de Compra](https://www.chilecompra.cl/directivas-de-compra/).

## Flujo observado

```text
CRM
 └─ Mercado Público
     └─ Procesos
         ├─ Carga
         ├─ Resultados
         │   ├─ Aplicar filtros básicos
         │   ├─ Abrir filtros avanzados
         │   ├─ Aplicar / retirar filtros
         │   ├─ Ordenar
         │   └─ Paginar
         ├─ Abrir proceso
         │   └─ Panel de detalle
         │       ├─ Resumen
         │       ├─ Ítems y ofertas
         │       ├─ Documentos
         │       ├─ Información técnica
         │       ├─ Historial
         │       └─ Marcar para investigar
         ├─ Resultado vacío
         └─ Error recuperable
```

Regla global de estado: `q`, `cohorte`, `estado`, `buyer`, `region`, fechas, rangos, `orden`, `after` y `proceso` permanecen en la URL. Aplicar o limpiar filtros reinicia `after`, pero conserva `orden` y `proceso`. Abrir, cerrar o cambiar el panel no cambia filtros ni scroll de la tabla.

## Matriz ejecutable de pantallas y transiciones

| Pantalla o transición | Objetivo e información para decidir | Acción principal / secundaria | Estado que se conserva | Estados obligatorios | Problema y principio afectado | Corrección inequívoca | Criterio de aceptación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Entrada a Procesos | Entender alcance y comenzar una búsqueda. Necesita búsqueda, situación, región, cierre y orden. | Buscar / abrir filtros avanzados. | URL entrante completa. | Skeleton con forma de tabla; vacío útil; error único. | La jerarquía de filtros mezcla intención y rangos. Nielsen 8. | Dejar cinco controles básicos y mover el resto a grupos avanzados. | En 320 px y escritorio, los básicos aparecen antes de resultados y no hay scroll horizontal de página. |
| Aplicar filtro básico | Reducir resultados con el menor costo. | Aplicar / limpiar campo. | Orden y `proceso`; reinicia cursor. | Estado `status` al cargar; chips al éxito. | Monto compite con filtros de alta frecuencia. Nielsen 6 y 8. | Retirar monto de la fila primaria. | Cada filtro escribe el parámetro existente; cualquier cambio elimina `after`. |
| Abrir filtros avanzados | Buscar por comprador, estado o evidencia. | Aplicar filtros / limpiar grupo. | Valores no aplicados, orden y proceso. | Disclosure abierto, errores junto al campo. | Filtros largos no tienen modelo mental claro. Nielsen 2. | Agrupar en `Quién compra`, `Estado del proceso`, `Tamaño y evidencia`. | El orden de foco coincide con el orden visual; Escape cierra y devuelve foco. |
| Resultados | Comparar proceso, comprador, cierre, monto y documentos. | Abrir proceso / ordenar o paginar. | Filtros, cursor y scroll. | Carga, resultados, vacío y un solo error. | Las columnas secundarias pueden quitar ancho a datos decisivos. Nielsen 8. | Proteger `Proceso`, `Comprador` y `Cierre`; comprimir secundarias primero. | A 1280 px las tres columnas permanecen legibles con panel abierto. |
| Retirar filtros | Ampliar resultados sin perder contexto. | Retirar chip / limpiar todos. | Orden y `proceso`; reinicia cursor. | Recarga anunciada. | Riesgo de perder selección durante la consulta. Nielsen 3. | Mantener `proceso` en URL y selección visual. | Retirar uno o todos los chips no cierra el panel ni mueve el scroll. |
| Ordenar y paginar | Examinar el conjunto en secuencia estable. | Cambiar orden / anterior o siguiente. | Filtros y proceso; historial de cursores. | Botón inactivo cuando no hay destino; carga. | Una URL directa no tiene cursor anterior. Nielsen 1 y 3. | Desactivar `Anterior` sin historial y usar etiquetas de destino. | Navegación por teclado funciona; el nombre accesible indica página anterior o siguiente. |
| Abrir proceso | Revisar evidencia sin abandonar la lista. | Abrir panel / cerrar panel. | URL, filtros, cursor y scroll. | Foco al encabezado; carga local. | El panel no establece una ruta clara hacia CRM. Nielsen 1 y 7. | Abrir panel 64/36 y mostrar acción factual. | `proceso=codigo` queda en URL; cerrar devuelve foco a la fila de origen. |
| Cambiar proceso | Comparar otro proceso sin heredar estado. | Seleccionar otra fila. | Filtros y scroll. | Resumen y carga del nuevo código. | Pestaña, cursores y payload pueden pertenecer al proceso anterior. Nielsen 4 y 5. | Reiniciar pestaña, cuatro cursores, payload, errores y estados transitorios al cambiar `codigo`. | Una prueba abre una relación paginada y payload, cambia código y confirma valores iniciales. |
| Resumen del detalle | Entender estado, cierre, monto, región y límite de evidencia. | Marcar para investigar / ver historial. | Código y contexto de lista. | Carga, datos parciales, error local, éxito CRM. | La información clave no forma una franja inmediata. Nielsen 1 y 8. | Añadir franja factual y aviso de factibilidad. | La franja aparece antes del contenido secundario y usa `dd/mm/aaaa`. |
| Ítems y ofertas | Ver alcance y evidencia comercial. | Expandir sección / página siguiente. | Pestaña y código. | Carga `status`, vacío específico, error `alert`, éxito. | Fallback genérico y error sin alerta. Nielsen 9. | Usar mensajes por relación y reintento local. | Cada relación puede fallar y reintentarse sin ocultar las demás. |
| Documentos | Confirmar respaldo documental. | Abrir documento / paginar. | Pestaña y código. | `0 documentos`, no informado, no disponible, carga y error. | Documentos puede quedar oculto en overflow de pestañas. Nielsen 6. | Mantener `Documentos` siempre visible. | Las tres pestañas primarias caben o usan patrón accesible sin `+2 More`. |
| Información técnica | Diagnosticar fuente sin contaminar lenguaje de negocio. | Abrir disclosure / copiar JSON sanitizado. | Código y pestaña primaria. | Cerrado por defecto; carga diferida; error local. | Expone nombres internos y ocupa navegación primaria. Nielsen 2 y 8. | Disclosure secundario, texto monoespaciado y sanitizado. | No aparecen `fresh`, `available`, UUID ni nombres internos fuera del bloque técnico. |
| Historial | Entender qué cambió y volver al proceso. | Abrir evento / volver al detalle. | Título, código, filtros y retorno. | Con cambios, sin cambios, carga y error. | La subvista puede perder contexto; el vacío no explica qué se registra. Nielsen 3 y 10. | Mantener encabezado y explicar cambios de fuente registrados. | Volver restaura la pestaña y el scroll; vacío contiene explicación y siguiente acción. |
| Error de lista | Recuperar resultados sin rehacer búsqueda. | Reintentar / ajustar filtros. | URL completa, selección y scroll. | Un único `Callout` con `role="alert"`. | El error puede duplicarse. Nielsen 9. | Renderizar una sola región de error. | Una falla produce un Callout y el reintento usa las mismas variables. |
| Error de detalle | Recuperar el proceso en contexto. | Reintentar / cerrar. | Código, URL, filtros, selección y scroll. | `alert` dentro del panel. | El mensaje exige cerrar y abrir. Nielsen 9. | Añadir `Reintentar` que ejecute `refetch`. | El usuario recupera el panel sin cerrarlo; el foco permanece dentro del panel. |
| Marcar para investigar | Crear o recuperar el vínculo CRM. | Marcar / abrir en CRM. | Todo el contexto de consulta. | Pendiente, creado, existente, error y reintento. | No existe salida operativa explícita. Nielsen 7. | Mutación idempotente por workspace + código. | La segunda ejecución devuelve el mismo `crmRecordId` y muestra `En investigación`. |
| Adaptación móvil | Revisar un proceso con una mano y sin perder orden. | Abrir registro / filtros. | URL y selección. | Los mismos estados de escritorio. | La tabla puede forzar desplazamiento horizontal. WCAG Reflow. | Convertir filas en registros verticales en el mismo orden semántico. | A 320 px y 200 % no existe scroll horizontal de página y los objetivos son de al menos 44 × 44 px. |

## Evaluación técnica: 15/20

| Dimensión | Puntaje | Evidencia | Brecha principal |
| --- | ---: | --- | --- |
| Accesibilidad | 3/4 | Tabla, caption, encabezados, `time`, foco visible y cargas con `status`. | Errores de relaciones no usan `alert`; faltan pruebas de foco y reflow con panel. |
| Rendimiento | 4/4 | Consultas de relaciones y payload son diferidas. Se limita la tabla a 100 filas. | Validar que los cambios de pestaña no conserven resultados ajenos al código. |
| Adaptación | 3/4 | La tabla cambia a registros compactos bajo 600 px. | Falta evidencia a 320 px, zoom 200 % y panel abierto. |
| Resiliencia e i18n | 2/4 | Hay reintentos por relación y varios textos Lingui. | Error de detalle sin reintento; fallbacks sin Lingui; estados genéricos. |
| Consistencia técnica | 3/4 | Linaria, tokens y primitivas Twenty. | Pestaña técnica primaria, datos internos visibles y estado local sin reinicio por código. |

## Evaluación Nielsen: 25/40

| Heurística | Puntaje | Hallazgo principal |
| --- | ---: | --- |
| 1. Visibilidad del estado | 3/4 | Cargas visibles, pero el paso a investigación no tiene estado. |
| 2. Correspondencia con el mundo real | 2/4 | Hay términos técnicos y grupos de filtros poco naturales. |
| 3. Control y libertad | 3/4 | URL y filtros se preservan; el error del detalle obliga a cerrar. |
| 4. Consistencia y estándares | 3/4 | Buen uso de Twenty; navegación del panel se desborda. |
| 5. Prevención de errores | 2/4 | Estado del proceso anterior puede contaminar el nuevo. |
| 6. Reconocer antes que recordar | 2/4 | `+2 More` oculta destinos; filtros avanzados no muestran intención. |
| 7. Flexibilidad y eficiencia | 2/4 | Filtros y URL ayudan, pero falta entrada directa al CRM. |
| 8. Diseño estético y minimalista | 3/4 | Interfaz densa y sobria; datos técnicos compiten con trabajo principal. |
| 9. Reconocer y recuperar errores | 2/4 | Lista reintenta; detalle no reintenta localmente. |
| 10. Ayuda y documentación | 3/4 | Avisos de fuente útiles; historial vacío y rangos requieren ayuda contextual. |

Personas de prueba: Alex, operador frecuente que necesita filtros y comparación rápida; Sam, usuario de teclado, lector de pantalla o zoom; y Casey, operador móvil interrumpido. La audiencia local añade a Camila, encargada de una pyme: tiene poco tiempo, valida monto y documentos, y no acepta recomendaciones que la fuente no respalda.

## Inventario priorizado

### P1 — Corregir primero (5)

1. Reiniciar pestaña, cursores, payload, errores y estados transitorios cuando cambia `codigo`.
2. Añadir recuperación local del error del detalle con `Reintentar`.
3. Agrupar filtros por intención y mover monto fuera de la fila primaria.
4. Mantener tres pestañas visibles, eliminar `+2 More` y mover información técnica a un disclosure.
5. Añadir la entrada idempotente `Marcar para investigar` y su estado CRM.

### P2 — Claridad y consistencia (8)

1. Eliminar el error duplicado de resultados.
2. Usar `role="alert"` en errores dinámicos de relaciones.
3. Pasar todos los fallbacks por Lingui.
4. Sustituir vacíos genéricos por mensajes específicos.
5. Explicar el contenido futuro de Historial.
6. Añadir unidades y ejemplos a rangos.
7. Diferenciar `0`, `No informado por fuente` y `Aún no disponible`.
8. Mantener payload sanitizado, monoespaciado y colapsado, con copia solo en contexto técnico.

### P3 — Pulido (2)

1. Reducir mayúsculas sostenidas y subrayado excesivo de títulos.
2. Validar y ajustar foco, objetivos táctiles, temas y densidad a 320 px y 200 %.

No hay P0.

## Especificación de rediseño

### Escritorio y panel

- Con panel abierto, usar 64 % para lista y 36 % para detalle. Permitir límites adaptables para evitar que una región quede inutilizable.
- Comprimir primero región, estado, monto o documentos. Mantener legibles `Proceso`, `Comprador` y `Cierre`.
- El encabezado del detalle contiene título, código y cierre del panel.
- Mostrar de inmediato:

```text
Cierra 28 ago, 12:00 · Publicada · Región 13
CLP 300.000 · 0 documentos
```

- Mantener visibles `Resumen`, `Ítems y ofertas` y `Documentos`.
- Poner `Información técnica` en un disclosure cerrado por defecto.
- Mantener `Historial` dentro del panel o en una subvista que conserve título, código, filtros y retorno.
- Mostrar siempre: `Monto publicado por la fuente. La factibilidad no está evaluada.`
- Mostrar fechas como `dd/mm/aaaa`. Mantener valores internos ISO.
- No exponer `fresh`, `available`, UUID ni nombres internos fuera del bloque técnico.

### Entrada al CRM

Propuesta de producto; la persistencia backend es una línea de trabajo separada y debe cumplir las reglas de migración del repositorio.

```graphql
markMercadoPublicoV2ForInvestigation(
  codigo: String!
): MercadoPublicoV2InvestigationResult!
```

Resultado mínimo:

```text
codigo
crmRecordId
created
markedAt
```

Contrato:

- La clave de idempotencia es workspace + `codigo`.
- Una segunda ejecución devuelve el registro existente.
- El estado pendiente desactiva el botón y anuncia `Marcando para investigar…`.
- El éxito cambia el botón a `En investigación` y ofrece `Abrir en CRM`.
- El error conserva el panel y permite reintentar.
- La acción no infiere viabilidad, prioridad, probabilidad ni margen.

## Wireframes

Los SVG definen jerarquía, regiones, orden de lectura y navegación. Los tonos son anotaciones de estructura. La implementación debe usar los componentes, tipografía, espacios, colores y temas vigentes.

| # | Estado | Wireframe |
| ---: | --- | --- |
| 1 | Vista inicial de Procesos | [01-procesos-inicial.svg](./assets/mercado-publico-v2-audit/01-procesos-inicial.svg) |
| 2 | Filtros avanzados agrupados | [02-filtros-avanzados.svg](./assets/mercado-publico-v2-audit/02-filtros-avanzados.svg) |
| 3 | Resultados con filtros aplicados | [03-resultados-filtrados.svg](./assets/mercado-publico-v2-audit/03-resultados-filtrados.svg) |
| 4 | Tabla con panel abierto | [04-panel-abierto.svg](./assets/mercado-publico-v2-audit/04-panel-abierto.svg) |
| 5 | Resumen del proceso | [05-resumen-proceso.svg](./assets/mercado-publico-v2-audit/05-resumen-proceso.svg) |
| 6 | Ítems, ofertas y documentos | [06-relaciones-documentos.svg](./assets/mercado-publico-v2-audit/06-relaciones-documentos.svg) |
| 7 | Información técnica colapsada | [07-informacion-tecnica.svg](./assets/mercado-publico-v2-audit/07-informacion-tecnica.svg) |
| 8 | Historial en contexto | [08-historial.svg](./assets/mercado-publico-v2-audit/08-historial.svg) |
| 9 | Error de lista | [09-error-lista.svg](./assets/mercado-publico-v2-audit/09-error-lista.svg) |
| 10 | Error de detalle | [10-error-detalle.svg](./assets/mercado-publico-v2-audit/10-error-detalle.svg) |
| 11 | Confirmación de investigación | [11-confirmacion-investigacion.svg](./assets/mercado-publico-v2-audit/11-confirmacion-investigacion.svg) |
| 12 | Adaptación móvil a 320 px | [12-movil-320.svg](./assets/mercado-publico-v2-audit/12-movil-320.svg) |

Los wireframes 2, 4, 9, 10 y 12 son también las vistas anotadas de mayor fidelidad requeridas para filtros avanzados, escritorio con panel, errores y móvil.

## Orden de implementación

1. Añadir pruebas de regresión para el reinicio por `codigo` y el reintento del detalle.
2. Corregir estado local y recuperación del panel.
3. Reorganizar filtros sin cambiar parámetros URL.
4. Corregir pestañas, disclosure técnico, foco y scroll.
5. Diseñar e implementar la mutación CRM en una línea backend separada.
6. Corregir P2 de mensajes, Lingui, alertas y estados de datos.
7. Validar adaptación, temas y accesibilidad.
8. Ejecutar una pasada final de `$impeccable polish` después de las correcciones.

## Pruebas y aceptación

### Integración funcional

- Cargar una URL con filtros, orden, cursor y `proceso`.
- Aplicar y retirar cada tipo de filtro. Confirmar que el cambio reinicia paginación.
- Abrir, cerrar y cambiar procesos sin perder filtros ni scroll.
- Cambiar proceso con una relación paginada abierta. Confirmar que todos los cursores vuelven a `null`.
- Probar carga, vacío, error y reintento de lista, detalle y relaciones.
- Abrir payload, cambiar proceso y confirmar que vuelve a estar oculto y sin datos previos.
- Probar Historial con y sin cambios.
- Probar `Marcar para investigar`: nuevo, ya existente, error y reintento.

### Accesibilidad

- Verificar tabla, caption, encabezados, regiones y elementos `time`.
- Verificar orden de foco al abrir y cerrar el panel y retorno a la fila seleccionada.
- Anunciar cargas con `status` y errores con `alert`.
- Completar el flujo por teclado.
- Verificar zoom 200 %, viewport de 320 px y ausencia de scroll horizontal de página.
- Verificar contraste y foco visible en temas claro y oscuro.

### Calidad técnica

- Ejecutar pruebas relevantes, lint de archivos modificados, typecheck y build con Yarn/Nx.
- Volver a ejecutar `$impeccable audit`.
- Exigir 0 P0, 0 P1, puntaje técnico de al menos 18/20 y ninguna incidencia nueva del detector.
- Cubrir rutas, estado URL, Apollo y panel.
- Adjuntar evidencia visual de escritorio, 320 px, zoom 200 %, tema claro y tema oscuro.

## Definición de terminado

La entrega está terminada cuando todos los criterios P1 tienen pruebas, el flujo conserva URL, filtros, selección, foco y scroll, la entrada al CRM es idempotente, y la evidencia final demuestra los cinco estados visuales requeridos. Las propuestas de producto y las dependencias backend deben quedar identificadas como tales; no se deben presentar como correcciones ya implementadas.
