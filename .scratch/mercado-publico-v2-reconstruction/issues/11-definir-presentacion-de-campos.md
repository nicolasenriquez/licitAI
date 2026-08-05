# Definir presentación, formato y disclosure de campos

Type: grilling
Status: resolved
Blocked by: 02, 07, 09

## Question

¿Qué campos pertenecen a la tabla, al panel, a relaciones navegables o al
payload oculto, y cómo deben presentarse nulos, montos, fechas, estados, textos
largos, documentos, ofertas y motivos?

## Decision record expected

- Matriz campo de negocio → fuente → formato → superficie → prioridad.
- Columnas y orden iniciales con límites de densidad.
- Secciones y progresión del panel de detalle.
- Reglas para truncamiento, tooltip, expansión y accesibilidad.
- Formato monetario/fecha/timezone y diferenciación null/zero/unavailable.
- Comportamiento responsive pendiente de validar visualmente.

## Answer

Decisión humana confirmada. La presentación es una proyección de lectura V2:
el workspace no infiere valores ni transforma el payload en columnas.

| Campo de negocio | Fuente | Formato | Superficie | Prioridad |
| --- | --- | --- | --- | --- |
| Oportunidad | proyección raíz | título, código, tag de estado y llamado | tabla | primaria |
| Comprador y región | proyección raíz | nombre y región secundaria | tabla | primaria |
| Cierre | tiempo proveedor | `dd/MM/yyyy, HH:mm` America/Santiago; tooltip ISO/zona | tabla | primaria |
| Monto | monto y moneda fuente | decimal exacto y moneda fuente; sin conversión CLP implícita | tabla | primaria |
| Documentos y ofertas | relaciones/proyección | conteos explícitos | tabla | primaria |
| Necesidad, entrega e institución | detalle | pares etiqueta-valor | panel | secundaria |
| Documentos, ítems y ofertas | conexiones hijas | lista o tabla paginada | panel; ruta interna V2 cuando exista | secundaria |
| Ciclo, motivos y procedencia | observación y proyección | secciones expandibles | panel | secundaria |
| JSON crudo | observación concreta | JSON sanitizado, checksum y procedencia | disclosure explícito | técnica |

Tabla desktop fija: `Oportunidad`, `Comprador/región`, `Cierre`, `Monto`,
`Documentos/ofertas`. Estado y llamado quedan dentro de Oportunidad; ninguna
otra columna compite con esta jerarquía.

Panel: identidad/estado/llamado; fechas y monto; necesidad/entrega/comprador;
documentos; ítems y ofertas paginados; ciclo/motivos/procedencia; JSON
sanitizado bajo acción explícita. Una relación sólo navega a ruta interna V2;
nunca al proveedor.

Semántica: `null` es “No informado por fuente”; `unavailable` es “Aún no
disponible” con causa y reintento cuando aplique; `0` se muestra como cero.
Texto largo usa dos líneas en tabla y tooltip accesible/foco para contenido
completo; panel permite expansión. Tags de estado combinan texto y color; el
código fuente queda en procedencia.

Responsive: en desktop se conserva tabla y scroll horizontal accesible a 200 %
de zoom. En móvil cada fila se apila: título/estado, cierre/monto y luego
comprador/región/antecedentes. No se ocultan columnas silenciosamente; fila,
foco y tooltip permanecen accesibles. La validación visual queda como gate de
implementación, no como razón para retrasar esta decisión.
