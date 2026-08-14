---
type: change-spec
title: repo-okf-documentation-adoption Spec
description: Requirements for adopting the repository OKF documentation topology.
okf_version: "0.1"
---

# Spec: repo-okf-documentation-adoption

## ADDED Requirements

### Requirement: Root Index Replaces The Prior Routing Map

The repository SHALL use root `index.md` as the canonical routing map instead
of `CONTEXT-MAP.md`.

#### Scenario: Root routing starts at `AGENTS.md` and moves into `index.md`

- **WHEN** an agent starts substantive work in this checkout
- **THEN** it reads root `AGENTS.md`
- **AND** it uses root `index.md` as the canonical routing map
- **AND** `CONTEXT-MAP.md` is no longer the routing source of truth

#### Scenario: Historical artifacts preserve prior routing truth

- **WHEN** an OpenSpec artifact is preserving prior accepted routing behavior
- **THEN** it may mention `CONTEXT-MAP.md` descriptively
- **AND** that mention does not make it a live routing contract

### Requirement: Root Index Uses The Canonical Frontmatter Contract

Root `index.md` SHALL be the only `index.md` in this slice that carries the
canonical frontmatter contract.

#### Scenario: Root index declares its role explicitly

- **WHEN** root `index.md` is created for this slice
- **THEN** it includes `type`, `title`, `description`, and
  `okf_version: "0.1"`
- **AND** no non-root `index.md` in this slice is required to carry frontmatter

### Requirement: Major Documentation Surfaces Expose Local Indexes

Mapped documentation surfaces SHALL expose `index.md` for progressive
disclosure.

#### Scenario: Major surfaces provide local navigation

- **WHEN** a user or agent enters `docs/`, `openspec/`, `packages/`, `.codex/`,
  or `.opencode/`
- **THEN** that surface provides a local `index.md`
- **AND** the index helps route from the surface contract to durable leaf docs
- **AND** the non-root `index.md` remains a body-only navigation layer

### Requirement: Routing Contracts Bounce Through Root Index

Routing contracts SHALL bounce through root `index.md`.

#### Scenario: Mislocated prompt reroutes through root

- **WHEN** a prompt lands in the wrong mapped surface
- **THEN** the local contract sends the agent back through root `index.md`
- **AND** the agent reroutes from there instead of staying in the wrong surface

### Requirement: Existing Documentation Updates Stay Additive

Existing documentation SHALL receive only additive metadata and formatting
changes in this change.

#### Scenario: Existing doc is updated during OKF adoption

- **WHEN** an existing documentation file is touched by this change
- **THEN** the allowed edits are frontmatter, heading normalization, spacing
  cleanup, and routing-link fixes
- **AND** the update does not restate or reinterpret the document body

### Requirement: Metadata Rollout Stays Within The Defined Corpus

The additive metadata rollout SHALL stay within the explicitly defined
documentation corpus for this slice.

#### Scenario: File selection for metadata rollout

- **WHEN** implementation selects existing docs for additive metadata
- **THEN** the selection is limited to root markdown docs, `docs/**`,
  `openspec/**`, `.codex/**` markdown, `.opencode/**` markdown, and mapped
  package-surface entry docs plus durable package docs
- **AND** vendor or generated markdown such as `node_modules/**`, build output,
  and third-party cache trees are excluded

### Requirement: Existing Documentation Bodies Stay Semantically Stable

Existing documentation bodies SHALL remain semantically unchanged during OKF
adoption.

#### Scenario: Existing durable doc receives OKF metadata

- **WHEN** a durable doc receives frontmatter in this slice
- **THEN** its substantive sections keep the same meaning
- **AND** no substantive section is removed to make room for OKF structure

### Requirement: Stable Document-Type Taxonomy Exists

The repository SHALL define and use a stable OKF document-type taxonomy.

#### Scenario: Frontmatter is added to a document

- **WHEN** a document receives OKF frontmatter
- **THEN** its `type` value comes from the repository taxonomy
- **AND** the taxonomy is documented in a durable repository doc

### Requirement: Documentation Ordering Is Explicit

The repository SHALL document the expected ordering from root routing to surface
docs.

#### Scenario: Reading order is disclosed

- **WHEN** a reader follows the repository documentation topology
- **THEN** the ordering is root entrypoint -> root index -> surface routing
  files -> surface index -> durable leaf docs

### Requirement: Log Is Deferred In The First Adoption Slice

The repository SHALL not require `log.md` for the first OKF adoption slice.

#### Scenario: History surface is needed

- **WHEN** a reader needs historical context during this slice
- **THEN** they use `git history`, `CHANGELOG.md`, or OpenSpec artifacts
- **AND** the repository does not claim that `log.md` is required yet
