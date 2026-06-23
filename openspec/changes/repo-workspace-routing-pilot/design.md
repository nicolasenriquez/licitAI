# Design: repo-workspace-routing-pilot

## Summary

Implement a file-based routing system for agent work in this repository using a validated pilot plus staged rollout waves. The pilot already proved the contract on the root, `openspec/`, and `docs/`. The next step is to extend that same contract deliberately across the remaining repo surfaces.

The design remains intentionally small:

- keep the root `AGENTS.md` canonical
- keep `CLAUDE.md` compatible rather than replacing it
- add one root map file
- add one `AGENTS.md` and one `CONTEXT.md` per mapped folder
- keep validation manual per wave
- avoid external tooling becoming the routing authority

## Design Goals

- Make folder routing explicit without changing the existing repo operating model.
- Separate active OpenSpec work from durable repository docs work.
- Prevent agents from inventing folder rules for unmapped areas.
- Require context declaration before substantive work so routing is inspectable.
- Make future expansion dependency-ordered instead of ad hoc.
- Scale the contract without creating one giant undocumented leap across all packages.

## Entry Contract

### Root

The root remains the only canonical starting point.

Files:

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT-MAP.md`

Responsibilities:

- define that the root `AGENTS.md` is canonical
- explain the v1 mapped surfaces
- define bounce behavior
- define the no-wandering rule
- require declaration of consulted routing/context files

### Validated folder surfaces

#### `openspec/`

- `openspec/AGENTS.md`
- `openspec/CONTEXT.md`

Responsibilities:

- accept active change work only
- explain artifact order and change-local reading order
- send architecture, governance, and durable docs questions back to the root map

#### `docs/`

- `docs/AGENTS.md`
- `docs/CONTEXT.md`

Responsibilities:

- accept durable repository-doc work only
- explain docs reading paths at a folder level
- send active OpenSpec change work back to the root map

### Rollout surfaces

The next expansion should not jump directly from root to dozens of leaf packages.

It should add routing in this order:

1. `packages/` as a parent package-index surface
2. docs-heavy leaf packages
3. AI-tooling leaf packages
4. core monorepo packages
5. remaining package groups

This keeps the routing topology legible and makes the package tree navigable without requiring the root map to enumerate every leaf from day one.

## Routing Model

1. Start at the root.
2. Read `CONTEXT-MAP.md`.
3. Select the mapped surface.
4. Read that surface's `AGENTS.md` and `CONTEXT.md`.
5. If the prompt does not match the selected surface, bounce back through the root map and reroute.
6. If no mapped surface applies, stay on the root contract and say so explicitly.
7. When `packages/` becomes mapped, route through `packages/AGENTS.md` and `packages/CONTEXT.md` before selecting a leaf package surface.

## Public File Contract

### Root Files

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT-MAP.md`

### Pilot Folder Files

- `openspec/AGENTS.md`
- `openspec/CONTEXT.md`
- `docs/AGENTS.md`
- `docs/CONTEXT.md`

### Expansion Files

- each new mapped surface gets:
  - `AGENTS.md`
  - `CONTEXT.md`
- when package routing expands:
  - `packages/AGENTS.md`
  - `packages/CONTEXT.md`
- pre-existing local `AGENTS.md` files are harmonized rather than left divergent

### Validation Artifact

- `openspec/changes/repo-workspace-routing-pilot/manual-acceptance.md`

## Manual Acceptance Model

Validation stays manual because the expected behavior is semantic and conversational, not only structural.

The manual acceptance document must capture for each case:

- prompt
- tool or agent surface being tested
- consulted files
- selected final folder
- expected response behavior
- actual result
- pass/fail

Each new wave must append new cases before that wave is considered done.

Minimum coverage per wave:

- root -> new surface
- wrong-folder bounce -> root -> new surface
- new surface -> root -> correct alternative surface when mislocated
- unmapped refusal still works
- consulted-file declaration still happens

## Optional Discovery Aids

External graph or codebase-understanding tools may help discover boundaries, dependencies, and candidate routing surfaces.

Understand Anything is acceptable only as an optional discovery aid because it offers an interactive graph and multi-agent analysis pipeline, but it is not a substitute for the repo-native contract files and should not become a required dependency of the routing system.

That means:

- no generated routing truth is accepted without human curation
- no plugin install is required for this change
- routing behavior remains understandable from repository files alone

## Expansion Strategy

Expansion is deliberately ordered:

1. Pilot closeout and rollout architecture
2. docs-heavy surfaces
3. AI tooling surfaces
4. core monorepo packages
5. remaining package groups

This keeps the rollout near documentation-led surfaces before it reaches high-blast-radius code areas.
