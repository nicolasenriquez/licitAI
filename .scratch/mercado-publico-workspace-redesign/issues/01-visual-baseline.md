# Reproduce the visual baseline

Type: research
Status: resolved
Blocked by: none

## Question

What does the current Mercado Publico workspace actually look and behave like
with representative authenticated data, and which parts of the external HTML
are worth retaining as visual intent?

## Work

- Establish a runnable Docker/Storybook/browser path without changing product
  code merely to satisfy the harness.
- Capture Compra Agil, Licitaciones, Centro de Control, loading, empty, error,
  and detail-panel states where available.
- Capture desktop/mobile, light/dark, keyboard focus, 200% zoom, and reduced
  motion evidence.
- Compare against the HTML by information hierarchy, not pixel copying.
- Record visual defects and useful ideas with screenshots and source pointers.

## Exit evidence

- Reproducible commands and environment assumptions.
- Screenshot set or an explicit, evidence-backed environment blocker.
- Ranked keep/change/drop list for the HTML ideas.

## Answer

### Outcome

The product runtime is available and healthy enough for review, but the current
Codex browser harness cannot capture it: the integrated browser inventory is
empty. This is a harness blocker, not a product-runtime failure. Source-level
baseline and a ranked HTML disposition are complete; screenshots remain an
explicit prerequisite for ticket 08.

### Reproduction

From the repository root:

```powershell
rtk docker compose --env-file packages/twenty-docker/.env `
  -f packages/twenty-docker/docker-compose.yml ps
rtk curl -I http://localhost:3000/mercado-publico
```

Observed on 2026-07-31:

- PostgreSQL, Redis, server, and worker were running; database and server were
  healthy.
- `GET /mercado-publico` returned `HTTP/1.1 200 OK` from the SPA server.
- Browser plugin bootstrap succeeded, but `agent.browsers.list()` returned
  `[]`; therefore authenticated navigation, screenshots, viewport changes, and
  keyboard inspection were unavailable.
- Compose emitted warnings for optional/unset environment values. They did not
  prevent the healthy runtime and are outside this visual ticket.

### Current product baseline from source

- The route already uses native shell seams: `PageCardLayout`,
  `PageCardHeader`, and `SettingsTabBar` in
  `MercadoPublicoCommandCenterPage.tsx`.
- Three tabs exist and preserve mounted context after first visit: Compra Agil,
  Licitaciones, Centro de Control.
- Browse uses real query state and the six-column contract, plus explicit
  loading/error/empty/pagination states.
- Existing accessibility intent includes table/dialog roles, alert/status live
  regions, focus outlines, background `inert`, responsive rules, and reduced
  motion handling.
- Presentation remains substantially local: bespoke styled inputs/selects,
  grid-table composition, feedback surfaces, native tables in Centro de
  Control, and a custom fixed dialog/backdrop for process detail.
- The source proves structure and semantics, not visual polish. Exact spacing,
  clipping, contrast, density, focus order, zoom, and mobile behavior remain
  unverified until a browser is available.

### External HTML baseline from source

- It is a standalone Twenty replica with its own CSS, routing, state, and
  `localStorage` persistence (`twentyReplicaData`, `twentyReplicaPrefs`).
- It labels its procurement content as demonstration data.
- It hard-codes Licitaciones metadata and calculates Compra Agil aggregates
  from visible demo rows.
- It supplies useful interaction sketches for tabs, browse density, detail
  context, operational grouping, and explicit freshness language.
- It does not establish product data truth, component parity, responsive
  correctness, accessibility, or theme parity.

### Ranked disposition

#### Keep as intent

1. Three-view information architecture.
2. Dense browse-first workflow with row-to-detail continuity.
3. Clear status, time, source, and freshness communication.
4. Progressive disclosure for procurement detail.
5. Centro de Control grouped around diagnosis, investigation, and integrity.

#### Change before use

1. Express all retained ideas through Twenty product shell, tokens, primitives,
   and Spanish Lingui messages.
2. Establish one proven browse/detail grammar for both process families while
   preserving distinct source semantics.
3. Replace dashboard-card theater with a calmer continuous operational surface.
4. Represent null, partial, stale, and unavailable values explicitly.
5. Make responsive, theme, keyboard, zoom, and reduced-motion behavior part of
   the prototype acceptance evidence.

#### Drop

1. Replica application shell, custom routing, localStorage state, and refresh
   simulation.
2. Demonstration datasets and every aggregate derived from them.
3. Hard-coded regional, financial, guarantee, evaluation, supplier, offer, or
   policy enrichment not proven by the internal read contract.
4. Unsupported KPI cards, lenses, coverage percentages, and implied zeros.
5. Pixel fidelity to the HTML or creation of a parallel design system.

### Visual-review gate

Ticket 08 must not resolve until an authenticated browser is available and the
required screenshot/interaction matrix is executed. Tickets 02 and 03 can
continue independently because they are contract and repository-evidence work.
