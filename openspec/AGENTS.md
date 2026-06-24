# OpenSpec Surface Contract

## Purpose

Define when work should stay inside `openspec/` during the workspace routing pilot.

## Stay In `openspec/` When

- The task is about an active OpenSpec change.
- The task is to create or edit `proposal.md`, `design.md`, `tasks.md`, or `specs/.../spec.md`.
- The task is to review change scope, requirements, design choices, task status, or manual acceptance artifacts tied to a change.
- The task is to apply, sync, or archive a change using the repository OpenSpec workflow.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../CONTEXT-MAP.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. The specific change artifacts you are about to inspect or edit

## Bounce Back To Root When

- The prompt is really about architecture, business context, governance, operations, standards, or ADRs under `docs/`.
- The task is general repo code work that is not anchored to an active OpenSpec artifact.
- The task asks for a folder not mapped by this pilot.

When that happens, return to `../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `openspec/`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `openspec/`.
- Do not infer missing requirements from nearby docs when the change artifacts say otherwise; update the artifacts instead.
