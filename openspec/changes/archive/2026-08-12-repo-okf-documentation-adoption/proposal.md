---
type: change-proposal
title: repo-okf-documentation-adoption Proposal
description: Proposal for adopting an OKF-shaped documentation topology safely.
okf_version: "0.1"
---

# Change Proposal: repo-okf-documentation-adoption

## Why

The repository already has a file-based routing contract, but that contract is
not yet shaped as an OKF-style documentation bundle. In particular,
`CONTEXT-MAP.md` is the routing source of truth even though the repository now
needs a canonical root `index.md` and progressive-disclosure indexes on major
documentation surfaces.

This change adopts OKF across the repository documentation in an additive,
safe way. It keeps `AGENTS.md` as the top-level operational entrypoint,
replaces `CONTEXT-MAP.md` with root `index.md` as the canonical routing map,
adds surface indexes, and introduces bounded metadata rollout without rewriting
existing document bodies.

## Scope

### In

- Root `index.md` as the canonical routing map
- Progressive-disclosure `index.md` files for:
  - `/`
  - `docs/`
  - `openspec/`
  - `packages/`
  - `.codex/`
  - `.opencode/`
- Routing-contract updates from `CONTEXT-MAP.md` to `index.md`
- Historical references to `CONTEXT-MAP.md` may remain in archived or
  evidence-style OpenSpec artifacts when they describe prior accepted behavior
- Additive metadata rollout on this bounded existing documentation corpus only:
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
- OKF support docs:
  - `docs/standards/okf-standard.md`
  - `docs/architecture/documentation-topology.md`
  - `docs/operations/okf-authoring-guide.md`
- Removal of `CONTEXT-MAP.md` after reference cleanup

### Out

- Rewriting existing documentation bodies
- Restating policies or technical guidance beyond routing-source replacement
- Touching markdown under dependency/vendor trees such as `node_modules/`,
  generated output, build output, or third-party cached assets
- Inventing new package-surface routing rules outside the already mapped
  surfaces
- Product or runtime behavior changes
- Claiming full-repo OKF conformance
- Adding `log.md` in v1

## Decisions

- The change is classified as a `docs-or-governance-change`.
- The repository is one OKF bundle rooted at `/`.
- Root `AGENTS.md` stays authoritative as the first file to read.
- Root `index.md` replaces `CONTEXT-MAP.md` as the canonical routing map.
- Historical artifacts may still mention `CONTEXT-MAP.md` when they are
  preserving prior routing truth rather than acting as a live contract.
- Root `index.md` is the only `index.md` in this slice that carries
  frontmatter, using `type`, `title`, `description`, and `okf_version: "0.1"`.
- Non-root `index.md` files in this slice are body-only progressive-disclosure
  documents.
- Existing documents may receive only additive metadata and bounded formatting
  cleanup.
- Existing document bodies must remain semantically unchanged in this change.
- `log.md` is deferred. `git history`, `CHANGELOG.md`, and OpenSpec artifacts
  remain the history surfaces for now.

## Phase 1 Omission

Phase 1 fail-first coverage is intentionally omitted. This change does not
alter runtime behavior, transport behavior, or product contracts. Verification
is documentation-structure, routing, and reference consistency oriented rather
than fail-first execution oriented.
