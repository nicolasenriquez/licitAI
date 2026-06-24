# Twenty UI Context

## Purpose

Describe the role of `packages/twenty-ui` during the workspace routing rollout.

## What Lives Here

- Twenty's shared UI component library — 192 components across 13 subpath modules.
- Base UI behavioral primitives with Twenty's visual design layered on top.
- SCSS Modules styling with CSS variable theming (`--t-*` tokens).
- Storybook component stories, interaction tests, a11y tests, and visual regression tests.
- Theme providers, icon system (`IconsProvider`), color helpers, and design tokens.
- Display, input, layout, navigation, feedback, and utility components.
- The `modules/ui` migration from `twenty-front` (Phase 4 — generic/hybrid components).

## Current Routing Status

- `packages/twenty-ui` is mapped as a core monorepo leaf surface.
- The `packages/` index surface must be consulted before entering this surface.
- No pre-existing local `AGENTS.md` file existed before this wave.

## How To Use This Surface

Use `packages/twenty-ui` for UI library work such as:

- adding or modifying shared components, stories, or component tests
- integrating Base UI primitives for behavioral components
- adjusting SCSS Modules styling, tokens, or theme variables
- running Storybook, a11y tests, visual regression tests, or size checks
- migrating generic/hybrid components from `twenty-front/src/modules/ui`
- updating the package build, publish pipeline, or export maps

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend server code in `packages/twenty-server`
- frontend application logic in `packages/twenty-front`
- shared type/utility code in `packages/twenty-shared`

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
