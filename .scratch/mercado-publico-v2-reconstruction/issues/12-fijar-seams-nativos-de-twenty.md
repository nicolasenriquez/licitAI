# Fijar seams nativos de Twenty y límite de UI local

Type: grilling
Status: resolved
Blocked by: 03, 09, 11

## Question

¿Qué primitives, tokens, shell, side panel y patrones de Twenty deben reutilizarse
directamente, y dónde se justifica una composición domain-local sin crear una
tabla o sistema visual paralelo?

## Decision record expected

- Inventario elemento UX → seam nativo → adapter local si hace falta.
- Criterio para usar record table metadata-driven o composición read-only.
- Prohibiciones de duplicar input, select, feedback, skeleton, pagination,
  modal y tokens existentes.
- Umbral de extracción a `twenty-ui`: segundo consumidor real y contrato estable.
- Lista de CSS/HTML/prototipos que deberán retirarse después de paridad.

## Answer

Decisión humana confirmada. Twenty mantiene los seams de interacción y diseño;
Mercado Público V2 introduce una composición de lectura local, no un sistema UI
paralelo ni un record object artificial.

| Elemento UX | Seam nativo | Adaptador local permitido |
| --- | --- | --- |
| Shell, navegación, URL y superficies Activas/Historial/Compradores/Control | shell y routing de Twenty | estado/consulta V2 del workspace, sin shell propio |
| Detalle lateral | `SidePanelPages`, `SidePanelRouter`, `useNavigateSidePanel`, foco y stack existentes | página V2 registrada; identidad de proceso por instancia; secciones del detalle |
| Acciones, tags, iconos, enlaces y overflow | `twenty-ui` (`Button`, `Tag`, iconos y superficies) | texto, estado y enlaces internos derivados del DTO V2 |
| Espaciado, color, tipografía, borde, motion y responsive | tema y tokens `--t-*` / `themeCssVariables` | layout específico del dominio, sin token, palette ni escala nueva |
| Filtros y orden | controles y comportamiento accesible existentes de Twenty | bindings URL/DTO V2 y validación de negocio |
| Resultados, hijos paginados y proyección de celdas | composición read-only con estados/foco de Twenty | módulo local `MercadoPublicoV2Results`: DTO V2 a las cinco columnas y secciones confirmadas |

`RecordTable` metadata-driven queda fuera. Su interface presupone object
metadata, permisos CRM, campos editables, selección, drag/drop y virtualización
de records; el contrato V2 es una proyección externa paginada y estrictamente de
consulta. Forzarlo crearía un record artificial, acoplamiento y una interface
mayor que la necesidad. `MercadoPublicoV2Results` será el módulo profundo local:
una interface de lectura pequeña; implementación que concentra mapping de DTO,
estado URL, keyset/paginación, foco y aperturas del SidePanel.

Prohibido crear o copiar primitives Mercado Público para input, select,
feedback, skeleton, paginación, modal, iconografía o tokens. Si Twenty no cubre
un patrón de presentación, se compone privadamente con markup semántico y
tokens existentes; no se publica una pseudo-primitive. Extracción a
`twenty-ui` exige segundo consumidor real y contrato estable, además de la
validación propia de la librería.

Después de paridad funcional, visual y autenticada se retiran:

- `components/prototype/MercadoPublicoAnalystWorkspacePrototype.tsx`;
- `components/__stories__/MercadoPublicoControlCenterPrototype.stories.tsx` y
  `components/__stories__/MercadoPublicoWorkspace.stories.tsx` si solo
  contienen la composición temporal;
- CSS/HTML paralelo de `MercadoPublicoBrowseTab` y
  `MercadoPublicoCompraAgilTab` para input, select, disclosure, tabla,
  skeleton y paginación, reemplazado por las primitives y composición decididas.

La retirada no ocurre antes de reemplazo, pruebas de foco/accesibilidad y
paridad de ruta; ninguna pieza temporal se promueve por copia.
