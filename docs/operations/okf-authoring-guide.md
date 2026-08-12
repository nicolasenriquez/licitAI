---
type: operations-guide
title: OKF Authoring Guide
description: Safe additive authoring rules for OKF-shaped documentation updates.
okf_version: "0.1"
---

# OKF Authoring Guide

## Purpose

Explain how to extend the repository's OKF-shaped documentation topology
without turning documentation adoption into a content rewrite.

## When To Add Frontmatter

Add frontmatter when a document is durable enough that its role should be
machine-readable or scannable at the file header.

In this repository, that includes:

- routing contracts such as `AGENTS.md` and `CONTEXT.md`
- durable docs under `docs/`
- OpenSpec change artifacts
- repo-local `.agents/` skill and workflow docs
- mapped package-surface entry docs and durable package docs

## When To Add `index.md`

Add a local `index.md` when a folder is a major documentation surface that
needs progressive disclosure, not when a single `README.md` is already a
sufficient durable leaf.

Use an `index.md` when:

- the folder is a routing surface
- the folder collects multiple concept documents
- the folder benefits from a curated reading order

Do not add an `index.md` just to duplicate a small leaf README.

## Safe Additive Update Policy

Allowed updates in OKF adoption slices:

- YAML frontmatter
- heading normalization
- spacing cleanup
- routing-link fixes
- new `index.md` files

Forbidden updates in OKF adoption slices:

- semantic rewrites of existing document bodies
- deleting substantive sections
- changing technical or policy meaning
- silently replacing a durable `README.md` with a new local source of truth

## Authoring Sequence

1. Start from root `AGENTS.md`.
2. Confirm the right surface through root `index.md`.
3. If the folder is a major surface, add or update its local `index.md`.
4. Add additive frontmatter to affected durable docs.
5. Keep routing language consistent with the root map.

## Deferred History

Use `git history`, `CHANGELOG.md`, and OpenSpec artifacts as history surfaces
for now. Do not add `log.md` in this first adoption slice.
