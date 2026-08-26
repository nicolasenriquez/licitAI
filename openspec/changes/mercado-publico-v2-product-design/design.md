## Context

Procesos already has stable read APIs, URL state, semantic result rendering,
and a side-panel route. Product corrections belong at these existing seams.
CRM conversion is new behavior and needs a deep Mercado Publico service that
owns source-to-CRM policy while using existing CRM creation infrastructure.

## Goals / Non-Goals

**Goals**
- Make search, evidence review, recovery, and CRM marking one coherent flow.
- Preserve URL, selection, list scroll, focus, and factual source semantics.
- Guarantee workspace-scoped idempotency under retries and concurrency.

**Non-Goals**
- Change source ingestion, read projections, buyers, or sync operations.
- Infer commercial judgments or create Company records.
- Replace Twenty UI primitives or add a parallel page.

## Boundary and Ownership

### Process workspace

Module: Mercado Publico frontend. Interface: existing Procesos route, URL keys,
and side panel. Seam: user-visible route behavior. Adapter: Apollo queries and
URL-state hook. This highest seam gives strong leverage because Playwright can
observe state continuity without coupling to component internals.

### CRM investigation

Module: Mercado Publico server module. Interface: authenticated mutation and
four-field result. Seam: resolver delegates to one investigation service.
Adapter: Common API record creation plus core mapping persistence. Locality
keeps source mapping policy out of generic Opportunity CRUD.

### Opportunity source metadata

Module: standard Opportunity metadata. Interface: optional process-code and
source-URL fields. Seam: normal Opportunity record APIs and generated metadata.
Adapter: generated fast instance command for required schema changes.

## Decisions

1. Preserve existing read contracts and reorganize only presentation.

   Rationale: URL and GraphQL contracts are already correct and tested.

2. Reset panel-local state on every `codigo` change before new process content
   becomes interactive.

   Rationale: relation cursors, payload state, selected tab, and errors belong
   to one process identity and must not leak to another.

3. Use three primary tabs and a secondary technical disclosure.

   Rationale: Summary, Items and offers, and Documents support business review;
   sanitized payload is diagnostic and remains lazy.

4. Render History as a side-panel subview.

   Rationale: panel navigation can preserve title, code, URL, selected process,
   prior tab, panel scroll, and list scroll without a parallel full-page flow.

5. Use a core mapping as idempotency authority.

   Rationale: standard Opportunity has no unique workspace-plus-source-code
   identity. Mapping columns are workspace ID, code, CRM record ID, and first
   marked time, with a unique constraint on workspace ID plus code.

6. Create Opportunity through existing CRM/Common API behavior.

   Rationale: metadata validation, permissions, hooks, events, and workspace
   schema behavior must not be bypassed by direct workspace SQL.

7. Handle concurrent marking and deleted targets transactionally.

   Rationale: same-workspace callers must converge on one live Opportunity.
   Lock or conflict handling reads the winning mapping. If target no longer
   exists, one caller creates a replacement and updates CRM ID while preserving
   first `markedAt`.

8. Store only factual source values.

   Rationale: Opportunity receives process title/code as name, published amount,
   closing date, process code, and canonical source URL. Unknown values remain
   unset. No buyer or commercial inference is created.

## Mutation Contract

```graphql
markMercadoPublicoV2ForInvestigation(
  codigo: String!
): MercadoPublicoV2InvestigationResult!
```

The resolver requires workspace authentication and Opportunity create access.
It validates a non-empty code and requires a current source process. Success
returns canonical code, live CRM record ID, whether this call created that CRM
record, and immutable first `markedAt`. Repeats return the live mapped record.

## UI State Contract

- Pending disables repeated submission and announces status.
- Created or existing success shows `En investigación` and `Abrir en CRM`.
- Error leaves panel context intact and offers retry.
- CRM navigation uses returned record ID and existing record-page routing.
- Applying or clearing filters resets `after` but keeps sort and process.
- Closing panel returns focus to origin row; changing process does not move list
  scroll.

## Blast Radius

### Touched runtime areas
- Frontend filters, active list, detail panel, history panel subview, Apollo
  mutation, translations, and E2E contracts.
- Server Mercado Publico resolver/module, investigation service and mapping.
- Opportunity metadata, GraphQL schema, generated types, and instance command.

### Untouched runtime areas
- Mercado Publico ingestion, sync, read SQL, buyers, list cursor format,
  relation cursor format, and raw history/payload persistence.

## Verification Strategy

- Fail first at route/panel Playwright seam for reset, retry, focus, history,
  responsive layout, and mutation state.
- Fail first at server service seam for same-workspace concurrency,
  cross-workspace isolation, repeat, missing source, permission, and deleted
  target replacement.
- Keep component tests for filter grouping and URL serialization details.
- Verify generated migration up/down and GraphQL type compatibility.

## Slice Dependencies

Panel resilience, filters, and detail hierarchy are independent after shared
Phase 1 proofs. CRM persistence/API precedes CRM UI. Responsive closure follows
all visible UI slices. Final closeout follows all implementation verification.
