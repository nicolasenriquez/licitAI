# Definir estados y ciclo de vida V2

Type: research
Status: resolved
Blocked by: none

## Question

¿Cuál es la taxonomía verificable de estados de Compra Ágil V2 y qué reglas
determinan descubrimiento, participabilidad, seguimiento, transición a Historial
y detención de consultas?

## Work

- Contrastar documentación oficial V2, dataset real de 3.000 registros, payload
  de detalle y código actual.
- Definir estados participables, transitorios, terminales y desconocidos.
- Definir reglas ante retrocesos, estados nuevos, valores nulos y códigos/glosas
  discordantes.
- Fijar semántica temporal en `America/Santiago` y diferenciar tiempo del
  proveedor, tiempo observado y tiempo persistido.

## Exit evidence

- Matriz estado fuente → estado de dominio → acción de ingesta → ubicación UI.
- Casos representativos y contraejemplos con códigos sanitizados.
- Incertidumbres que todavía requieran una decisión humana.

## Answer

Investigación resuelta en el artefacto
[`02-estados-y-ciclo-de-vida-v2.md`](../research/02-estados-y-ciclo-de-vida-v2.md).

- Descubrimiento: exclusivamente `publicada`.
- Seguimiento: `cerrada`, `desierta` en primer llamado y
  `proveedor_seleccionado` sin `id_orden_compra`/`id_oc` permanecen en cohorte.
- Terminalidad conservadora: `cancelada`, `desierta` en segundo llamado, y
  selección con orden de compra verificable. Estados nuevos, nulos o
  discordantes nunca se descartan ni terminalizan automáticamente.
- Identidad: una oportunidad raíz por `codigo`, con convocatoria como etapa
  versionada. `estado.codigo` es discriminante; ID y glosa son evidencia.
- Tiempo: preservar `provider_changed_at`, `observed_at` y `persisted_at`.
  Valores locales sin offset se interpretan en `America/Santiago`; el watermark
  usa cambios de proveedor válidos y solapamiento.
- Brecha comprobada: pipeline actual hidrata detalle solo cuando estado es
  `publicada`; incumple seguimiento de cohorte posterior al cierre.

Permanecen decisiones humanas para políticas de envejecimiento de primer
llamado desierto y selección sin OC, y para representación raíz-versus-etapa
del segundo llamado. Se trasladan a los contratos de ingesta, evidencia y UX
dependientes de esta investigación; no son hechos de proveedor.
