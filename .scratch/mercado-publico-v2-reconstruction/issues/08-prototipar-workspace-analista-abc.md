# Prototipar el workspace del analista en variantes A/B/C

Type: prototype
Status: resolved
Blocked by: 02, 07

## Question

¿Qué composición de workspace permite al analista encontrar y evaluar Compra
Ágil con mayor claridad, conservando el lenguaje visual y los patrones de
Twenty? Comparación queda explícitamente fuera por reacción humana.

## Work

- Construir siete variantes radicalmente distintas sobre el shell y ruta reales,
  seleccionables mediante `?variant=A|B|C|D|E|F|G` y un switcher temporal.
- Usar autenticación real, contratos V2 reales y estados loading/empty/error/
  partial/long/null.
- Probar tareas de búsqueda, lectura de fechas/montos/documentos,
  apertura/cierre de detalle y revelado del payload original.
- Capturar desktop, responsive, light/dark, teclado, zoom y reduced motion.
- Mantener el prototipo aislado, reversible y explícitamente desechable.

## Exit evidence

- Siete variantes navegables y evidencia reproducible.
- Matriz de tareas, fortalezas, riesgos y deuda de cada variante.
- Reacción humana informada; no seleccionar automáticamente una ganadora.

## Comments

- 2026-08-04 — Prototipo navegable y matriz de evaluación preparados en
  [`08-workspace-analista-abc.md`](../assets/08-workspace-analista-abc.md).
  Runtime Docker reconstruido y saludable; capturas automatizadas bloqueadas
  por autenticación. Pendiente inspección y reacción humana antes de resolver.
- 2026-08-04 — Segunda iteración A–G informada por investigación oficial e
  Impeccable. Comparación eliminada; gráficos Twenty, búsqueda, filtros,
  paginación, drill-down analítico y mesa de decisión añadidos.

## Answer

La reacción humana selecciona B6 como referencia preferida y reemplaza la
elección entre A–G. La decisión no promueve código de prototipo a producción:
B6 fija composición e intención; la implementación futura debe reescribirla
sobre contratos, shell, componentes, tokens y estados nativos de Twenty.

Composición validada para la siguiente decisión:

- búsqueda y filtros de mercado dominan la entrada y afectan analítica y
  resultados;
- resumen factual del universo filtrado precede un bloque analítico colapsable;
- inteligencia se organiza en tres preguntas separadas: prioridad operativa,
  demanda y competencia observada;
- cada visualización permite volver a oportunidades concretas, y la tabla
  exacta sigue siendo la superficie primaria de revisión;
- Activas, Historial, Compradores y Centro de control permanecen como
  superficies distintas; el centro de control no se mezcla con trabajo del
  analista;
- detalle lateral conserva contexto, ciclo de vida, documentos, motivos y
  procedencia sin sacar al navegador del workspace;
- filtros y perspectiva analítica son estado de URL compartible; responsive,
  teclado, foco, 200 % de zoom, reduced motion y estados loading/empty/error son
  criterios productivos, no pulido posterior.

Guardrails preservados:

- sin comparación entre oportunidades, score, elegibilidad inferida,
  probabilidad de adjudicación ni categorías inventadas;
- competencia sólo usa procesos terminales con ofertas observadas; cero ofertas
  en una oportunidad publicada no es competencia final;
- analytics, agregaciones, ranking y paginación se resuelven sobre el universo
  completo en backend, no sobre una página descargada;
- la ruta de detalle del proveedor es procedencia, no un enlace directo ni una
  llamada del navegador;
- el TSX propuesto es contrato visual de referencia: sus tipos locales,
  agregaciones, controles sustitutos y componentes extensos no son arquitectura
  productiva.

Evidencia humana:

- `C:\Users\nenri\Downloads\licitAI_compra_agil_productive_prototype_B6.html`
  (`SHA-256 12E464B4C2FA3A04BCFA30B16958966BF77B2A5FFA1AEC94E85E6AEC8906C58D`)
- `C:\Users\nenri\Downloads\MercadoPublicoCompraAgilWorkspace.B6.proposed.tsx`
  (`SHA-256 0FE3DE97AD93AF8DC8B50C9EAE4F677A699E0CB6F66B81F5924F1C3B6E338B92`)
- [`08-workspace-analista-abc.md`](../assets/08-workspace-analista-abc.md)
  conserva investigación, variantes previas y reacción.

`frontend-ui-engineering` queda requerido junto con contratos visuales Twenty
para cualquier implementación posterior. Este ticket sólo resuelve dirección
del prototipo; [Seleccionar la composición productiva del workspace](09-seleccionar-composicion-productiva.md)
debe fijar qué partes exactas de B6 se absorben, se adaptan o se descartan.
