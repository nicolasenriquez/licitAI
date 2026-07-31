---
type: change-design
title: "Design: mercado-publico-workspace-redesign"
description: "Native Twenty composition for Mercado Público read surfaces."
okf_version: "0.1"
---

# Design: mercado-publico-workspace-redesign

## Routing Declaration

Surface: `openspec/`. Consulted: root `AGENTS.md`, `index.md`,
`openspec/{AGENTS,CONTEXT,index}.md`, the existing
`mercado-publico-command-center` change, the validated prototype stories, and
Wayfinder tickets 02 through 08.

## Context

The existing command-center change owns how Mercado Público data reaches the
application. This successor owns how the already-typed data is composed. On
application it supersedes only conflicting UI requirements in that change;
backend read, source-to-read, GraphQL, navigation route, and CLI-only ingestion
requirements remain unchanged. The route stays `/mercado-publico` with its
three URL-hash tabs.

### Authority matrix

| Retained | Replaced | Outside this change |
| --- | --- | --- |
| Route/hash navigation, read-only behavior, current reads and DTOs, exact filters/sorts, server pagination, truthful states, keyboard/context behavior, and CLI-only ingestion | Bespoke filter chrome, fixed overlay/focus trap, compact mobile list, duplicated monitoring wrappers, and Control Center presentation | Backend/read expansion, new metrics, ingestion changes, and unresolved predecessor resolver-environment verification |

`.scratch/mercado-publico-workspace-redesign/` is frozen evidence. This change
is the only active implementation authority and is not kept in dual sync with
its derived PRD or tickets.

## Goals / Non-Goals

**Goals**

- Preserve the approved information hierarchy with native Twenty shell,
  controls, feedback, tags, theme tokens, and desktop/mobile SidePanel host.
- Keep browse/detail compositions shallow and domain-local; expose only
  supported facts and truthful null, empty, partial, loading, and error states.
- Replace duplicate bespoke presentation only after observable parity.

**Non-Goals**

- Change a read DTO, GraphQL document, migration, or ingestion behavior.
- Promote detail fields into browse data or create metrics from incomplete
  pages; add a generic table, card dashboard, or procurement design system.

## Boundary and Ownership

### Workspace page module

`MercadoPublicoCommandCenterPage` owns active-hash continuity and per-tab
context. `MercadoPublicoBrowseTab` owns applied filters, server pagination, and
selected-code rendering. It delegates detail hosting, rather than recreating a
modal, focus trap, or mobile breakpoint.

### Native SidePanel boundary

The global SidePanel module owns desktop resizing, mobile full-screen behavior,
Escape, focus stack, and return focus. Mercado Público contributes one thin
registered page. A domain hook opens it with `family` and `code` stored in the
SidePanel instance's contextual `ComponentState`; the registered page consumes
that per-instance state and composes existing detail data.
Any `twenty-shared` page identifier is additive and must be used only by this
registration seam.

### Monitoring composition boundary

`MercadoPublicoControlCenterTab` owns the continuous factual read model and
local investigation-view context. It has exactly one mounted job/API table;
semantic local table markup owns dense responsive containment. It does not own
metric derivation, mutation controls, or data transport.

## Decisions

### Successor authority is narrow and explicit

This change supersedes the visual composition and removal criteria of
`mercado-publico-command-center` only after it is applied. Its data and
read-only authority stay in force. A desired field absent from current reads is
a contract gap and must be proposed separately.

Rationale: one behavioral source of truth without silently widening a
validated data boundary.

Alternatives considered:
- Amend the old change in place — rejected: it mixes completed backend work,
  unresolved environment checks, and later UI replacement into one history.
- Re-author backend and UI together — rejected: it reopens settled ingestion
  and DTO scope.

### One shallow browse/detail grammar, family-specific content

Both family tabs use Objeto, Organismo, Estado, Cierre, Publicada, Código;
Estado, Publicada desde/hasta, exact buyer-code, and changed-since filters;
sorting by `lastSeenAt`, `publishedAt`, `closingAt`, `processCode`, or
`canonicalState` in ascending or descending direction; and server pagination. An
activated title/button has an accessible `Abrir detalle de …` name. Compra
Ágil may show its typed source sections progressively; Licitaciones stops at
its common detail, items, adjudications, related OC evidence, lineage, and
reconciliation.

Rationale: shared interaction, no false equivalence between provider families.

Compra Ágil is implemented first without an upfront generic abstraction. While
adding Licitaciones, only the exact common browse seams are extracted; family
detail remains specific. Centro de Control is independent after scope lock and
does not wait for browse/detail implementation.

### Truth is represented by state, not decoration

`compraAgilSource=null` is source-pending, not no offers/budget/documents.
Missing values remain `No informado` or `No disponible`; unavailable browse
lists do not retain selected fixture detail. `lastSeenAt` is labelled as an
observation, never freshness. Empty monitoring pages expose their returned
scope; partial responses omit unavailable facts without zero substitution.

### Control Center remains continuous and bounded

Diagnóstico, Investigación, and Integridad render in one vertical sequence.
Quota remaining is allowed only as `max(0, dailyLimit - used)` per source with
both inputs visible. Job/API uses `hasMore`, not a global total; pipeline/CSV
never claim freshness, quality, coverage, or an aggregate score.

### Responsive and accessibility parity precedes deletion

Tables use bounded flex ancestors and a focusable local horizontal scroller at
narrow/200% widths. Browse remains the same six-column semantic table at mobile
width instead of switching to the predecessor's compact-list presentation.
Native components supply tokens and theme behavior.
Keyboard selection, Escape/close focus return, visible focus, one `h1`,
semantic headers, contrast, reduced motion, and unique tooltip IDs are
non-negotiable before bespoke code is removed.

## Blast Radius

### Touched runtime areas

- Mercado Público frontend page, browse/detail/control-center components,
  local styles, tests, and Storybook compositions.
- SidePanel registration and, only if necessary, its shared page-type union.

### Untouched runtime areas

- Server resolver/read services, GraphQL schema/documents, `mp` persistence,
  provider adapters, jobs, migrations, schedulers, and permissions.

## Rollout, Compatibility, and Rollback

- Roll out as an additive internal UI replacement on the existing route and
  query shape; preserve URL hashes, per-tab applied state, and read-only
  behavior. No data migration or dual-write is required.
- Keep the old bespoke presentation until the focused tests and cross-surface
  evidence prove that vertical slice; remove its equivalent legacy code in the
  same slice that activates the native replacement to avoid dual authorities.
- Roll back by restoring the prior frontend composition only. Existing queries,
  persisted data, and URL contracts remain compatible, so rollback needs no
  schema or ingestion action.

## Verification Strategy

- First prove the page/component behavior at the existing hooks + SidePanel
  seam using the real SidePanel host and contextual state: selected row/focus
  return, no stale unavailable detail, current query inputs, one heavy table,
  and no fabricated values.
- Use isolated stories for loaded/null/pending/loading/empty/error/partial and
  long Spanish text. Test light/dark, desktop/mobile, keyboard, 200%, and
  reduced motion in the validated Storybook audit harness.
- Run focused frontend tests and typecheck; build `twenty-shared` before
  consumer validation only if its SidePanel type changes.
- Automated ARIA, keyboard, focus, responsive, and Storybook evidence is the
  required implementation gate. Authenticated Docker E2E and manual NVDA/JAWS
  are optional unless a separate release policy requires them.
- The predecessor's unresolved resolver-environment check remains an inherited
  external verification risk and does not block this frontend-only change.
