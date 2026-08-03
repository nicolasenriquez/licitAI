---
type: context
title: OpenSpec Surface Context
description: Scope and reading order for active OpenSpec changes.
---

# OpenSpec Context

## Purpose

Describe the role of `openspec/` in this repository during the workspace routing pilot.

## What Lives Here

- `changes/` contains active change work.
- `changes/<change>/proposal.md` explains what and why.
- `changes/<change>/design.md` explains how the change should work.
- `changes/<change>/tasks.md` tracks implementation and validation steps.
- `changes/<change>/specs/<capability>/spec.md` captures explicit requirements and scenarios.
- Change-local validation artifacts may live beside those files when the change needs manual acceptance evidence. Examples seen in this repo:
  - `investigation.md` — Phase 0 pattern inventory, baseline, blast-radius, implementation plan
  - `test-design.md` — Phase 1 tracer-bullet path, test surface, unit/integration test specs
  - `schema-catalog.md` — binding column-level SQL schema for implementation phases
  When the numbered-folder extension is used, execution evidence belongs under
  `03_execution/`; the canonical artifacts remain at the change root.
- `specs/` is reserved for accepted or synced spec surfaces and may be sparse while work is still change-local.

## Current Routing Status

- `openspec/` is a validated pilot surface (wave 0).

## How To Use This Surface

For an active change, prefer this order:

1. `index.md`
2. `proposal.md`
3. `specs/.../spec.md`
4. `design.md`
5. `tasks.md`
6. Any change-local validation artifact such as a manual acceptance document

## Scope Boundary

This surface is for change definitions and change-driven execution context.

It is not the durable home for:

- architecture baseline docs under `docs/`
- governance rules under `docs/`
- business operating context under `docs/`
- ADRs under `docs/`
- general package implementation guidance under `packages/` unrelated to an active change

If the prompt is about those topics, go back to `../index.md` and reroute.

## Estructura de subcarpetas numeradas

Además de los artefactos canónicos en raíz, este repositorio permite subcarpetas
numeradas dentro de cada change como extensión local:

| Carpeta | Propósito |
| --- | --- |
| `00_wayfinding/` | Mapa wayfinder + tickets de investigación resueltos |
| `01_spec/` | Borrador to-spec (insumo para proposal.md) |
| `02_tickets/` | Borrador to-tickets (insumo para tasks.md) |
| `03_execution/` | Evidencia de implementación (diagnósticos, runbooks, test design) |

Los artefactos canónicos (`proposal.md`, `design.md`, `tasks.md`, `specs/`)
**nunca** se mueven a estas subcarpetas. Las subcarpetas son solo para
material fuente, borradores y evidencia.

## Selección del flujo de descubrimiento

- Usa `wayfinder` solo cuando el trabajo pueda requerir varias sesiones o
  todavía exista `fog` de decisiones. Su mapa y tickets viven en
  `.scratch/<effort>/`; no se crea el change OpenSpec mientras el camino siga
  abierto.
- Si la persona elige explícitamente el flujo OpenSpec para una spec que cabe
  en una sesión pero mantiene ambigüedad material, crea el change y usa
  `/grill-with-docs <change-name> source=openspec mode=grill`.
- Si la persona elige explícitamente el flujo OpenSpec para una spec pequeña y
  clara, omite ambos flujos y usa `/opsx-new <change-name>` seguido de
  `/plan source=openspec <change-name>`.
- Para cualquier plan sin esa elección explícita, conserva el trabajo en el
  flujo de planificación elegido y no introduzcas OpenSpec.
- Si Wayfinder no encuentra `fog`, no se crea un mapa. Si grilling no encuentra
  una ambigüedad material, no se prolonga la entrevista.

Una vez cerrado el descubrimiento, OpenSpec es la única fuente de verdad del
change. `to-spec` y `to-tickets` no se usan como pasos paralelos de autoría
normal.
