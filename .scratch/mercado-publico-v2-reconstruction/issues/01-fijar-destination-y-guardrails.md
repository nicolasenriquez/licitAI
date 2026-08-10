# Fijar destination y guardrails de la reconstrucción

Type: grilling
Status: resolved
Blocked by: none

## Question

¿Qué destino, límites y reglas no negociables debe respetar la reconstrucción de
Mercado Público Compra Ágil V2 antes de diagramar decisiones posteriores?

## Answer

- Crear una rama nueva desde `main`; congelar la rama actual como evidencia y
  rescatar solo piezas con responsabilidad, pruebas y encaje demostrables.
- Mercado Público abre en el workspace del analista; Command Center es
  secundario y visible, con acciones operativas restringidas.
- El primer producto es read-only: buscar, filtrar, comparar y revisar detalle.
- Compra Ágil vive en un modelo de lectura propio del esquema `mp`; la UI reusa
  shell, tokens y componentes de Twenty sin forzar el payload anidado a objetos
  CRM tenant-scoped.
- Conservar payload V2 completo; mostrarlo estructurado y revelar el JSON crudo
  sanitizado solo cuando el usuario lo solicite.
- Descubrir solo oportunidades publicadas y participables; seguir cada cohorte
  incorporada diariamente hasta estado terminal y moverla luego a Historial.
- Retener estado actual e historial inmutable de cambios observados.
- Usar una marca de agua persistente en `America/Santiago` con solapamiento de
  seguridad.
- Compartir un único pipeline idempotente entre ejecución diaria y manual. La
  acción web solo encola trabajo asíncrono; no ejecuta ingesta en la request.
- El analista consulta; el operador puede gatillar sync y revisar progreso,
  resultado y errores.
- Prototipar tres variantes A/B/C con auth y datos reales, seleccionar por
  tareas de analista y eliminar las variantes descartadas.
- Servir paginación, búsqueda, filtros, orden y agregados desde backend; nunca
  cargar los 3.000 registros completos en el navegador.
- Preservar búsqueda, filtros, página y detalle abierto durante la navegación.
- No fabricar métricas; toda cifra debe provenir del universo completo.
- Aceptación inicial local con Docker Compose, usuarios desechables y
  Playwright. Cloud queda para un gate posterior.
- Sustituir progresivamente, validar paridad y eliminar código desplazado.
- Al terminar Wayfinder: `/to-spec`, después `/to-tickets`, y decidir OpenSpec
  por ticket según riesgo. El OpenSpec activo actual se conserva como evidencia
  y se marca reemplazado cuando existan los nuevos tickets.
