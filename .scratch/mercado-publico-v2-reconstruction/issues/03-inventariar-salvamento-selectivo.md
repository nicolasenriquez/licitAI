# Inventariar el salvamento selectivo de la rama actual

Type: research
Status: resolved
Blocked by: none

## Question

¿Qué contratos, migraciones, pruebas, componentes y evidencia de la rama actual
deben rescatarse, reescribirse, archivarse o descartarse al reconstruir desde
`main`?

## Work

- Clasificar cambios V2, V1, CSV, generados, documentación, artefactos y ruido.
- Identificar duplicación, tablas/CSS paralelos, prototipos, contratos útiles y
  migraciones con datos o rollback riesgoso.
- Exigir evidencia de consumidor, prueba, compatibilidad y responsabilidad para
  todo candidato a salvamento.
- No modificar, limpiar ni revertir la rama auditada.

## Exit evidence

- Ledger por archivo o conjunto coherente: portar, reescribir, conservar como
  evidencia, eliminar después de paridad o excluir.
- Dependencias y riesgos de cada candidato.
- Lista explícita de elementos que no deben cruzar a la nueva rama.

## Answer

Investigación resuelta en el artefacto
[`03-salvamento-selectivo.md`](../research/03-salvamento-selectivo.md).

- Regla: partir de `main`; prohibidos merge, rebase o cherry-pick masivo desde
  la rama congelada.
- Portar selectivamente fixtures V2 sanitizadas, contratos de extractor,
  normalización temporal, utilidades HTTP/reintento V2, evidencia raw
  redactada, pruebas de SidePanel/foco y uso de primitives Twenty.
- Reescribir pipeline de cohorte, persistencia/proyecciones, canonical/gold,
  detalle, GraphQL, migraciones, Command Center, workspace, tabla y harness.
- Mantener como evidencia OpenSpecs, prototipos, stories, pruebas acopladas,
  migraciones/backfills y reportes actuales.
- Excluir V1, CSV, generados, cambios globales de tooling/CI/Docker, tablas y
  CSS paralelos, prototipos perdedores, migraciones históricas/locales y todo
  secreto o artefacto de sesión.

El ledger exige consumidor, prueba, compatibilidad V2 y responsabilidad única
antes de cualquier rescate. La eliminación solo ocurre después de paridad
funcional y visual autenticada.
