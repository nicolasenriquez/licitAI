# Design Brief — Workspace Mercado Público V2

Type: design-brief
Status: confirmed
Applies to: issues/18-35 (tickets de la reconstrucción V2)
Mode: Operate

## 1. Job y audiencia

- **Analista de compras** (Chile), autenticado, en jornada: barrido diario de
  Compra Ágil — buscar, filtrar, revisar oportunidades atendibles, confirmar
  evidencia, decidir dónde participar. Sesiones de minutos por proceso;
  contexto compartible y restaurable.
- **Operador** secundario (solo Centro de control): supervisa e inicia
  sincronizaciones.
- Superficie: workspace read-only de Twenty, con "Mercado Público" como entrada
  fija de primer nivel y cuatro superficies hijas.

## 2. Resultado y prueba

- **Tarea primaria:** de búsqueda → fila → detalle lateral sin perder el
  listado; todo contexto restaurable por URL (deep links, Back/Forward).
- **Éxito observable:** el analista filtra, abre detalle desde una fila
  seleccionada, consulta hijos paginados y procedencia, y vuelve exactamente a
  su listado. El operador inicia/reanuda/cancela un `SyncRun` con confirmación
  y traza.
- **Verdad de producto:** métricas sobre el universo filtrado completo (nunca
  desde la página visible); `null` / `unavailable` / `not_applicable` / cero
  distinguibles; montos decimales con moneda fuente; fechas en
  `America/Santiago` con ISO/zona accesible; cero llamadas del navegador al
  proveedor.

## 3. Dirección seleccionada

- **Autoridad visual:** mundo Twenty incumbente (tokens `themeCssVariables`,
  SidePanel, drawer, primitives). B6 define composición e intención, no
  código — se reescribe desde cero, sin copiar HTML/TSX/CSS del prototipo ni de
  v1.
- **Tesis estructural:** jerarquía primaria búsqueda/filtros → tabla exacta →
  detalle lateral; secundaria resumen factual + analítica colapsable.
  Superficies separadas: Activas (raíz), Historial, Compradores, Centro de
  control.
- **Momento focal:** apertura del SidePanel desde fila seleccionada — la fila
  conserva contexto visual y el foco retorna a ella al cerrar.
- **Consecuencia de implementación:** entrada fija de drawer (sección custom;
  el drawer es metadata-driven), registro del SidePanel en tres puntos (enum
  `SidePanelPages` en twenty-shared, `SIDE_PANEL_PAGES_CONFIG` en
  twenty-front, apertura con `useNavigateSidePanel`); tabla local read-only con
  `StyledTable` (RecordTable excluido); gráficos nivo vía `GraphWidget*`;
  estado de vista serializado en la URL.

## 4. Alcance y fronteras

- **Sí:** Activas (búsqueda, filtros URL, orden keyset, cursor, tabla de cinco
  columnas), SidePanel de detalle progresivo, Historial, Compradores, Centro de
  control (operador), resumen factual + analítica, estados completos,
  responsive y accesibilidad.
- **Fuera (anti-metas):** comparación, score/elegibilidad, guardados/notas,
  calendario, radar, mesa de decisión, detalle de comprador, RecordTable,
  primitives/tokens paralelos, llamadas al proveedor desde el navegador, carga
  del universo completo en el navegador.
- **Nombres:** slice 1 = Activas + SidePanel (tickets 19/22); después 23–24,
  26–27 y 28–31.

## 5. Estados y rangos

- **Estados:** loading (skeleton), empty (cero filas es normal), error
  (reintento, errores sanitizados), parcial (disponibilidad declarada, sin
  inventar cifras), poblado. Cursor inválido → primera página con aviso
  accesible.
- **Datos:** filtros de texto, estado, cohorte, organismo/RUT, región, fechas,
  documentos, llamado, monto y moneda; máximo 100 filas por página; detalle con
  hijos paginados (documentos, ítems, cotizaciones, ofertas); cohortes de
  decenas a cientos de oportunidades; relaciones grandes posibles.

## 6. Interacción y layout

- **Navegación:** entrada fija "Mercado Público" de primer nivel; sub-nav local
  Activas / Historial / Compradores y, separada al final solo para operador,
  Centro de control. La URL serializa superficie, búsqueda, filtros, orden,
  cursor y proceso seleccionado. Back cierra primero el panel; Back/Forward
  restaura el estado.
- **Activas:** barra de búsqueda; filtros con chips activos y disclosure "más
  filtros"; strip factual (población, hora de cálculo, frescura, completitud);
  tres secciones colapsables — prioridad operativa, demanda y competencia
  observada (solo procesos terminales con ofertas) — cada una con drill-down a
  filas concretas; tabla de cinco columnas: Oportunidad (estado + llamado en la
  identidad), Comprador/región, Cierre (hora Santiago + ISO/zona accesible),
  Monto (decimal, moneda fuente), Documentos/ofertas. Texto largo de hasta dos
  líneas con reveal por foco. Fila seleccionada → SidePanel.
- **SidePanel:** progresión identidad/estado/llamado → fechas/monto →
  necesidad/entrega/comprador → hijos paginados → ciclo/motivos/procedencia →
  disclosure explícito del JSON sanitizado. Focus return a la fila.
- **Historial:** cambios semánticos + procedencia, sin mezclar snapshots
  actuales.
- **Compradores:** demanda agregada con cobertura y frescura; elegir comprador
  navega a Activas con el filtro aplicado.
- **Centro de control:** lista de `SyncRun` (etapa, progreso, alcance, tiempos,
  resultado, errores sanitizados), iniciar (alcance + confirmación +
  idempotencia), reanudar (sin re-confirmar), cancelación cooperativa;
  auditoría visible.
- **Responsive y accesibilidad:** móvil 390 apila la fila título/estado →
  cierre/monto → comprador/región/antecedentes; zoom 200 % con scroll
  horizontal accesible; claro/oscuro automático; teclado + Axe; reduced motion.

## 7. Restricciones y decisiones abiertas

- Español vía Lingui; tokens de Twenty únicamente; foco y stack del SidePanel
  nativos; skeletons nativos.
- **Decisión abierta (gate slice 4, ticket 25):** la forma real del detalle V2.
  Este brief fija el armazón progresivo; las secciones concretas
  (necesidad/entrega/comprador, relaciones) se confirman contra evidencia real
  del endpoint antes de implementarse.
- Autoridad: este brief es referencia única de UX/UI para tickets 18–35.
  Refinamientos posteriores pasan por los comandos de impeccable sobre el
  código productivo.
