# Twenty Front Context

## Purpose

Describe the role of `packages/twenty-front` during the workspace routing rollout.

## What Lives Here

- React 18 frontend application — the main browser-facing user interface for Twenty.
- Jotai state management: atoms for primitive state, selectors for derived state, atom families for dynamic collections.
- Apollo Client for GraphQL data fetching and cache management.
- Linaria for zero-runtime CSS-in-JS styling (styled-components pattern).
- Vite build tooling, development server, and production bundling.
- Frontend routing, navigation, page layouts, and workspace-scoped application logic.
- GraphQL code generation (`graphql:generate`, `graphql:generate --configuration=metadata`).

## Current Routing Status

- `packages/twenty-front` is mapped as a core monorepo leaf surface.
- The `packages/` index surface must be consulted before entering this surface.
- No pre-existing local `AGENTS.md` file existed before this wave.

## How To Use This Surface

Use `packages/twenty-front` for frontend code work such as:

- adding or modifying React components, hooks, pages, or layouts
- adjusting Jotai state atoms, selectors, or atom families
- modifying Apollo queries, mutations, or cache policies
- working on Linaria styles, CSS, SCSS, or component styling
- adjusting the frontend routing, navigation, or app structure
- running frontend tests, Storybook, or type checking
- generating GraphQL types after schema changes

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend server code in `packages/twenty-server`
- shared type/utility code in `packages/twenty-shared`
- UI component library code in `packages/twenty-ui`

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
