---
type: governance
title: Documentation Authority
description: Canonical sources, owners, review triggers, and verification for shared documentation.
okf_version: "0.1"
---

# Documentation Authority

## Purpose

Define one canonical source for each shared documentation concern. This matrix
does not replace the source documents.

## Authority Matrix

| Concern | Canonical source | Primary owner | Review trigger | Verifier |
| --- | --- | --- | --- | --- |
| Agent entry and routing | `AGENTS.md`, then `index.md` | `docs/` authors | A mapped surface or entry order changes. | Read the root-to-surface route. |
| Local agent rules | The closest applicable `AGENTS.md` | Surface owner | A surface gains or changes a local contract. | Read the instruction chain from root. |
| Documentation topology | `docs/architecture/documentation-topology.md` | `docs/` authors | A durable surface, index, or document role changes. | Check routing targets and links. |
| Documentation taxonomy | `docs/standards/okf-standard.md` | `docs/` authors | A document type or frontmatter rule changes. | Parse frontmatter and compare the taxonomy. |
| Documentation authoring | `docs/operations/okf-authoring-guide.md` | `docs/` authors | A durable document is added or retired. | Review the diff for bounded scope. |
| Architecture and governance | The relevant document in `docs/architecture/` or `docs/governance/` | Architecture lead | A shared rule or architecture decision changes. | Review source, ADR need, and links. |
| CI behavior | `.github/workflows/*.yaml` | `.github/` maintainers | Workflow triggers, jobs, or gates change. | Read the workflow and run its scoped check. |
| Code ownership | `.github/CODEOWNERS` and branch protection settings | Repository administrators | Ownership paths or review requirements change. | Review the file and repository settings. |

## Source Classes

Use repository truth for local behavior. Use official platform documents for
platform behavior. Use author primary sources to describe external methods.
Use community material only as context. Mark inferences as inferences.

## Review Rules

- Do not duplicate a canonical rule in a second document.
- Link to the canonical source when a reader needs detail.
- Remove a document only after checking incoming references and identifying its
  replacement or recording that no replacement exists.
- Treat a workflow count as derived repository data. Recheck it when the
  workflow directory changes.
- Treat `CODEOWNERS` as a routing file. Branch protection determines whether a
  code-owner review is required. See [GitHub code-owner guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
