---
type: standard
title: OKF Standard
description: Repository taxonomy, frontmatter contract, and index rules for OKF adoption.
okf_version: "0.1"
---

# OKF Standard

## Overview

This repository adopts an additive Open Knowledge File (OKF) shape for its
documentation. The goal is to make routing, document purpose, and progressive
disclosure explicit without rewriting existing document bodies.

## Core Rules

1. `AGENTS.md` remains the canonical operational entrypoint at the repository
   root.
2. Root `index.md` is the canonical routing map.
3. Major documentation surfaces expose a local `index.md` for progressive
   disclosure.
4. Existing documents may receive additive metadata and bounded formatting
   cleanup only.
5. Existing document bodies must remain semantically unchanged during OKF
   adoption unless a separate change explicitly changes content.

## Frontmatter Contract

Frontmatter is additive metadata. In this adoption slice, frontmatter may
include:

- `type`
- `title`
- `description`
- `okf_version`

Recommended default:

```yaml
---
type: standard
title: Example Title
description: Short statement of the document's role.
okf_version: "0.1"
---
```

## Document-Type Taxonomy

Use stable `type` values from this repository taxonomy:

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

## Index Rules

- Root `index.md` carries frontmatter and acts as the canonical routing map.
- Non-root `index.md` files in this slice stay body-only and act as navigation
  layers, not full document rewrites.
- Existing `README.md` files remain valid durable docs and are not replaced by
  local indexes unless a separate change explicitly says otherwise.

## Deferred Items

- `log.md` is deferred in this first OKF adoption slice.
- Full-repo conformance should not be claimed until metadata coverage is broad
  enough to support that claim.
