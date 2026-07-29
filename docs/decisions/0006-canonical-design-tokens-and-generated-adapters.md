---
type: adr
title: "Canonical Design Tokens and Generated Adapters"
description: "Use DTCG token records in Git as the canonical source for product and marketing visual registers."
status: Accepted
date: 2026-07-27
okf_version: "0.1"
---
# Canonical Design Tokens and Generated Adapters

## Status
Accepted — 2026-07-27

## Purpose
Establish one machine-readable design-token source without breaking the public
`twenty-ui` theme contracts or conflating product and marketing semantics.

## Primary Audience
Frontend engineers, designers, Figma maintainers, reviewers, and AI agents.

## Executive Summary
`packages/twenty-design-tokens` is the private workspace seam for design-token
authoring. DTCG-shaped JSON in Git is authoritative; CSS, TypeScript, Figma,
and legacy theme adapters are generated artifacts. Product and marketing keep
separate semantic registers while reusing primitives only when they represent
the same visual decision.

## Context
The repository currently has a public `twenty-ui/theme-constants` contract, a
large product theme object, and a separate token implementation in
`twenty-website-redone`. Changing those contracts directly would create visual
and runtime risk. Figma also needs a portable representation, but cannot become
a second source of truth.

## Decision

- Keep source records under `packages/twenty-design-tokens/src/source/`.
- Use the interoperable DTCG subset `$value`, `$type`, `$description`, and
  complete aliases such as `{primitives.color.white}`.
- Organize source records as `primitives`, `product`, and `marketing`.
- Require product light/dark parity and marketing light/muted/dark parity.
- Require descriptions for semantic tokens and reject missing aliases and
  alias cycles before generation.
- Generate CSS, TypeScript accessors, DTCG/Figma bundles, and compatibility
  artifacts from a deterministic compiler.
- Preserve `--t-*`, `.light`, `.dark`, `themeCssVariables`, `ThemeProvider`,
  and the existing `twenty-ui` exports during the incremental migration.
- Treat token names and generated adapters as versioned APIs. Renames use a
  deprecation alias and migration note; removal requires a major version.
- Require design and frontend approval for semantic changes. A Figma sync may
  operate from a branch/PR only; there is no bidirectional automation in this
  phase.

## Consequences

### Positive
- New token decisions have one reviewable source and reproducible outputs.
- Product and marketing can evolve independently without semantic leakage.
- Existing consumers can migrate by adapter while visual parity is measured.
- Figma receives an importable bundle without becoming authoritative.

### Costs
- Generated artifacts must be refreshed and checked into Git.
- The initial source population is incremental; the legacy theme remains in
  place until parity is proven.
- Token renames need an explicit compatibility window.

### Constraints
- Do not author new visual values in generated files or in Figma.
- Do not add a semantic token for every CSS property; component tokens remain
  local to the component library unless a stable shared decision exists.
- Do not merge semantic token changes without design and frontend review.

## Alternatives Considered

### Keep the existing TypeScript theme objects as authority
- **What**: Continue editing `twenty-ui` TypeScript and website token modules.
- **Why rejected**: It cannot provide one portable DTCG/Figma source and makes
  cross-register validation difficult.

### Make Figma the authority
- **What**: Sync code from Figma and treat Figma variables as canonical.
- **Why rejected**: Source review, CI validation, versioning, and local builds
  would depend on an external design tool and credentials.

### Share one semantic register across product and marketing
- **What**: Use identical names and modes for both surfaces.
- **Why rejected**: The surfaces intentionally differ in density, mood, and
  interaction posture; only equivalent primitives should be shared.

## Related Documents
- `docs/design/index.md` — normative navigation for the token system.
- `docs/design/token-governance.md` — taxonomy and contribution rules.
- `packages/twenty-design-tokens/` — canonical source and compiler.
- [DTCG format](https://www.designtokens.org/TR/2025.10/format/) — source format reference.
- [Style Dictionary DTCG](https://styledictionary.com/info/dtcg/) — interoperability reference.
