# Fijar contrato real de detalle V2

Status: in-progress
Blocked by: no se preservaron respuestas reales sanitizadas del detalle V2 para derivar el contrato sin inventarlo
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Inspeccionar evidencia autorizada del endpoint real de detalle V2 y convertirla en un contrato verificable de campos, relaciones, claves, nulabilidad y variaciones antes de construir Slice 4.

## Acceptance criteria

- [x] El acceso, propósito y tratamiento de datos reales cuentan con autorización explícita.
- [ ] Se capturan fixtures sanitizados representativos, incluidos arrays grandes, ausencias y variantes observadas.
- [ ] Cada relación hija usa clave estable del proveedor o fallback documentado de ordinal más checksum.
- [ ] Se documentan tipos, nulabilidad, fechas, moneda, estados y discrepancias sin inventar campos.
- [ ] El manifest de fixtures y las expectativas de normalización quedan versionados y revisables.

## Authorization and handling

- 2026-08-10 — Autorización explícita del usuario para consultar evidencia pública del detalle V2 exclusivamente con el fin de fijar este contrato.
- Alcance: hasta cinco códigos descubiertos mediante el listado V2 y sus respuestas de detalle; no se realizan escrituras ni llamadas desde navegador.
- Sanitización: no se persisten tickets, credenciales, encabezados ni URLs firmadas. Cadenas que puedan identificar personas se reemplazan por marcadores consistentes; sólo se versionan fixtures sanitizadas, el manifest y el contrato derivado.

## Progress

- 2026-08-10 — Inicio de implementación: se revisará la evidencia sanitizada ya capturada, el cliente V2 y el flujo de normalización para fijar el contrato verificable de detalle sin volver a consultar al proveedor.
- 2026-08-10 — Reanudación: se abordarán los cuatro criterios pendientes con la captura autorizada a través de `MercadoPublicoApiV2CompraAgilClientService`, fixtures sanitizadas y una validación local mínima.
- 2026-08-10 — Inicio de ejecución: se verificó el ticket. El acceso explícitamente autorizado, el propósito, el alcance de códigos/volumen y las reglas de sanitización siguen sin estar registrados; no se consultó el endpoint ni se infirió el contrato desde mocks o fixtures. Ticket permanece bloqueado.
- 2026-08-10 — Inicio autorizado: se cerró la dependencia 24 y se registraron autorización, propósito, límite de cinco códigos y reglas de sanitización. Se iniciará la captura sólo mediante MercadoPublicoApiV2CompraAgilClientService.
- 2026-08-10 — Bloqueo de captura: MercadoPublicoApiV2CompraAgilClientService rechazó la llamada antes de red porque COMPRA_AGIL_API_TICKET no está configurado con un valor utilizable. No se inspeccionaron ni se intentaron reconstruir credenciales; no se generaron fixtures, manifest ni contrato.
- 2026-08-10 — Validación: `npx jest src/engine/core-modules/mercado-publico/drivers/api/__tests__/mercado-publico-api-v2-compra-agil-client.service.spec.ts --runInBand` pasó (11/11). La validación de fixtures y la integración de Mercado Público quedan pendientes de una captura real.
- 2026-08-10 — Configuración Docker validada: el Compose completo no reenviaba las variables V2 a `server` ni `worker`. Se declararon explícitamente, se recrearon sólo esos servicios sin borrar volúmenes y `server` quedó healthy con las tres variables presentes. Captura real pendiente.
- 2026-08-10 — Bloqueo confirmado: dos consultas al listado mediante `MercadoPublicoApiV2CompraAgilClientService` (páginas de 50 y 15) recibieron HTTP 400. El cuerpo contenía sólo el error del proveedor, no códigos de compra; no se conservaron esos artefactos ni se hicieron inferencias de contrato, relaciones o normalización. Se requiere que el proveedor entregue un listado V2 válido antes de completar los cuatro criterios restantes.
- 2026-08-10 — Reintento autorizado: se probará el listado V2 acotado al 2026-08-08, último día hábil indicado por el usuario, antes de mantener el bloqueo.
- 2026-08-10 — Receta verificada: la llamada usa el header `ticket`, `publicado_desde=2026-08-08T00:00:00Z`, `publicado_hasta=2026-08-08T23:59:59Z`, `tamano_pagina=50` y `ordenar_por=FechaPublicacion`.
- 2026-08-10 — Reintento controlado: el listado devolvió HTTP 200 con 50 registros y sin error del proveedor. Se consultaron cinco detalles autorizados; cada uno devolvió HTTP 200 con un registro y sin error. No se persistieron tickets, URLs, códigos ni cuerpos crudos.
- 2026-08-10 — Bloqueo de implementación: la única evidencia versionada de detalle (`v2-compra-agil-detail-production-envelope.json`) es una fixture sintética y el probe autorizado sólo conservó conteos HTTP. No existen respuestas reales sanitizadas desde las que fijar campos, hijos, nulabilidad o variaciones sin inventarlas. No se repitieron llamadas al proveedor ni se alteró el contrato/producto; se requiere una nueva captura autorizada que guarde fixtures sanitizadas y su manifest.
