# Mercado Publico workspace redesign

## Destination

Produce a successor OpenSpec change and a visually validated, non-production
prototype for Compra Agil, Licitaciones, and Centro de Control. The result must
be ready for a later implementation pass inside the Twenty workspace.

## Success conditions

- Twenty product UI, tokens, components, spacing, typography, themes, and
  accessibility are the visual authority.
- The external HTML contributes only useful information hierarchy and
  interaction ideas; none of its demo runtime or invented values are ported.
- Every visible field and metric maps to a current read DTO, or is recorded as
  a future contract gap and omitted from the prototype.
- Compra Agil and Licitaciones share one reusable browse/detail grammar.
- Centro de Control remains read-only and reports only server-backed facts or
  mathematically transparent derivations from complete server-backed counts.
- Prototype is reviewed at desktop/mobile widths, light/dark themes, keyboard
  only, 200% zoom, and reduced motion.
- Successor OpenSpec identifies compatibility, rollout, validation, and removal
  of bespoke presentation seams without reopening ingestion boundaries.

## Fixed decisions

1. Wayfinding ends at a successor OpenSpec plus validated prototype; it does
   not change production behavior.
2. Fidelity is selective: HTML hierarchy may inspire; Twenty remains binding.
3. Current data contracts are the first-version ceiling. Unsupported ideas are
   research gaps, never placeholders or synthetic values.
4. Work order: Compra Agil, Licitaciones, Centro de Control, then cross-surface
   validation.

## Evidence already established

- External HTML is a large standalone demo with custom shell, state, CSS, and
  hard-coded procurement content. Treat as reference, not implementation.
- Current Mercado Publico UI is real-data-backed but concentrates substantial
  custom table, filter, feedback, and side-panel presentation code.
- The repository already has product tokens, Storybook stories, table/input/
  layout primitives, and side-panel infrastructure worth testing for reuse.
- Existing `mercado-publico-command-center` OpenSpec establishes read-only,
  no-fake-number, responsive, accessible, workspace-native behavior.
- Public procurement data belongs to deployment-local `mp`; tenant CRM data
  and ingestion writes remain outside this redesign.
- Integrated browser inventory was empty during charting. Visual validation
  therefore needs an explicit runnable-environment gate.

## Domain vocabulary

- **Process family**: Compra Agil or Licitacion; never silently merged.
- **Browse surface**: server-filtered, paginated discovery of source records.
- **Process detail**: read-only progressive disclosure for one source record.
- **Control center**: operational read model for pipeline, API, jobs, quota,
  integrity, and investigation; not an ingestion console.
- **Supported datum**: value present in an authenticated internal read DTO with
  defined null semantics.
- **Derived metric**: transparent calculation over complete supported inputs.
- **Contract gap**: desired information absent from the current read contract;
  it is not permission to estimate or scrape.

## Ponytail constraints

- Add no dependency or parallel design system.
- Prefer deletion/replacement of bespoke presentation infrastructure over new
  abstraction layers.
- Do not port the external HTML application shell or fake datasets.
- Do not add KPI cards, lenses, filters, or detail fields without proven data.
- Introduce a new token or generic component only after a stable cross-surface
  need is demonstrated.

## Map

| ID | Question / outcome | Type | Blocked by |
| --- | --- | --- | --- |
| 01 | What is the reproducible visual baseline? | research | - |
| 02 | Which proposed values are supported by current read contracts? | research | - |
| 03 | Which native Twenty seams replace bespoke UI safely? | research | - |
| 04 | What shared browse/detail grammar should be prototyped? | prototype | 01, 02, 03 |
| 05 | Does Compra Agil work with that grammar and real data states? | prototype | 04 |
| 06 | Does Licitaciones work without unsupported enrichment? | prototype | 04 |
| 07 | Can Centro de Control become calmer without fake metrics? | prototype | 02, 03 |
| 08 | Does the complete prototype pass visual and accessibility review? | research | 05, 06, 07, 11, 12, 13, 14 |
| 09 | What successor OpenSpec precisely authorizes implementation? | task | 08 |
| 10 | Is the destination met and implementation frontier safe? | grilling | 09 |
| 11 | How does browse detail remain truthful in unavailable list states? | task | - |
| 12 | How does all prototype text meet contrast in both themes? | task | - |
| 13 | How does Control Center stay contained on mobile and at 200% zoom? | task | - |
| 14 | What safely guarantees unique accessible title IDs? | research | - |

## Frontier

Destination met. [Confirm the destination and implementation frontier](issues/10-destination-gate.md)
is resolved. Wayfinding ends here; implementation is a separate, explicit
session against the successor OpenSpec.

## Fog

Wayfinding fog is closed. Deferred risks have owners/triggers:

- A missing primitive or density seam: `twenty-front`/`twenty-ui` owner; trigger
  only if implementation parity tests fail, with cross-surface evidence before
  any shared primitive change.
- A desired field absent from the current DTO: Mercado Público contract owner;
  trigger a separate OpenSpec change, never a UI estimate or fixture value.
- Seeded authenticated real-data states: frontend test owner; trigger when
  implementation contract tests need production-shaped fixtures.
- Exact bespoke-code deletion set: frontend implementation owner; trigger only
  after replacement parity and cross-surface audit pass.

## Out of scope

- Production implementation during wayfinding.
- New ingestion writes, scheduler controls, retry controls, or tenant copies.
- API quota policy changes, reconciliation heuristics, or migration changes.
- Marketing-site styling or a new token family.
- Fabricated demo procurement records presented as product truth.

## Decisions so far

- [Confirm the destination and implementation frontier](issues/10-destination-gate.md)
  — user validated that the destination is met; successor OpenSpec is safe for
  a later implementation session, with deferred risks and triggers recorded.

- [Author the successor OpenSpec change](issues/09-successor-openspec.md) —
  `mercado-publico-workspace-redesign` is a validated proposal-ready successor:
  it supersedes only UI composition while retaining the existing backend,
  GraphQL, route, and CLI-only ingestion authority.

- [Validate the complete prototype](issues/08-cross-surface-validation.md) —
  fresh Playwright replay passes desktop/mobile, light/dark, keyboard, 200%,
  reduced motion, truthfulness, and critical accessibility gates.

- [Eliminate duplicate title IDs](issues/14-unique-title-ids.md) — shared
  `OverflowingTextWithTooltip` now uses normalized React `useId`; a sibling
  Storybook regression test prevents duplicate tooltip anchor IDs.

- [Restore truthful browse state/detail coupling](issues/11-truthful-browse-state-detail.md)
  — hide the selected fixture detail until the browse list is available, while
  preserving selected-process context for source-pending and loaded states.

- Ticket 01: runtime and route are healthy; the integrated browser inventory is
  empty, so source-level baseline is complete but screenshots are deferred to
  the ticket 08 gate. Keep the HTML's three-view hierarchy and browse/detail
  continuity; drop its replica shell, demo state/data, unsupported metrics, and
  pixel-fidelity goal. See [01-visual-baseline](issues/01-visual-baseline.md).
- Ticket 02: current GraphQL contracts support a rich but optional Compra Agil
  detail, conservative six-column browse views, and factual operational reads.
  Detail fields may not be promoted into browse aggregates; Licitaciones
  enrichment, global KPI endpoints, and pipeline/CSV freshness remain contract
  gaps. See [02-data-contract-matrix](issues/02-data-contract-matrix.md).
- Ticket 03: reuse native shell, tabs, controls, status, feedback, progress, and
  the global desktop/mobile side panel. Keep two shallow Mercado Publico table
  compositions because existing visual table primitives do not fully satisfy
  interactive-row/responsive semantics. No dependency or token addition is
  justified. See [03-native-ui-seams](issues/03-native-ui-seams.md).
- Ticket 04: prove one domain-local browse/detail grammar in isolated stories:
  supported six-column browse, explicit row activation, native controls,
  server-owned pagination language, and progressive side-panel disclosure.
  Fixtures are clearly non-production, source-pending does not imply zero
  values, and `lastSeenAt` is not a freshness verdict. Storybook runtime build
  remains an existing Windows/configuration gate for ticket 08. See
  [04-shared-browse-detail-prototype](issues/04-shared-browse-detail-prototype.md).
- Ticket 05: Compra Agil keeps conservative discovery but may progressively
  disclose a hydrated `compraAgilSource`: need/delivery, budget/offers,
  suppliers/documents, then source flags. `compraAgilSource=null` is an
  explicit pending state; neither it nor `lastSeenAt` warrants a zero or
  freshness claim. See [05-compra-agil-prototype](issues/05-compra-agil-prototype.md).
- Ticket 06: Licitaciones shares browse controls and six columns but keeps its
  detail to common fields, items, adjudications, related-OC evidence, lineage,
  and reconciliation counts. The rich Compra Agil source is not portable;
  region, guarantees, evaluation, documents, payments, and milestones remain
  contract gaps. See [06-licitaciones-prototype](issues/06-licitaciones-prototype.md).
- Ticket 07: Centro de Control keeps one continuous Diagnostico, Investigacion,
  Integridad read. Investigation switches one heavy table between jobs and
  server-redacted API calls, preserves `hasMore` scope, and exposes partial or
  unavailable facts without zero substitution. Freshness, global ratios,
  combined quota, and quality scores remain rejected. See
  [07-control-center-prototype](issues/07-control-center-prototype.md).
- [Meet accessible text contrast in both themes](issues/12-accessible-text-contrast.md)
  — scoped prototype text reuses the existing secondary semantic color; all
  current-run light/dark and 200% captures clear the 4.5:1 normal-text gate.
- Ticket 13: Centro de Control reuses the production containment seam: bounded
  flex ancestors and focusable local horizontal scrollers retain 720px factual
  tables without document overflow at 390px or the 200% proxy. See
  [13-control-center-responsive-containment](issues/13-control-center-responsive-containment.md).
