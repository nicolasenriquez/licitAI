# Evidencia del prototipo workspace analista A–G

## Pregunta

¿Qué composición ayuda mejor a una persona analista a encontrar oportunidades
atendibles, confirmar su evidencia y decidir dónde participar?

Comparación entre oportunidades queda fuera del alcance por reacción humana:
no demostró utilidad para este flujo.

## Investigación de referencia

Consulta realizada el 4 de agosto de 2026 sobre fuentes oficiales:

- [Buscador de licitaciones de Mercado Público](https://www.mercadopublico.cl/BuscarLicitacion?IsFirstTableDesign=True): filtros por rubro, región, tipo, estado, presupuesto, fecha, garantía y comprador; resultados exponen estado, monto, cierre, organismo, compras y reclamos.
- [Buscador de Compra Ágil](https://buscador.mercadopublico.cl/compra-agil): palabra o número, estado, fechas, presupuesto, organismo, publicación y cierre.
- [Compra Ágil para proveedores](https://www.chilecompra.cl/compra-agil-proveedor/): primer llamado EMT, eventual segundo llamado, habilidad del proveedor y cierre mínimo de 24 horas.
- [Datos Abiertos ChileCompra](https://datos-abiertos.chilecompra.cl/): monto y volumen temporal, mecanismos, regiones, rubros, compradores, proveedores, órdenes y cotizaciones.
- [API Mercado Público](https://www.chilecompra.cl/api/): datos operacionales para alertas, análisis y reportes.
- [UK Contracts Finder](https://www.contractsfinder.service.gov.uk/Search): oportunidades futuras/activas, búsquedas guardadas y alertas como referencia secundaria de workflow.
- [SAM.gov Opportunities](https://sam.gov/content/opportunities): oportunidades activas, seguimiento de cambios y búsquedas guardadas como referencia secundaria de vigilancia.

Conclusión aplicada: búsqueda y filtros deben liderar; mecanismo, llamado,
comprador, monto, cierre y cobertura documental deben permanecer visibles;
gráficos deben describir el mismo universo filtrado y llevar de vuelta a
oportunidades concretas. No se usa score opaco: “cobertura de señales” sólo
indica presencia de monto, cierre, documentos y región.

## Acceso

- A — Explorador denso: `/mercado-publico?variant=A#compra-agil`
- B — Bandeja Compra Ágil: `/mercado-publico?variant=B#compra-agil`
- C — Radar de señales: `/mercado-publico?variant=C#compra-agil`
- D — Calendario operativo: `/mercado-publico?variant=D#compra-agil`
- E — Inteligencia de mercado: `/mercado-publico?variant=E#compra-agil`
- F — Inteligencia de compradores: `/mercado-publico?variant=F#compra-agil`
- G — Mesa de decisión: `/mercado-publico?variant=G#compra-agil`
- Botones anterior/siguiente del switcher cambian variante sin perder URL.

Montaje limitado a desarrollo o host local. Usa autenticación, Apollo,
búsqueda, filtros, gráficos Twenty, detalle lateral y datos reales. Guardados,
notas y decisiones son estado desechable del prototipo; no ejecuta mutaciones.

## Hipótesis a contrastar

| Variante | Pregunta operativa | Fortaleza esperada | Riesgo esperado |
| --- | --- | --- | --- |
| A — Explorador denso | ¿Qué resultados cumplen mis criterios? | Barrido factual rápido | Scroll horizontal y alta densidad |
| B — Bandeja Compra Ágil | ¿Qué llamado debo atender primero? | Urgencia y etapa visibles; elegibilidad se confirma en bases | Columnas desbalanceadas |
| C — Radar de señales | ¿Dónde hay oportunidad con evidencia suficiente? | Une feed, tiempo y cobertura factual | Señales incompletas pueden dominar atención |
| D — Calendario operativo | ¿Qué capacidad necesito por fecha? | Planificación diaria por cierre | Fechas ausentes quedan fuera |
| E — Inteligencia de mercado | ¿Dónde se concentra demanda abierta? | Cierres, región, monto y compradores juntos | Analítica puede alejar del proceso individual |
| F — Inteligencia de compradores | ¿Qué instituciones demandan ahora? | Contexto de cuenta y recurrencia visible | Agrupación puede ocultar urgencia transversal |
| G — Mesa de decisión | ¿Participo en esta oportunidad? | Evidencia, notas y decisión en un flujo | Menor velocidad para barrido masivo |

## Guion de evaluación

1. Buscar un producto o servicio y acotar región, llamado y horizonte de cierre.
2. Identificar oportunidades urgentes y distinguir primer/segundo llamado.
3. Explicar qué representa cada gráfico y abrir un proceso desde su contexto.
4. Guardar una oportunidad sin confundir esa acción con comparar.
5. En G, registrar nota y decidir participar o descartar un solo proceso.
6. Repetir a 1440×900, 390×844, light/dark, teclado, zoom 200% y reduced motion.
7. Observar loading, empty, error, partial, texto largo y valores nulos.

## Reacción humana

- Comparación eliminada de todas las variantes: no se encontró utilidad.
- B6 reemplaza la selección o mezcla A–G como referencia preferida.
- Se valida su secuencia de filtros de mercado, resumen factual, inteligencia
  colapsable en prioridad/demanda/competencia, tabla exacta y detalle lateral.
- Activas, Historial, Compradores y Centro de control deben seguir siendo
  superficies distintas; analytics llevan a oportunidades concretas.
- B6 aporta composición e intención, no código para promover directamente: se
  reescribe con contratos, componentes, tokens, accesibilidad y estados nativos
  de Twenty, aplicando `frontend-ui-engineering`.

Referencias recibidas el 4 de agosto de 2026:

- `C:\Users\nenri\Downloads\licitAI_compra_agil_productive_prototype_B6.html`
  — `SHA-256 12E464B4C2FA3A04BCFA30B16958966BF77B2A5FFA1AEC94E85E6AEC8906C58D`.
- `C:\Users\nenri\Downloads\MercadoPublicoCompraAgilWorkspace.B6.proposed.tsx`
  — `SHA-256 0FE3DE97AD93AF8DC8B50C9EAE4F677A699E0CB6F66B81F5924F1C3B6E338B92`.
