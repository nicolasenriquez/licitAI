# Twenty SDK Context

## Purpose

Describe the role of `packages/twenty-sdk` during the workspace routing rollout.

## What Lives Here

- The Twenty SDK — programmatic interface for integrating with Twenty.
- Public type definitions, SDK exports, and API surface.
- SDK build configuration and package metadata.

## Current Routing Status

- `packages/twenty-sdk` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-sdk` for SDK package work such as:

- adding or modifying SDK exports or API surface
- updating SDK type definitions
- adjusting SDK build or publish configuration

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or UI library code in other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
