## Why

El analista puede leer Activas y el detalle V2, pero no puede consultar los
cambios semánticos ya conservados ni analizar la demanda por comprador. Esto
oculta procedencia y obliga a repetir filtros manuales.

## Investigation / Current State

- `mp.v2_history` ya conserva eventos append-only con snapshots semánticos
  antes/después, observaciones de origen y tiempos del proveedor.
- `mercadoPublicoV2` ya es el namespace GraphQL autenticado para Activas,
  detalle y analítica. Sus rutas actuales sólo montan Activas.
- `MercadoPublicoV2ReadService` ya aplica el contrato de filtros sobre la
  población V2. Compradores debe usar esa misma población.
- Issues 25 y 26 cerraron el contrato de detalle y su evidencia. No se
  reimplementan en este cambio.

## What Changes

- Añadir lectura paginada de eventos de Historial desde `mp.v2_history`, por
  oportunidad y con `codigo` obligatorio.
- Añadir agregación paginada de Compradores sobre la población V2 filtrada.
- Usar `buyerCode` como identidad estable de cada agregado y como valor de
  `buyer` en la URL. Las oportunidades sin código sólo afectan la cobertura;
  no crean una fila ni una selección navegable.
- Declarar cobertura y estado a partir de datos observados. No calcular ni
  mostrar totales monetarios entre monedas.
- Añadir rutas autenticadas, navegación local y transición de Compradores a
  Activas con el filtro de comprador en la URL.
- Mantener Historial como eventos temporales por oportunidad. El parámetro
  `codigo` identifica la oportunidad; los parámetros de Activas sólo se
  preservan para volver atrás y no convierten Historial en un snapshot actual.
- Mantener sin cambios la ingesta, las migraciones, el detalle V2, el payload
  sanitizado y el Centro de control.

## Capabilities

### New Capabilities

- `mercado-publico-v2-history-and-buyers`: Historial semántico y analítica de
  compradores autenticados sobre datos V2.

### Modified Capabilities

- Ninguna. No existe una spec principal de Mercado Público que se deba
  modificar.

## Change Profile

- Profile: runtime-change
- Why this profile fits: añade contratos GraphQL y rutas de producto visibles.

## Ownership and Test Seam

- Highest existing Seam: namespace GraphQL `mercadoPublicoV2` consumido por
  rutas autenticadas de Mercado Público.
- Owning Module: módulo `mercado-publico`, en sus resolvers GraphQL y páginas
  V2 de `twenty-front`.
- Interface: conexiones keyset y agregados con datos de frescura, cobertura y
  procedencia que el cliente puede renderizar sin consultar al proveedor.
- Highest test Seam: consulta GraphQL bajo `WorkspaceAuthGuard` y ruta
  autenticada real con Playwright.
- Adapter: lectores SQL dedicados sobre `mp.v2_history`, `mp.gold_detected_process`
  y `mp.v2_cohort`; Apollo y React Router en el cliente.
- Depth / Leverage / Locality: el namespace concentra el contrato público;
  lectores separados evitan ampliar el servicio de lectura actual de Activas.

## Prior Art and First Proof

- Prior art: `mercado-publico-v2-read.service.spec.ts`,
  `activas-url-keyset.spec.ts` y `detail-panel.spec.ts`.
- First failing behavior or contract proof: una consulta a `mercadoPublicoV2`
  no puede obtener eventos semánticos ni compradores agrupados y las rutas
  `/mercado-publico/historial` y `/mercado-publico/compradores` no existen.

## Execution Order Decision

- Required: yes
- Why: Historial instala la navegación local compartida. Compradores reutiliza
  ese seam y su transición a Activas depende de él.

## Out Of Scope

- Mostrar snapshots actuales, payload crudo, parámetros de request, errores
  técnicos o acciones de `SyncRun` en Historial o Compradores.
- Crear detalle de comprador, comparación de oportunidades, scores o datos
  inferidos.
- Cambiar el contrato de detalle, las relaciones hijas o la persistencia V2.
- Cambiar permisos del Centro de control.

## Impact

- Afecta resolvers GraphQL, lectores SQL y rutas/páginas de Mercado Público V2.
- Afecta pruebas unitarias de contrato y Playwright autenticado.
- No afecta el proveedor, las migraciones ni el esquema de datos.

## Verification Policy

- Añadir pruebas fallidas primero en el namespace propietario.
- Probar que Historial usa sólo eventos de `mp.v2_history` y que Compradores
  usa la misma población filtrada que Activas.
- Probar rutas, URLs, estados y regreso del navegador con autenticación real.
- Ejecutar Playwright contra un workspace aislado con datos V2 sembrados. No
  depender de datos residuales del Compose ni simular respuestas GraphQL.
- Ejecutar codegen después del cambio GraphQL y pruebas enfocadas antes de
  suites amplias.

## Notes

- Source map: `.scratch/mercado-publico-v2-reconstruction/implementation-sdlc-map.md`.
- Group: G2. Lane: B. Issues: 25, 26, 27.
- Issue 25 fija el contrato de detalle y Issue 26 entrega su investigación.
  Ambos son evidencia retrospectiva. Issue 27 es el único trabajo nuevo.
- Boundary: este cambio no modifica ni divide el cambio umbrella
  `mercado-publico-v2-reconstruction`.
