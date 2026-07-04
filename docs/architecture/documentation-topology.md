---
type: architecture
title: Documentation Topology
description: OKF bundle shape, surface model, and index hierarchy for repository docs.
okf_version: "0.1"
---

# Documentation Topology

## Purpose

Describe the repository's OKF bundle shape, document taxonomy, and index
hierarchy after the first documentation-adoption slice.

## Bundle Shape

The repository is treated as one OKF bundle rooted at `/`.

The root bundle contract is:

- `AGENTS.md` as the canonical operational entrypoint
- `index.md` as the canonical routing map
- additive metadata on existing documents
- local `index.md` files for progressive disclosure on major documentation
  surfaces

## Index Hierarchy

Routing flows top-down:

1. `/AGENTS.md`
2. `/index.md`
3. Surface-local routing files
4. Surface-local `index.md`
5. Durable leaf documents

Current major indexes:

- `/index.md`
- `docs/index.md`
- `openspec/index.md`
- `packages/index.md`
- `.codex/index.md`
- `.opencode/index.md`

## Surface Model

| Surface | Role | Durable Leaves |
| --- | --- | --- |
| Root | Entry and routing | Root operational and overview docs |
| `docs/` | Durable repository documentation | Architecture, business, governance, operations, standards, decisions |
| `openspec/` | Active change definitions | Proposal, design, tasks, specs, validation artifacts |
| `packages/` | Package-selection layer | Mapped package surfaces and package-local durable docs |
| `.codex/` | Repo-local Codex workflow docs | Commands, skills, references |
| `.opencode/` | Repo-local OpenCode workflow docs | Commands, skills, references |

## Taxonomy Use

The repository uses a stable `type` taxonomy so tooling and humans can infer a
document's role without rewriting body prose. The authoritative taxonomy lives
in `docs/standards/okf-standard.md`.

## Safe Adoption Rules

- Add frontmatter only.
- Preserve document body meaning.
- Allow heading normalization, spacing cleanup, and routing-link updates.
- Do not restate or reinterpret technical or governance content unless a
  separate change explicitly changes that content.
