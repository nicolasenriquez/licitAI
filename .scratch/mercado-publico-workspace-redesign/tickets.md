---
type: implementation-tickets
title: "Tickets: Mercado Público workspace redesign"
status: ready-for-agent
source: PRD.md
---

# Tickets: Mercado Público workspace redesign

Status: ready-for-agent

Tracer-bullet delivery plan for the Mercado Público workspace redesign. The
active OpenSpec change remains the implementation authority.

Work the **frontier**: any ticket whose blockers are complete. The first
frontier contains only **Fijar costura Mercado Público–SidePanel**.

## Fijar costura Mercado Público–SidePanel

**What to build:** A verifiable user-behavior contract at the authenticated
Mercado Público page, existing typed reads, and global SidePanel seam. It makes
pointer and keyboard detail activation, focus return, preserved browse context,
and truthful unavailable states safe to implement without a parallel overlay.

**Blocked by:** None — can start immediately.

- [ ] The supported read-field ceiling and successor UI authority are recorded
  before runtime code changes.
- [ ] The existing SidePanel registration seam is confirmed; a shared page type
  is added only if family/code cannot pass through the existing seam safely.
- [ ] Focused behavior tests fail until row activation opens native detail and
  close returns focus and browse context.
- [ ] State coverage fails if source-pending, unavailable, or null data shows
  stale fixture detail, zero substitution, or a freshness claim.

## Compra Ágil: browse y detalle nativos

**What to build:** A demoable Compra Ágil browse and process-detail experience
using the established native interaction seam. Analysts can discover supported
processes, paginate with server-owned scope, open SidePanel detail, and inspect
progressive source information without fabricated facts.

**Blocked by:** Fijar costura Mercado Público–SidePanel.

- [ ] Browse shows only Objeto, Organismo, Estado, Cierre, Publicada, and
  Código with supported controls and server pagination.
- [ ] Pointer, Enter, and Space open the same native detail; close preserves
  focus, active tab, applied filters, page, selection, and scroll context.
- [ ] Source-pending, loading, empty, error, and null states identify their
  scope without zeroes, inferred values, or stale selected detail.
- [ ] Compra Ágil detail reveals only typed, supported source sections and
  labels `lastSeenAt` as an observation rather than freshness.

## Licitaciones: browse y detalle nativos

**What to build:** A demoable Licitaciones experience that reuses the approved
browse/detail grammar while preserving the family-specific supported-data
ceiling. Analysts can inspect a licitación without receiving Compra Ágil-only
enrichment or unsupported claims.

**Blocked by:** Compra Ágil: browse y detalle nativos.

- [ ] Licitaciones uses the same six-column browse grammar, supported controls,
  server-owned pagination, activation, and SidePanel context behavior.
- [ ] Detail renders only current common facts, items, adjudications, related-OC
  evidence, lineage, and reconciliation when supported.
- [ ] Null, partial, unavailable, and empty states remain explicit; absent data
  never becomes a placeholder fact, zero, or generalized enrichment.
- [ ] Focused behavior tests prove pointer/keyboard equivalence and preserved
  context for the Licitaciones family.

## Centro de Control factual y contenido

**What to build:** A calm, read-only Centro de Control where operators can
review Diagnóstico, Investigación, and Integridad in one continuous surface,
switch one dense investigation view at a time, and understand returned scope
without dashboard-style invented aggregates.

**Blocked by:** Licitaciones: browse y detalle nativos.

- [ ] Diagnóstico, Investigación, and Integridad render as one continuous
  native composition with no mutation or ingestion control surface.
- [ ] Switching job runs and API calls mounts and queries only the selected
  heavy table while preserving each supported local view state.
- [ ] Partial or paginated responses expose returned scope and `hasMore`
  truthfully, without global totals, success rates, quality, coverage, or
  freshness claims.
- [ ] Remaining quota, when available, is non-negative, transparent, and shows
  both supported inputs; narrow and 200%-zoom tables remain locally contained.

## Paridad, retiro de legado y cierre

**What to build:** A verified native replacement with only behaviorally
redundant bespoke presentation removed. Maintainers receive fresh visual and
accessibility evidence, focused validation, rollback confidence, and an
auditable OpenSpec closeout.

**Blocked by:** Licitaciones: browse y detalle nativos; Centro de Control
factual y contenido.

- [ ] Focused behavioral tests, frontend typecheck, and any necessary shared
  contract validation pass in dependency order.
- [ ] Storybook interaction, visual, and accessibility replay passes at
  desktop/mobile, light/dark, keyboard-only, 200%, and reduced motion.
- [ ] Tables preserve semantics, contrast, visible focus, local containment,
  and unique accessible tooltip anchors across sibling long values.
- [ ] Replaced bespoke filters, overlays, focus traps, and duplicate monitoring
  wrappers are deleted only after parity evidence passes; no required local
  semantic table behavior is removed.
- [ ] User-facing documentation changes only when shipped route behavior needs
  explanation; read-only and CLI-only ingestion boundaries remain explicit.
- [ ] OpenSpec validation, removal criteria, rollback notes, and normal
  verify/sync/archive readiness are recorded.
