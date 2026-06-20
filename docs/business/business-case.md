# Business Case

## Purpose
Capture the current business rationale for Omnibid without inventing unsupported business certainty.

## Primary Audience
Founders, product owners, engineering leads, data leads, and AI agents preparing product or delivery changes.

## Executive Summary
The available evidence supports a credible business need around Mercado Publico opportunity detection, lifecycle tracking, and historical reconciliation. What is missing is not the domain problem but the formal business posture: customer segment, commercial model, go-to-market motion, and release economics are still open.

## Why This Opportunity Matters

| Business Need | Evidence From Available Inputs | Implication |
| --- | --- | --- |
| Procurement opportunities are time-sensitive. | The supplied materials emphasize operational API monitoring and daily change capture. | Product value depends on timely ingestion and change visibility. |
| Historical truth is fragmented across sources. | The supplied materials distinguish API behavior from CSV/ZIP historical evidence. | Product trust depends on lineage and reconciliation. |
| Domain complexity creates implementation risk. | The reference docs repeatedly warn against incorrect joins, counts, and amount aggregation. | Business value depends on accurate domain modeling, not only ingestion volume. |

## Current State

| Topic | Current State |
| --- | --- |
| Problem framing | Strong. |
| Customer definition | Partial. |
| Revenue model | Unknown, and not assumed through Stripe in phase 1. |
| Pricing model | Unknown. |
| Delivery model | Customer-facing software product for phase 1. |
| Deployment model | One isolated app stack per customer environment in phase 1. |
| Distribution model | Unknown. |

## Target State

| Topic | Target State |
| --- | --- |
| Customer definition | Named primary and secondary customer profiles. |
| Buyer definition | Named economic buyer and operator persona. |
| Commercial model | Explicitly chosen and documented. |
| Value metrics | Tied to product workflows and release priorities. |
| Business risks | Managed through explicit decision logs and product constraints. |

## Beneficiaries

| Beneficiary | Likely Benefit | Confidence |
| --- | --- | --- |
| Supplier sales or bid teams | Earlier opportunity awareness and prioritization. | Medium |
| Procurement analysts | Lower manual reconciliation effort. | Medium |
| Internal product and delivery teams | Fewer domain mistakes during implementation. | High |

## Value Hypotheses

- Accurate reconciliation between API and historical data can create defensible trust in procurement intelligence outputs.
- A structured repository baseline can reduce delivery friction and rework for a small AI-assisted team.
- Domain-aware product workflows can differentiate Omnibid from generic opportunity trackers.
- A focused discovery-plus-reconciliation MVP can deliver usable customer value without the cost of a full workflow platform in phase 1.

## Risks

| Risk | Why It Matters | Initial Mitigation |
| --- | --- | --- |
| Business posture remains implicit. | Architecture and release decisions may drift in contradictory directions. | Make posture an explicit stakeholder input before MVP scope is locked. |
| Data latency and publication lag are misunderstood. | Product promises may exceed source reality. | Document source lag and reconcile with operational claims. |
| AI agents infer business rules from code shortcuts. | Incorrect behavior can harden into defaults. | Keep business rules in docs and ADRs, not only in implementation. |

## Current Assumptions

- The product is intended to generate value from public procurement intelligence rather than raw data resale alone.
- Historical CSV/ZIP ingestion is core to trust, not a secondary reporting add-on.
- The target team is small and benefits from documentation that doubles as AI context.
- Phase 1 should be documented as customer-facing without assuming payment infrastructure or token billing.
- Phase 1 business value comes from discovery plus reconciliation rather than full workflow automation.
- Omnibid should be positioned as a combined product, with phase-1 value led primarily by procurement intelligence and supported by narrow reconciliation workflows.
- The primary phase-1 market segment should be SME suppliers rather than large-enterprise workflow teams or public-sector buyers.
- Phase 1 customer value can include saved filters and watchlists without requiring workflow mutation features.
- Phase 1 should avoid notification-system scope; manual refresh over saved scopes is enough for the initial customer value loop.
- Phase 1 customer onboarding should be controlled through admin-provisioned accounts rather than open self-signup.
- Phase 1 customer isolation should be implemented through one isolated app stack per customer environment rather than a shared control plane.

## Required Inputs

- Who pays for the product.
- Which workflows become monetized after the initial non-Stripe phase.
- Acceptance criteria for an MVP business outcome.

## Open Decisions

- Does Omnibid monetize access to insights, workflow automation, managed services, or a combination?
- Is the first monetizable workflow centered on `licitaciones`, `Compra Agil`, `ordenes de compra`, or full lifecycle intelligence?
- When should phase 1 isolated customer stacks evolve into a more centralized deployment model, if ever?
- Which workflow features should remain explicitly deferred until after the reconciliation-centric MVP proves value?

## Candidate Success Metrics

- Number of monitored procurement opportunities per target user.
- Percentage of opportunities with reconciled downstream outcome evidence.
- Median time from source change to reflected product state.
- Reduction in manual analysis steps per procurement review cycle.
