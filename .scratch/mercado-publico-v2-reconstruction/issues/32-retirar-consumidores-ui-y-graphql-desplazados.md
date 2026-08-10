# Retirar consumidores UI y GraphQL desplazados

Status: ready-for-human
Blocked by: 31
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Retirar primero las rutas y consumidores UI/GraphQL desplazados, manteniendo el contrato V2, la aplicación y las validaciones verdes durante la primera fase contract.

## Acceptance criteria

- [ ] Inventario de imports, rutas, operaciones GraphQL y grafo identifica exactamente los consumidores desplazados.
- [ ] Sólo se eliminan consumidores ya reemplazados por la ruta V2 aceptada.
- [ ] Codegen, compatibilidad, lint, typecheck, pruebas y smoke autenticado permanecen verdes.
- [ ] Búsquedas posteriores demuestran que no quedan referencias a cada consumidor retirado.
- [ ] La bandera y el procedimiento documentado mantienen un rollback viable durante esta fase.

## Blocked by

- 31 — Superar gate operativo final.

