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
- `specs/` is reserved for accepted or synced spec surfaces and may be sparse while work is still change-local.

## Current Routing Status

- `openspec/` is a validated pilot surface (wave 0).

## How To Use This Surface

For an active change, prefer this order:

1. `proposal.md`
2. `specs/.../spec.md`
3. `design.md`
4. `tasks.md`
5. Any change-local validation artifact such as a manual acceptance document

## Scope Boundary

This surface is for change definitions and change-driven execution context.

It is not the durable home for:

- architecture baseline docs under `docs/`
- governance rules under `docs/`
- business operating context under `docs/`
- ADRs under `docs/`
- general package implementation guidance under `packages/` unrelated to an active change

If the prompt is about those topics, go back to `../CONTEXT-MAP.md` and reroute.
