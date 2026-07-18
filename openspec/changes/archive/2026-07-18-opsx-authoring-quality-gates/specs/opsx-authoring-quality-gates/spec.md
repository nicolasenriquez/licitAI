---
type: change-spec
title: "Spec: opsx-authoring-quality-gates"
description: "Requirements for executable Opsx authoring quality gates."
okf_version: "0.1"
---

# Spec: opsx-authoring-quality-gates

## ADDED Requirements

### Requirement: Authoring identifies ownership and the highest test seam

The Opsx authoring workflow SHALL require a change to identify its highest
existing Seam, the owning Module, and the highest test Seam before
implementation slices are considered ready.

#### Scenario: Existing seam is recorded before slicing

- **WHEN** an author prepares a change with a behavior or contract seam
- **THEN** the proposal or design records the highest existing Seam and its
  owning Module
- **AND** it records the Interface crossed by callers and tests
- **AND** it does not invent a lower Seam without explaining why the higher
  Seam is insufficient

### Requirement: Authoring names the first proof and prior art

The workflow SHALL require behavior-first contract coverage for changes with
runtime, integration, UI, persistence, or regression risk.

#### Scenario: First proof is explicit

- **WHEN** a change has runtime or contract risk
- **THEN** its proposal or design names the first failing behavior or contract
  proof
- **AND** it names relevant prior art for the test type
- **AND** the proof targets external behavior across the chosen Seam

#### Scenario: Docs-only change omits fail-first coverage explicitly

- **WHEN** a change is classified as docs-or-governance-change with no runtime
  effect
- **THEN** the proposal explicitly justifies omitting Phase 1
- **AND** verification covers artifact coherence instead

### Requirement: Dependency-sensitive changes expose executable order

The workflow SHALL require an Execution Order section when a change has
multiple slices, dependencies between phases, parallel work, or a wide refactor
that could be misread as numeric order.

#### Scenario: Schema to backend to API order is explicit

- **WHEN** tasks have a real schema → backend → API dependency
- **THEN** tasks.md contains slices listing task IDs in executable order
- **AND** each slice has an observable checkpoint
- **AND** the order is not inferred solely from layer headings

#### Scenario: Simple change keeps low ceremony

- **WHEN** a change has one simple implementation slice and no dependency edge
- **THEN** numeric task order remains sufficient
- **AND** Execution Order is not required

### Requirement: Slices and dependency edges remain valid

The workflow SHALL require implementation slices to be vertical, demoable or
verifiable, and small enough to complete in one fresh context when practical.

#### Scenario: Parallel slices declare real blockers

- **WHEN** two slices can start independently and a third slice depends on both
- **THEN** the independent slices list Blocked by: None
- **AND** the dependent slice lists both existing task or slice IDs in Blocked
  by:
- **AND** no dependency cycle is present

#### Scenario: Wide refactor uses expand-contract

- **WHEN** one mechanical refactor has a blast radius too broad for a green
  vertical slice
- **THEN** tasks sequence expand, migrate batches, and contract
- **AND** the contract task is blocked by every migration batch
- **AND** each migration batch remains independently verifiable where possible

### Requirement: Task identity and traceability remain compatible

The workflow SHALL keep numeric task IDs stable and require canonical
Traceability: lines on new checkbox tasks.

#### Scenario: New task IDs are stable and unique

- **WHEN** implementation begins for a change
- **THEN** existing numeric task IDs are not renumbered
- **AND** each task appears once in Execution Order when that section applies
- **AND** dependency references point to existing IDs
- **AND** dependency edges are acyclic

#### Scenario: Historical footnotes remain accepted

- **WHEN** an existing change contains a Footnote: line instead of a
  Traceability: line
- **THEN** the command contract remains compatible with that historical artifact
- **AND** new or materially edited tasks use Traceability:

### Requirement: Matt skills guide authoring without publishing parallel artifacts

The Opsx workflow SHALL use the selected Matt rules as guidance without
executing tracker-publishing commands or creating duplicate artifacts.

#### Scenario: Ambiguity invokes the real grilling path

- **WHEN** ownership, intent, or domain scope is materially ambiguous
- **THEN** authoring pauses for /grilling one question at a time
- **AND** it preserves the Opsx protocol of exactly three alternatives and one
  recommendation
- **AND** /grill-with-docs references the available skill at
  .agents/skills/grill-with-docs/SKILL.md

#### Scenario: Tracker commands stay outside normal Opsx authoring

- **WHEN** an author uses the seam or slice rules from to-spec or to-tickets
- **THEN** OpenSpec remains the source of truth in proposal.md, design.md,
  tasks.md, and specs/
- **AND** no tracker publication or parallel tickets.md is performed by
  default
