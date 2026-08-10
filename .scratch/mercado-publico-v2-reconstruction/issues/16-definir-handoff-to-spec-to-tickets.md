# Definir el handoff a /to-spec y /to-tickets

Type: grilling
Status: resolved
Blocked by: 14, 15

## Question

¿Qué debe contener la especificación final, cómo se convertirá en tickets
verticales y qué umbral determinará si cada ticket requiere un OpenSpec propio?

## Decision record expected

- Estructura y evidencias obligatorias de `/to-spec`.
- Reglas de slicing y dependencias para `/to-tickets`.
- Matriz de riesgo para exigir OpenSpec: schema/migration, GraphQL, permisos,
  ingesta, contratos cross-package, rollout o decisión arquitectónica.
- Condiciones para implementar directamente un ticket acotado.
- Tratamiento formal del OpenSpec activo anterior como reemplazado.
- Autoridad documental durante ejecución y cierre.

## Answer

Decisión humana confirmada. El handoff no crea todavía un change: cuando la
persona invoque `/to-spec`, sintetizará un único documento final con problema,
solución, historias, decisiones 01–15, contratos, seguridad, UX, validación,
slices/gates, cutover, fuera de alcance y enlaces a toda evidencia Wayfinder.
No reinicia entrevistas ni inventa campos V2.

Tras aprobar esa spec, `/to-tickets` publica tracer bullets en la cadena Gate 0
→ slices 1–5 → cutover, con blocker explícito, comportamiento demoable y tamaño
de un contexto fresco. Un refactor ancho es la única excepción: se divide
expand–migrate–contract, manteniendo verde cada frontera.

Un ticket exige OpenSpec propio si altera schema o migración, contrato GraphQL o
cross-package, permisos, ingesta/evidencia V2, rollout/cutover o una decisión
arquitectónica. Puede implementarse directo sólo si es acotado y no toca ninguno
de esos riesgos; la spec y su ticket padre siguen mandando.

Al aprobar la nueva spec, el OpenSpec anterior de Mercado Público se marca
formalmente `superseded`: se preserva como evidencia enlazada, pero deja de
recibir tareas o decisiones. Wayfinder queda congelado como fuente histórica;
el OpenSpec aprobado, `tasks.md` y evidencia por slice son autoridad durante
ejecución. Al cierre se sincronizan specs y documentos durables.

La forma real de relaciones del endpoint de detalle es precondición de Slice 4:
se verifica con evidencia V2 antes de fijar campos; cloud queda como gate remoto
autorizado y no bloquea local. Ambas dejan de ser fog de decisión y pasan a los
gates explícitos de la spec/tickets.
