# Diseñar evidencia, historial y proyecciones de lectura

Type: grilling
Status: resolved
Blocked by: 02

## Question

¿Cómo deben convivir payload crudo inmutable, estado actual, historial de
cambios, campos normalizados y relaciones de detalle sin perder información ni
mezclar datos públicos `mp` con objetos CRM tenant-scoped?

## Decision record expected

- Identidades, claves y reglas de deduplicación.
- Contratos para raw, staging, canonical/current, history y gold/read model.
- Tratamiento de documentos, ítems y otros arrays o hijos.
- Nulos, ceros, monedas, fechas, timezone y campos derivados.
- Versionado del payload y trazabilidad JSON → proyección → UI.
- Reglas de replay/backfill que puedan crear filas faltantes, no solo actualizar
  las existentes.

## Comments

- 2026-08-04 — Decisión humana: payload crudo inmutable deduplicado por
  checksum; cada ejecución/request conserva una observación inmutable que lo
  referencia, aun si el contenido no cambia.
- 2026-08-04 — Decisión humana: `current` es una proyección mutable por
  `codigo`; `history` es append-only ante cambio semántico, con before/after y
  referencias a observaciones origen.
- 2026-08-04 — Decisión humana: arrays disponibles en detalle se modelan como
  relaciones hijas `mp`, con clave del proveedor si existe o `ordinal` más
  checksum si no; la evidencia JSON conserva siempre el array completo.
- 2026-08-04 — Decisión humana: `null`, vacío y cero son distintos y no se
  esconden con `COALESCE`; fechas sin offset conservan original y una
  normalización `America/Santiago`; monto es decimal más moneda fuente, sin
  asumir CLP.
- 2026-08-04 — Decisión humana: cada proyección guarda `observationId`, versión
  de esquema proveedor y versión de normalizador; el read model es versionado y
  la UI puede revelar esa procedencia junto al JSON sanitizado.
- 2026-08-04 — Decisión humana: replay/backfill usa evidencia guardada, es
  idempotente, crea filas faltantes y solo avanza watermark con ejecución
  completa; redescargar del proveedor es una sincronización separada.

## Answer

La evidencia y las proyecciones viven exclusivamente en el esquema público
`mp`; no son objetos CRM de un tenant ni dependen de metadata de Twenty.

- **Evidencia:** el payload crudo es un blob inmutable deduplicado por checksum.
  Cada request aceptado crea una observación inmutable con su ejecución, origen,
  endpoint, parámetros, tiempos y referencia al blob, incluso si su contenido
  coincide con una observación previa.
- **Proyección:** staging es una proyección reproducible de la observación; el
  estado `current` es mutable, de grano una Compra Ágil por `codigo`; el
  historial es append-only y registra solamente deltas semánticos, con
  before/after y observaciones de origen.
- **Hijos:** documentos, ítems, cotizaciones y otros arrays disponibles en el
  detalle son relaciones hijas `mp`, identificadas por clave estable del
  proveedor o, si falta, por `ordinal` más checksum. La evidencia conserva el
  array original íntegro.
- **Semántica:** `null`, cadena vacía y cero no son intercambiables. Se retiene
  fecha original y se normaliza sin offset en `America/Santiago`; los montos se
  guardan como decimal con moneda fuente y no se infiere CLP.
- **Lectura:** un read model versionado se deriva de `current`, hijos e
  historial; cada campo/proyección conserva `observationId`, fingerprint de
  esquema proveedor y versión de normalizador. El detalle puede revelar la
  procedencia y el JSON sanitizado bajo acción explícita.
- **Recuperación:** replay/backfill opera sobre evidencia retenida y es
  idempotente, capaz de crear filas `current`, historial e hijos ausentes. Una
  sincronización que vuelve a consultar al proveedor es un caso separado. El
  watermark solo avanza tras una ejecución completa.
