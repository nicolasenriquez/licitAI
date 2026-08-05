# Diseñar el contrato profundo del módulo de ingesta V2

Type: grilling
Status: resolved
Blocked by: 02

## Question

¿Qué interfaz profunda debe ocultar descubrimiento incremental, detalle,
seguimiento, idempotencia, reintentos, replay, backfill y reconciliación para que
la ejecución diaria y manual compartan un único pipeline V2?

## Decision record expected

- Responsabilidad y límites del módulo.
- Inputs, outputs, invariantes, estados de ejecución y errores observables.
- Semántica de idempotencia, reanudación, concurrencia y duplicados.
- Política de fallo parcial y recuperación sin pérdida de cohortes.
- Separación explícita respecto de V1, CSV, HTTP y UI.

## Answer

El módulo V2 es un servicio interno de orquestación. Recibe un `SyncIntent`
(`scheduled`, `manual`, `replay`, `backfill` o `reconcile`) con alcance y actor
opcional; devuelve un `SyncRun` durable con identificador, estado, cohorte,
contadores y errores observables. Scheduler y comando de operador son
adaptadores; HTTP/UI solo autorizan y solicitan. V1 y CSV no son dependencias
del módulo.

Un `SyncRun` avanza por `queued`, `discovering`, `hydrating`, `projecting` y
`reconciling`, hasta `succeeded`, `partial_failed`, `failed` o `cancelled`.
Sus errores incluyen `stage`, `scope`, `retryable` y `cause`.

- Tras descubrimiento correcto, cohorte queda congelada y se checkpointa por
  página y oportunidad. Reanudar procesa solo pendientes; redescubrir crea run
  nuevo.
- Solo existe escritura V2 activa por alcance global. Solicitud manual
  compatible retorna run activo; replay o backfill de alcance distinto se
  encola.
- Cada oportunidad confirma evidencia y proyección atómicamente. Fallos de
  detalle preservan proyección válida anterior, quedan registrados y permiten
  continuar cohorte; fallo sistémico o descubrimiento no confiable termina run
  como `failed`.
- Repetir versión proveedor se deduplica por
  `codigo + provider_changed_at + payload_hash`; hash protege timestamps nulos
  o erróneos. Run registra intentos sin duplicar evidencia ni proyección.
- Replay, backfill y reconciliación usan misma orquestación con intent
  explícito. Detalles de persistencia pertenecen a
  [Diseñar evidencia, historial y proyecciones de lectura](05-disenar-evidencia-y-proyecciones.md).
