# Entregar investigación detallada

Status: ready-for-human
Blocked by: 25
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Permitir investigar una oportunidad desde el SidePanel con detalle estructurado, relaciones reales paginadas, ciclo de vida, procedencia y acceso explícito a un payload sanitizado.

## Acceptance criteria

- [ ] El detalle presenta identidad, estado, llamado, fechas, monto, necesidad, entrega y comprador según el contrato confirmado.
- [ ] Documentos, ítems, cotizaciones, ofertas y demás relaciones reales usan conexiones keyset independientes.
- [ ] Disponibilidad y fallos parciales no se confunden con ausencia informada ni cero.
- [ ] Ciclo, motivos y procedencia enlazan snapshot, observación, normalizador y read model.
- [ ] El JSON sanitizado requiere acción explícita, devuelve un payload individual y nunca aparece en listados o analytics.
- [ ] Deep link, paginación hija, teclado y retorno de foco pasan en Playwright autenticado.

## Blocked by

- 25 — Fijar contrato real de detalle V2.

