# Superar gate operativo final

Status: ready-for-human
Blocked by: 30
Source: ../PRD.md
OpenSpec: decisión humana pendiente

## What to build

Certificar que la ruta V2 está lista para retiro irreversible mediante el harness local completo, revisión visual humana, rollback demostrado y dos ciclos diarios consecutivos correctos.

## Acceptance criteria

- [ ] Dos ejecuciones diarias consecutivas completan cohortes, checkpoints, proyecciones y marca de agua correctamente.
- [ ] La matriz Playwright obligatoria conserva screenshots y traces revisables.
- [ ] Un humano revisa y justifica cualquier actualización de baseline visual.
- [ ] Los gates de lifecycle, evidencia, analytics, seguridad, navegación y cutover pasan juntos.
- [ ] El resultado registra evidencia suficiente para autorizar o rechazar el retiro.
- [ ] Cualquier smoke cloud se ejecuta sólo con URL, identidad, autorización y datos permitidos explícitos.

## Blocked by

- 30 — Activar cutover reversible.

