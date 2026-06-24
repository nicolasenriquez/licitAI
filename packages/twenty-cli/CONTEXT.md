# Twenty CLI Context

## Purpose

Describe the role of `packages/twenty-cli` during the workspace routing rollout.

## What Lives Here

- The Twenty CLI — command-line tooling for Twenty development workflows.
- CLI commands, argument parsing, and help text.
- CLI build configuration, binary packaging, and npm publish metadata.

## Current Routing Status

- `packages/twenty-cli` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-cli` for CLI package work such as:

- adding or modifying CLI commands and flags
- adjusting CLI argument parsing or help text
- working on CLI build or binary packaging configuration

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or other package code in the monorepo

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
