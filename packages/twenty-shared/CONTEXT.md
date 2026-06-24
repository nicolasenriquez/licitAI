# Twenty Shared Context

## Purpose

Describe the role of `packages/twenty-shared` during the workspace routing rollout.

## What Lives Here

- Common TypeScript types and interface contracts used across the monorepo.
- Shared utility functions and type guards (`isDefined`, `isNonEmptyString`, `isNonEmptyArray`, etc.).
- Cross-package DTOs, error types, and validation helpers.
- Shared constants and configuration types used by server, front, and UI packages.
- The package build configuration, barrel exports, and public API surface.

## Current Routing Status

- `packages/twenty-shared` is mapped as a core monorepo leaf surface.
- The `packages/` index surface must be consulted before entering this surface.
- No pre-existing local `AGENTS.md` file existed before this wave.

## How To Use This Surface

Use `packages/twenty-shared` for shared-library code work such as:

- adding or modifying shared types, interfaces, or type guards
- adjusting cross-package DTOs or error contracts
- updating shared constants or configuration types
- building `twenty-shared` (must be built first before other packages)
- validating that type changes do not break downstream consumers

## Dependencies Note

`twenty-shared` is built before `twenty-server`, `twenty-front`, and `twenty-ui`. Changes here affect all downstream packages. Validate with type checks and builds on consuming packages after any change.

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend server code in `packages/twenty-server`
- frontend application code in `packages/twenty-front`
- UI component library code in `packages/twenty-ui`

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
