# Validate Licitaciones prototype

Type: prototype
Status: resolved
Blocked by: 04

## Question

Does the shared grammar support Licitaciones clearly without importing the
HTML's unsupported regional, financial, guarantee, or evaluation enrichment?

## Work

- Apply the shared composition to Licitaciones.
- Exercise supported filters, paging, sorting, dates, states, missing values,
  and detail disclosure.
- Preserve explicit distinction from Compra Agil where source semantics differ.
- Test dense rows and long Spanish procurement text at responsive widths.

## Exit evidence

- Reviewed Licitaciones prototype states.
- Accepted field/order/interaction decisions.
- Explicit contract gaps outside the prototype.

## Answer

Licitaciones fits the same browse grammar but not the Compra Agil enriched
detail. The isolated story now exercises the family-specific state options,
exact buyer-code filter, supported sort language, null browse fields, dense
long Spanish labels, and a selected-row variant with missing detail values.

Accepted Licitaciones detail order:

1. Common summary: process code, buyer, and explicit last observation.
2. Items.
3. Adjudications.
4. Related purchase orders as reconciliation evidence (`matchType`), not a
   confirmed legal relationship or normalized confidence score.
5. Source lineage and exact/candidate/unmatched reconciliation counts.

The story uses explicit non-production values only to prove hierarchy and null
rendering. It never calls Mercado Publico and does not import Compra Agil
source fields into Licitaciones.

Excluded contract gaps: region, guarantees, evaluation, document metadata or
download, payment terms, contract dates/milestones, award date/amount, and
free-text or value-based browse filters. `lastSeenAt` remains an observation
timestamp, not a freshness badge.

Validation: `npx nx typecheck twenty-front` passed. Storybook runtime remains
subject to the pre-existing Windows target/CLI gate recorded in ticket 04.
