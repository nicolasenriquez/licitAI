# Compra Agil V2 Detail Contract

Evidence: implemented from five authorized `GET /v2/compra-agil/{codigo}` responses on 2026-08-10. Every response was HTTP 200 with one record. The supplied 3,000-record list selected the sample; it is not persisted here.

## Sanitized Fixtures

`v2-compra-agil-detail-real-sanitized.json` contains three representative shapes from the five responses: a record with 23 documents, a record with an order and empty documents, and a cancelled record with no quoting providers. All identifiers and free text are synthetic markers; numbers are shape-preserving placeholders.

## Observed Contract

| Field | Type and nullability |
| --- | --- |
| `codigo`, `nombre`, `descripcion`, `estado` | string in the observed detail responses |
| `convocatoria` | object; both call closing dates can be null |
| `fechas` | object; cancellation date can be null |
| `entrega` | object with string address and numeric delivery days |
| `presupuesto` | object; monetary fields are numeric and currency is string; exchange fields can be null |
| `id_orden_compra` | number or null |
| `institucion` | object with buyer strings and numeric region |
| `documentos` | array, including empty and 23-element observations |
| `productos_solicitados` | array of product objects |
| `proveedores_cotizando` | array, including empty; each provider can contain `productos_cotizados` |
| `resumen`, `motivos`, `flags` | objects; observed nullable motives and booleans |

## Child Keys

| Relation | Stable key | Fallback |
| --- | --- | --- |
| `documentos` | `id` | ordinal plus element checksum |
| `productos_solicitados` | `codigo_producto` | ordinal plus element checksum |
| `proveedores_cotizando` | `id_cotizacion` | ordinal plus element checksum |
| `productos_cotizados` | provider `id_cotizacion` plus `codigo_producto` | ordinal plus element checksum within its provider |

No enum meanings, implicit CLP conversion, or unobserved relations are inferred from this evidence.
