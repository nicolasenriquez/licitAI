# Twenty Emails Context

## Purpose

Describe the role of `packages/twenty-emails` during the workspace routing rollout.

## What Lives Here

- Email templates built with React Email for Twenty.
- Email components, layouts, and styling.
- Email template rendering and transport configuration.
- Email package build configuration and metadata.

## Current Routing Status

- `packages/twenty-emails` is mapped as a remaining-package leaf surface (wave 5).
- The `packages/` index surface must be consulted before entering this surface.

## How To Use This Surface

Use `packages/twenty-emails` for email template work such as:

- adding or modifying React Email templates
- adjusting email components, layouts, or styling
- working on email rendering or transport config

## Scope Boundary

This surface is not the durable home for:

- active OpenSpec artifacts under `openspec/`
- root repository architecture, governance, or ADR docs under `docs/`
- backend, frontend, or UI library code in other packages

If the prompt is about those topics, go back to `../../CONTEXT-MAP.md` and reroute.
