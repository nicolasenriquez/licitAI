# Definir cutover, retiro de código y rollback

Type: grilling
Status: resolved
Blocked by: 03, 13, 14

## Question

¿Cómo debe pasar la nueva rama desde slices protegidas hasta reemplazar la vista
actual, portar solo salvamento probado y eliminar código desplazado sin perder
capacidad de rollback?

## Decision record expected

- Regla de port selectivo desde la rama congelada.
- Feature flag local, paridad requerida y criterio de cambio de ruta.
- Orden seguro para retirar UI, CSS, stories, queries, servicios V1/CSV y
  migraciones no adoptadas.
- Evidencia de cero consumidores y cero regresión antes de eliminar.
- Punto de rollback, compatibilidad de datos y ventana de observación.

## Answer

Decisión humana confirmada. La rama de reconstrucción nace desde `main` y sólo
recibe port selectivo desde la rama congelada: cada candidato V2 exige
consumidor, prueba, compatibilidad y responsable. Merge, rebase y cherry-pick
masivo quedan prohibidos.

La bandera local V2 protege una ruta completa, nunca un experimento parcial. La
ruta canónica `/mercado-publico` cambia sólo después de paridad autenticada
local completa y rollback ensayado. El nuevo esquema `mp` se añade aislado; el
cutover no transforma ni borra V1/CSV y rollback vuelve ruta/bandera conservando
evidencia V2.

El retiro ocurre sólo tras reemplazo y en orden inverso de dependencia:

1. rutas y consumidores GraphQL/UI desplazados;
2. CSS local, stories y prototipos temporales;
3. servicios Mercado Público V1/CSV y migraciones no adoptadas.

Antes de cada borrado se exige cero consumidores demostrado por búsqueda de
repo, grafo/imports, tests verdes, smoke autenticado y diff visual. Cualquier
consumidor restante bloquea el retiro. No se elimina código ajeno ni se promueve
una pieza temporal por copia.

Ruta previa, bandera y compatibilidad se conservan durante dos ciclos diarios
V2 correctos y una ejecución completa del harness. Sólo después se permite el
retiro irreversible; observabilidad conserva versión de despliegue, `SyncRun`,
errores sanitizados y ruta activa para decidir rollback.
