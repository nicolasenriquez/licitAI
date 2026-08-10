# Seleccionar la composición productiva del workspace

Type: grilling
Status: resolved
Blocked by: 08

## Question

¿Qué variante o combinación acotada debe convertirse en la experiencia
productiva y qué elementos de las otras variantes deben descartarse?

## Decision record expected

- Elección humana justificada por tareas, veracidad, consistencia Twenty,
  accesibilidad, responsive y costo técnico.
- Jerarquía primaria/secundaria del workspace.
- Elementos absorbidos, rechazados y motivos.
- Criterios que impiden transformar el prototipo en código permanente por
  accidente.

## Answer

Decisión humana confirmada: B6 define la composición productiva, reescrita
desde cero sobre contratos, shell, componentes, tokens y estados nativos de
Twenty.

- Jerarquía primaria: búsqueda y filtros de mercado; tabla exacta de
  oportunidades; detalle lateral que conserva contexto.
- Jerarquía secundaria: resumen factual del universo filtrado; inteligencia
  colapsable de prioridad operativa, demanda y competencia observada. Cada
  visualización devuelve a oportunidades concretas.
- Se absorben: filtros y perspectiva analítica como estado URL compartible;
  separación entre Activas, Historial, Compradores y Centro de control;
  detalle con ciclo, documentos, motivos y procedencia.
- Se adaptan: analítica únicamente sobre población completa resuelta en
  backend; accesibilidad, responsive, foco, teclado, zoom 200 %, reduced
  motion y estados loading/empty/error son requisitos de producción.
- Se descartan: calendario, radar y mesa de decisión como composición primaria;
  comparación, score o elegibilidad inferida; guardados/notas/decisiones
  locales; switcher, datos simulados, agregaciones locales y componentes del
  prototipo.

Guardrail: B6 es referencia visual e intención, nunca código promovible. Toda
implementación posterior debe reconstruirse y eliminar prototipos temporales.
