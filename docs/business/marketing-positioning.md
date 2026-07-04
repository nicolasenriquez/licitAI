---
type: business-context
title: "Marketing And Positioning"
description: "Business context for Marketing And Positioning."
okf_version: "0.1"
---
# Marketing And Positioning

## Purpose
Define the current positioning posture for Omnibid while making unknown business inputs explicit.

## Primary Audience
Founders, product owners, GTM stakeholders, engineers, and AI agents generating outward-facing language.

## Executive Summary
Omnibid should not yet be described with finalized market language because the repository does not contain approved business posture or commercial decisions. This document provides a safe current-state positioning frame, a target-state decision structure, and language guardrails so documentation and future product copy do not overclaim.

## Positioning Guardrail

The repository must not silently imply whether Omnibid is a public SaaS, internal platform, consulting-enabled product, enterprise product, marketplace tool, data platform, or another model. Until stakeholders ratify that posture, repository language must mark it as undecided.

## Safe Current Positioning

| Item | Current Safe Statement |
| --- | --- |
| What Omnibid is | A customer-facing AI-assisted procurement intelligence and data operations product focused on Mercado Publico / ChileCompra. |
| What Omnibid helps with | Opportunity detection, lifecycle tracking, reconciliation, and domain-aware data handling. |
| What Omnibid is not yet documented as | A Stripe-led billing product, managed service, internal-only platform, or marketplace. |

## Target Positioning Decisions

| Decision | Why It Matters |
| --- | --- |
| Product category | Affects architecture, identity, release, and support expectations. |
| Target buyer | Affects pricing, workflow priorities, and onboarding. |
| Differentiation | Affects roadmap and marketing claims. |
| Service envelope | Affects staffing and operations. |

## Candidate Differentiators

- Domain-correct handling of Mercado Publico source behavior and lifecycle semantics.
- Explicit lineage between API, historical CSV/ZIP data, and product outputs.
- Documentation and governance designed for AI-assisted engineering rather than ad hoc implementation.

## Language To Avoid Until Ratified

- "Omnibid includes self-serve billing or Stripe payments" unless approved.
- "Omnibid is an enterprise product" unless approved.
- "Omnibid replaces procurement systems" unless evidence supports that claim.
- "Omnibid provides complete historical truth in real time" because source lag and reconciliation windows exist.

## Current Assumptions

- Supplier-oriented use cases are the clearest current framing.
- The primary phase-1 ICP should be SME suppliers that need opportunity detection and simple reconciliation rather than full procurement-workflow replacement.
- The primary phase-1 wedge should be opportunity detection, with reconciliation and data trust acting as supporting proof rather than the initial entry message.
- The product will need sober, domain-accurate positioning rather than generic AI-product messaging.
- Customer-facing product posture is now accepted for phase 1, but monetization language remains out of scope.

## Required Inputs

- Approved product category.
- Named buyer.
- Approved public-facing one-sentence description.
- Whether managed analysis or implementation services are part of the offer.

## Open Decisions

- Will Omnibid be sold directly, delivered through partners, or used internally first?
- Which claims are acceptable before the first production release?

## Candidate Success Metrics

- Stakeholder approval of a single positioning statement without contradictory edits.
- Consistency between product docs, architecture docs, and outward-facing language.
- Reduction in rework caused by ambiguous product framing.
