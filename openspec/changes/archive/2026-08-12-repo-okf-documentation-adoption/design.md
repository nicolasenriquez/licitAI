---
type: change-design
title: repo-okf-documentation-adoption Design
description: Design for the repository OKF documentation adoption slice.
okf_version: "0.1"
---

# Design: repo-okf-documentation-adoption

## Summary

Adopt an OKF-shaped documentation topology across the repository while keeping
the existing operational model intact.

The design is intentionally additive:

- keep root `AGENTS.md` canonical
- replace `CONTEXT-MAP.md` with root `index.md`
- add local `index.md` files only on major documentation surfaces
- add frontmatter and bounded formatting fixes without rewriting document bodies
- define a stable repository document taxonomy

## Bundle Model

The repository is treated as one OKF bundle rooted at `/`.

Root contract:

- `AGENTS.md` is the canonical operational entrypoint
- `CLAUDE.md` remains a shim into the same root contract
- `index.md` is the canonical routing map
- root `index.md` is the only `index.md` in this slice that carries
  frontmatter

## Surface Index Model

The following surfaces expose local progressive-disclosure indexes:

- `docs/index.md`
- `openspec/index.md`
- `packages/index.md`
- `.codex/index.md`
- `.opencode/index.md`

These indexes are additive navigation layers. They do not replace existing
durable `README.md` files unless a separate change explicitly does so.

Index shape rules:

- root `index.md` carries frontmatter:
  - `type`
  - `title`
  - `description`
  - `okf_version: "0.1"`
- non-root `index.md` files in this slice are body-only
- local indexes stay navigational and do not duplicate durable leaf-doc content

## Existing-Document Adoption Rules

Allowed edits on existing documents:

- YAML frontmatter
- heading normalization
- spacing cleanup
- routing-link replacement from `CONTEXT-MAP.md` to `index.md`

Historical artifact preservation rule:

- references to `CONTEXT-MAP.md` may remain in historical OpenSpec artifacts,
  manual-acceptance evidence, or prior change docs when those references
  describe previously accepted routing behavior rather than acting as a live
  routing contract

In-scope existing-document corpus only:

- root markdown docs: `AGENTS.md`, `CLAUDE.md`, `README.md`, `PRODUCT.md`,
  `DESIGN.md`, `CHANGELOG.md`
- `docs/**`
- `openspec/**`
- `.codex/**` markdown docs, commands, skills, and references
- `.opencode/**` markdown docs, skills, and references
- mapped package-surface entry docs and durable package docs such as local
  `AGENTS.md`, `CONTEXT.md`, durable `README.md`, `CHANGELOG.md`,
  `CONTRIBUTING.md`, `CHECKLIST.md`, `MIGRATION.md`, and package-local
  markdown references

Forbidden edits on existing documents:

- rewriting body prose
- changing section meaning
- deleting substantive sections
- changing runtime or package guidance
- touching vendor or generated markdown such as `node_modules/**`, build output,
  or third-party cache trees

## Taxonomy

The repository uses a stable `type` taxonomy for frontmatter.

This slice uses:

- `index`
- `agent-contract`
- `agent-shim`
- `context`
- `readme`
- `architecture`
- `business-context`
- `governance`
- `operations-guide`
- `standard`
- `template`
- `decision`
- `design-guide`
- `product-vision`
- `product-overview`
- `design-overview`
- `change-proposal`
- `change-design`
- `change-tasks`
- `change-spec`
- `change-investigation`
- `test-design`
- `manual-acceptance`
- `surface-inventory`
- `schema-catalog`
- `command`
- `skill`
- `reference`
- `changelog`
- `checklist`
- `contributing`
- `migration-guide`

## Ordering Rules

Routing and reading should disclose from general to specific:

1. Root operational entrypoint
2. Root routing map
3. Surface-local routing files
4. Surface-local index
5. Durable leaf documents

## Deferred Conformance

This change makes the repository OKF-shaped before it claims to be fully
OKF-conformant. `log.md` stays deferred, and metadata rollout remains bounded
to safe additive updates in this slice.
