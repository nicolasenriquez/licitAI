---
type: change-spec
title: "Spec: repo-workspace-routing-pilot"
description: "Accepted specification for Repo Workspace Routing Pilot."
okf_version: "0.1"
---
# Spec: repo-workspace-routing-pilot

## Purpose

TBD

## Requirements

### Requirement: Root Routing Entry Contract

The repository SHALL provide a canonical root routing contract for this pilot.

#### Scenario: Root files define the pilot entrypoint

- **WHEN** an agent starts work in this checkout
- **THEN** the root contract is defined by `AGENTS.md`, `CLAUDE.md`, and `index.md`
- **AND** the root `AGENTS.md` remains the canonical instruction entrypoint

### Requirement: Root Routes OpenSpec Work Into `openspec/`

The routing contract SHALL direct active OpenSpec work into `openspec/`.

#### Scenario: OpenSpec review routes into the OpenSpec surface

- **WHEN** the prompt is "I want to review an active OpenSpec change"
- **THEN** the agent consults the root routing files
- **AND** it reads `openspec/AGENTS.md` and `openspec/CONTEXT.md`
- **AND** it chooses `openspec/` as the working surface

### Requirement: Root Routes Durable Repo Docs Work Into `docs/`

The routing contract SHALL direct durable repository documentation work into `docs/`.

#### Scenario: Architecture understanding routes into the docs surface

- **WHEN** the prompt is "I want to understand the repo architecture"
- **THEN** the agent consults the root routing files
- **AND** it reads `docs/AGENTS.md` and `docs/CONTEXT.md`
- **AND** it chooses `docs/` as the working surface

### Requirement: `docs/` Bounces OpenSpec Prompts Back Through Root

The docs surface SHALL not retain active OpenSpec change work.

#### Scenario: OpenSpec prompt is mislocated in `docs/`

- **WHEN** the current surface is `docs/`
- **AND** the prompt is "Please update the tasks for the active OpenSpec change"
- **THEN** the agent returns to root `index.md`
- **AND** it reroutes into `openspec/`
- **AND** it does not continue the task from `docs/`

### Requirement: `openspec/` Bounces Docs Prompts Back Through Root

The OpenSpec surface SHALL not retain durable repository docs work.

#### Scenario: Docs prompt is mislocated in `openspec/`

- **WHEN** the current surface is `openspec/`
- **AND** the prompt is "Explain the repository governance model"
- **THEN** the agent returns to root `index.md`
- **AND** it reroutes into `docs/`
- **AND** it does not continue the task from `openspec/`

### Requirement: Unmapped Surfaces Do Not Get Improvised Routing

The pilot SHALL not create folder-local routing behavior outside mapped surfaces.

#### Scenario: Prompt targets an unmapped surface

- **WHEN** a prompt asks for a folder-local contract in an unmapped surface such as `packages/twenty-front`
- **THEN** the agent states that the surface is unmapped in this pilot
- **AND** it does not wander into another mapped surface as a substitute

### Requirement: Consulted Files Must Be Declared

The routing contract SHALL make context usage inspectable.

#### Scenario: Agent declares consulted files before acting

- **WHEN** the agent is about to provide a substantive response or make edits
- **THEN** it declares which routing/context files it consulted
- **AND** it declares the selected working surface

### Requirement: Pilot File Contract Exists

The pilot SHALL expose its routing interface through explicit files.

#### Scenario: Required pilot files are present

- **WHEN** the repository is inspected for the routing pilot
- **THEN** the following files exist:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `index.md`
  - `openspec/AGENTS.md`
  - `openspec/CONTEXT.md`
  - `docs/AGENTS.md`
  - `docs/CONTEXT.md`

### Requirement: Manual Acceptance Gate Exists

The pilot SHALL define a manual acceptance suite before expansion.

#### Scenario: Manual acceptance records required fields

- **WHEN** the manual acceptance suite is prepared
- **THEN** it records at minimum:
  - prompt
  - consulted files
  - final folder chosen
  - expected behavior
  - actual result
  - pass/fail

#### Scenario: Expansion is blocked until both pilot runs pass

- **WHEN** the pilot has not yet passed in both Codex and Claude Code
- **THEN** the routing contract does not expand to the next folder wave

### Requirement: Post-Pilot Expansion Uses Ordered Waves

The routing rollout SHALL expand in explicit waves after the validated pilot.

#### Scenario: Docs-heavy surfaces expand before broader code surfaces

- **WHEN** the pilot has passed
- **THEN** the next routing wave targets docs-heavy surfaces first
- **AND** AI-tooling surfaces follow after that
- **AND** core monorepo packages follow after those waves
- **AND** remaining packages expand by functional group rather than by ad hoc folder picks

### Requirement: Package Expansion Uses A Parent Package Surface

The routing rollout SHALL introduce a package-index surface before broad leaf-package expansion.

#### Scenario: `packages/` becomes the package routing entrypoint

- **WHEN** routing expands into the monorepo package tree
- **THEN** the repository provides `packages/AGENTS.md` and `packages/CONTEXT.md`
- **AND** leaf package routing is selected through that package-index surface
- **AND** the root map does not need to improvise leaf-package rules directly

### Requirement: Every New Mapped Surface Preserves The File Contract

Every new mapped surface SHALL use the same repo-native contract shape as the validated pilot.

#### Scenario: New mapped surface is added

- **WHEN** a new folder becomes a first-class routing surface
- **THEN** it has `AGENTS.md` and `CONTEXT.md`
- **AND** `index.md` is updated to describe that surface
- **AND** its local contract includes bounce-back behavior when the prompt is mislocated

### Requirement: Existing Local AGENTS Contracts Are Harmonized

Pre-existing local `AGENTS.md` files SHALL not diverge from the root routing contract.

#### Scenario: Surface already has local agent instructions

- **WHEN** a folder such as `packages/twenty-codex-plugin` already contains `AGENTS.md`
- **THEN** that local contract is reconciled with the root routing model
- **AND** it does not silently keep contradictory routing behavior

### Requirement: External Discovery Tools Stay Optional

External graph or codebase-understanding tools SHALL remain optional aids, not routing authorities.

#### Scenario: Understand Anything is used during rollout planning

- **WHEN** the team uses Understand Anything or a similar graphing tool
- **THEN** it may help discover candidate boundaries, dependencies, or routing surfaces
- **AND** the authoritative routing contract still lives in repository files
- **AND** no plugin install is required for the routing system to function

### Requirement: Each Expansion Wave Extends Manual Acceptance

Each new rollout wave SHALL extend the manual acceptance suite before that wave closes.

#### Scenario: New wave is prepared

- **WHEN** a new surface wave is added
- **THEN** the manual acceptance document adds cases for root routing, wrong-folder bounce, consulted-file declaration, and unmapped refusal
- **AND** the results are recorded for both Codex and Claude Code before the wave is marked complete
