# Validate Compra Agil prototype

Type: prototype
Status: resolved
Blocked by: 04

## Question

Does the shared grammar support Compra Agil discovery and hydrated detail using
only current DTO-backed information?

## Work

- Apply the shared composition to Compra Agil.
- Exercise supported filters, paging, sorting, missing values, source freshness,
  and hydrated/not-yet-hydrated detail states.
- Validate information priority against real user tasks and the external HTML's
  useful hierarchy.
- Exclude offers, suppliers, social/environmental flags, budgets, or other
  enrichment unless ticket 02 proves current support.

## Exit evidence

- Reviewed Compra Agil prototype states.
- Accepted field/order/interaction decisions.
- Explicit contract gaps, if any, outside the prototype.

## Answer

Compra Agil fits the shared grammar without a new backend contract. The
isolated `MercadoPublicoBrowseDetailPrototype` story now exercises:

- The conservative browse contract: Objeto, Organismo, Estado, Cierre,
  Publicada, and Codigo; exact buyer-code filtering; Compra Agil-only states;
  and supported sort language (latest observation or code). Its fixture count
  is only harness feedback; production must use the server's `total`, `page`,
  and `limit`.
- Missing browse values as `No informado`, never zero or an inferred value.
- A distinct source-pending detail state. `compraAgilSource=null` states that
  retained `detail-by-codigo` content is unavailable; it does not render zero
  offers, budget, suppliers, or documents.
- Hydrated progressive detail in task order: summary, need/delivery,
  budget/offers, suppliers/documents, then source flags. These sections are
  source-labelled and use `No informado por fuente` for nullable members.

The fixture is explicitly non-production and never reaches the route or a
Mercado Publico query. It demonstrates DTO shape and information hierarchy,
not public procurement facts. No source freshness badge is accepted: `lastSeenAt`
remains an observation timestamp, not a freshness policy.

Contract gaps kept outside the prototype:

- Rich detail values do not become browse columns, filters, sorts, or KPIs.
- Document entries expose id/name only; there is no downloadable URL/action.
- No backend-supported free-text, buyer-name, region, amount, offer, or
  closing-window browse filter exists.

Validation: `npx nx typecheck twenty-front` passed. Storybook runtime remains
subject to the pre-existing Windows target/CLI gate recorded in ticket 04.
