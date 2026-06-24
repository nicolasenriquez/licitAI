# Packages Context

## Purpose

Describe the role of `packages/` as the package-index routing surface during the workspace routing rollout.

## What Lives Here

`packages/` is the monorepo package tree. It contains application packages, shared libraries, SDK and CLI tooling, infrastructure, websites, testing surfaces, and AI-tooling packages.

## Current Routing Status

- `packages/` itself is mapped as a package-index surface.
- Leaf packages are mapped gradually by rollout wave.
- The currently mapped leaf packages are:
  - `packages/twenty-docs`
  - `packages/twenty-claude-skills`
  - `packages/twenty-codex-plugin`
  - `packages/twenty-server`
  - `packages/twenty-front`
  - `packages/twenty-shared`
  - `packages/twenty-ui`
  - `packages/twenty-sdk`
  - `packages/twenty-cli`
  - `packages/twenty-client-sdk`
  - `packages/create-twenty-app`
  - `packages/twenty-front-component-renderer`
  - `packages/twenty-emails`
  - `packages/twenty-companion`
  - `packages/twenty-zapier`
  - `packages/twenty-docker`
  - `packages/twenty-e2e-testing`
  - `packages/twenty-utils`
  - `packages/twenty-oxlint-rules`
  - `packages/twenty-website`
  - `packages/twenty-website-redone`
  - `packages/twenty-apps`
- All remaining leaf packages are now mapped. No further package-level routing expansion is needed.
- A pre-existing local `AGENTS.md` file does not automatically mean the leaf package is already harmonized with the root routing contract.

## Package Groups

### Docs-heavy wave

- `twenty-docs`
- `twenty-claude-skills`

### AI-tooling wave

- `twenty-codex-plugin`

### Core monorepo wave (now mapped)

- `twenty-server`
- `twenty-front`
- `twenty-shared`
- `twenty-ui`

### Remaining package groups (now mapped)

- SDK and CLI:
  - `twenty-sdk`
  - `twenty-cli`
  - `twenty-client-sdk`
  - `create-twenty-app`
- App/runtime support:
  - `twenty-front-component-renderer`
  - `twenty-emails`
  - `twenty-companion`
  - `twenty-zapier`
- Infra, testing, and utilities:
  - `twenty-docker`
  - `twenty-e2e-testing`
  - `twenty-utils`
  - `twenty-oxlint-rules`
- Websites and adjacent product surfaces:
  - `twenty-website`
  - `twenty-website-redone`
- App collections:
  - `twenty-apps`

## How To Use This Surface

1. Identify the package or package group that matches the task.
2. If the leaf package already has a mapped routing contract, enter that leaf package surface.
3. If the leaf package is not mapped yet, stay in `packages/` and use package-index context only.

## Scope Boundary

This surface is for package selection and package-scoped routing.

It is not the durable home for:

- active OpenSpec change artifacts
- top-level governance or ADR work
- package-local contracts that have not been mapped yet

If the prompt is about those topics, go back to `../CONTEXT-MAP.md` and reroute.
