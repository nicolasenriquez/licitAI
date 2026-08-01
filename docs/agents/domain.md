---
type: agent-contract
title: "Domain Documentation"
description: "Routing and vocabulary rules for domain documentation work."
okf_version: "0.1"
---

# Domain Docs

Engineering skills should follow the repository's mapped documentation
surfaces when consuming domain language and decisions.

## Before exploring, read these

- `AGENTS.md` and `index.md` at the repository root for routing.
- The relevant surface contract and context, such as `docs/AGENTS.md` plus
  `docs/CONTEXT.md`, or `openspec/AGENTS.md` plus `openspec/CONTEXT.md`.
- The relevant durable documentation under `docs/`, including ADRs when they
  exist for the area being explored.

This repository intentionally has no root `CONTEXT.md` or `CONTEXT-MAP.md`.
Do not create either file solely to satisfy a skill; use the existing mapped
surface contexts instead.

## Use the repository vocabulary

When an output names a domain concept, use the terminology established in the
relevant `docs/` context and business documentation. If a required concept is
not defined, record the gap rather than silently inventing a competing term.

## Flag decision conflicts

If an output contradicts an existing ADR or documented repository decision,
surface the conflict explicitly instead of silently overriding it.
