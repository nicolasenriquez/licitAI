# Twenty Front Component Renderer Context

## Purpose

Describe the role of `packages/twenty-front-component-renderer` during the workspace routing rollout.

## What Lives Here

- The frontend component renderer — renders Twenty app components within the frontend.
- Component rendering logic, rendering pipelines, and renderer configuration.
- Renderer build configuration and package metadata.

## Current Routing Status

- `packages/twenty-front-component-renderer` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-front-component-renderer` for renderer work such as:

- adding or modifying component rendering logic
- adjusting rendering pipelines or renderer config
- working on renderer build or integration

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend app, or UI library code in other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
