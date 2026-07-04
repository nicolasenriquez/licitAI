---
type: reference
title: "Opsx Command Contract"
description: "Reference documentation for Opsx Command Contract."
okf_version: "0.1"
---
# Opsx Command Contract

Use this reference to keep OpenSpec artifacts compatible with local slash
commands.

## Command Roles

- `/prime source=openspec change=<change-name>`
  - inspect legacy OpenSpec state and recommend the next move
- `/plan source=openspec <change-name>`
  - create or refine artifacts without touching production code
- `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill`
  - resolve ambiguity before implementation planning continues
- `/execute <change-name> <task-selector>`
  - perform code and doc changes from already-planned tasks
- `/opsx-verify <change-name>`
  - audit artifact and implementation alignment
- `/opsx-sync <change-name>`
  - sync implemented spec deltas into canonical specs
- `/opsx-archive <change-name>`
  - archive a completed and verified change

## Required Artifact Compatibility

`proposal.md`

- must include `## Notes`

`tasks.md`

- every checkbox task must include a directly adjacent `Traceability:` line
- completed tasks should also include a directly adjacent `Notes:` line
- task IDs must remain sequential and numeric only
- phase `1` must exist when runtime behavior, contract, persistence, integration, UI behavior, or regression risk changes
- if phase `1` is omitted, `proposal.md` must justify the omission explicitly

`spec.md`

- keep requirement and scenario structure explicit
- avoid redesigning stable contracts unless the change really modifies them

## Execution Boundary

This skill prepares the change for `/execute`.

It should:

- normalize artifacts
- close design ambiguities
- make tasks implementation-ready
- recommend the next command

It should not:

- perform production code changes itself
- substitute for `/execute`
- hide unresolved ambiguity

## Recommended Next Commands

Use one exact next command only:

- `/opsx-new <change-name>` when the change does not exist yet
- `/opsx-continue <change-name>` when the change exists but artifacts are partial or stale
- `/grill-with-docs <change-name|proposal-path> source=openspec mode=grill` when ambiguity blocks implementation planning
- `/plan source=openspec <change-name>` when the change is clear enough for artifact authoring but not yet implementation-ready
- `/execute <change-name> <task-selector>` only after the spec is implementation-ready
- `/opsx-verify <change-name>` after implementation when artifact and implementation alignment must be checked
- `/opsx-sync <change-name>` when implemented deltas must be synced into canonical specs
- `/opsx-archive <change-name>` only after verification and sync are complete
