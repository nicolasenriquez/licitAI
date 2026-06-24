# Twenty Client SDK Context

## Purpose

Describe the role of `packages/twenty-client-sdk` during the workspace routing rollout.

## What Lives Here

- The Twenty Client SDK — client-side programmatic interface for integrating with Twenty.
- Public type definitions, client SDK exports, and API surface.
- Client SDK build configuration and package metadata.

## Current Routing Status

- `packages/twenty-client-sdk` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-client-sdk` for client SDK package work such as:

- adding or modifying client SDK exports or API surface
- updating client SDK type definitions
- adjusting client SDK build or publish configuration

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or other package code in the monorepo

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
