# Definir permisos y control de sincronización

Type: grilling
Status: resolved
Blocked by: 04

## Question

¿Qué autorización, estados de job, confirmaciones, auditoría y protecciones debe
tener el Command Center para permitir sincronización manual V2 sin convertir la
request web en un proceso de ingesta ni duplicar ejecuciones?

## Decision record expected

- Capacidades separadas de analista, operador y administrador.
- Contrato de enqueue, idempotency key, exclusión mutua y cancelación.
- Estados visibles, progreso, errores sanitizados y reintento.
- Auditoría de quién inició qué proceso y cuándo.
- Comportamiento cuando la ejecución diaria ya está activa.

## Answer

Command Center es una superficie exclusiva de operador. Analista solo consulta
oportunidades; administrador gestiona identidades, sin una capacidad funcional
adicional sobre sincronizaciones. La request web únicamente ordena al módulo
interno crear, reanudar o cancelar un `SyncRun`; nunca ejecuta ingesta.

- Inicio manual y cancelación muestran alcance y requieren confirmación. Un
  reintento normal reanuda el mismo run sin nueva confirmación; cambiar alcance
  es una nueva intención y se confirma.
- Cada confirmación genera `idempotencyKey` UUID. El cliente reutiliza clave al
  reenviar la misma orden; backend la persiste junto con actor, intención y
  alcance y devuelve resultado original.
- Estados visibles son estados de `SyncRun`, no estados web: etapa, progreso,
  alcance, tiempos y resultado. Error muestra mensaje sanitizado; causa técnica
  permanece en logs protegidos.
- Cuando existe corrida diaria compatible, comando devuelve su run y progreso,
  sin crear job ni pedir nueva confirmación. Alcance distinto confirmado queda
  en cola conforme a exclusión global definida por
  [Diseñar contrato profundo del módulo de ingesta V2](04-disenar-contrato-modulo-ingesta-v2.md).
- `Reintentar` en `partial_failed` o fallo recuperable procesa pendientes del
  mismo run, con intento adicional auditado. No redescubre cohorte ni crea run.
- Cancelación de cola es inmediata. Cancelación activa solicita parada
  cooperativa tras operación atómica, termina `cancelled`, preserva checkpoint y
  permite reintento.
- Auditoría inmutable registra actor, acción, intención, alcance,
  `idempotencyKey`, timestamps, run resultante e intentos. Acceso queda limitado
  al operador.
