# Definir arquitectura de información y navegación

Type: grilling
Status: resolved
Blocked by: 06, 09

## Question

¿Cómo deben organizarse ruta, entrada lateral, workspace activo, Historial,
detalle y Command Center para que el flujo del analista sea principal y las
operaciones queden secundarias sin perder descubribilidad?

## Decision record expected

- Posición y etiqueta en navegación lateral.
- Ruta de entrada y deep-link después de autenticación.
- Relación entre Activas, Historial y Command Center.
- Comportamiento de back/forward, URL, filtros, página y registro abierto.
- Visibilidad por rol y estados sin permisos.

## Answer

`Mercado Público` es entrada fija de primer nivel en navegación primaria
`Workspace`, sobre objetos y favoritos editables. Lleva icono y etiqueta; no se
anida en Settings ni se configura por usuario.

La raíz canónica es `/mercado-publico` y abre `Activas`. La implementación
reemplazará comportamiento actual de esa ruta, que carga Command Center. Rutas
hermanas preservan shell y separan superficies:

- `/mercado-publico/historial` para `Historial`;
- `/mercado-publico/compradores` para `Compradores`;
- `/mercado-publico/centro-de-control` para `Centro de control`.

Navegación local ordena `Activas`, `Historial`, `Compradores` y, separada al
final para operador, `Centro de control`. Analista nunca ve ni puede activar
esta última. Tras autenticación o gates globales, URL Mercado Público solicitada
se retoma; sin URL solicitada, entrada abre `Activas`.

Ruta identifica superficie. Query serializa búsqueda, filtros, orden, cursor
opaco y proceso seleccionado. Identidad del proceso seleccionado incluye tipo y
código; enlace directo restaura listado y abre panel lateral nativo. Cambio de
filtros aplicado y paginación crean historial; escritura de búsqueda reemplaza
entrada actual. Back/forward restaura estado exacto; Back primero cierra panel.
Cursor inválido o vencido vuelve a primera página con aviso accesible, sin
reconstruir resultados en cliente.

`Compradores` es analítica separada. Seleccionar comprador navega a `Activas`
con filtro comprador serializado; cambiar a `Historial` conserva ese filtro.
No existe producto de detalle de comprador ni comparación de oportunidades.

Operador ve todas las superficies. Analista ve `Activas`, `Historial` y
`Compradores`; ruta directa a Centro de control produce estado estándar sin
acceso sin datos operativos. Estados de autenticación, suspensión y onboarding
siguen gates globales y no cargan shell Mercado Público.
