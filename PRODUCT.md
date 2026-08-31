---
type: product-overview
title: "Omnibid — Product Context"
description: "Durable product context for Omnibid."
okf_version: "0.1"
---
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Chilean small and medium-sized suppliers operating with one to
three people. They have limited research time and working capital. Their main
job is to find relevant Mercado Público opportunities quickly and decide what
to investigate next.

## Product Purpose

Omnibid is a customer-facing, AI-assisted procurement intelligence and data
operations product for Mercado Público / ChileCompra. It supports opportunity
detection, process lifecycle tracking, source reconciliation, and
evidence-aware decisions.

Success means that a supplier can identify relevant and urgent processes,
understand available source evidence, and make an explicit next decision
without treating missing data as a positive signal.

## Positioning

Omnibid is supplier-oriented procurement intelligence built around
domain-correct Mercado Público process and source semantics. Its meaningful
distinction is explicit evidence and lineage across operational and historical
source data, rather than generic AI recommendations.

Commercial posture, pricing, and service envelope remain open decisions.

## Operating Context

- The product is Spanish-first and operates in the Chilean public procurement
  context.
- Core workflow: detect, triage, decide, research, draft, review, submit, and
  track.
- Operators search and filter processes, inspect buyer and region, review close
  dates, published amounts, documents, status, and source availability, then
  open process detail in a side panel.
- URL state preserves filters, sorting, and selected process context between
  views.
- API and CSV / Datos Abiertos are complementary sources. API data supports
  recent operational discovery and detail; CSV data supports historical
  completeness, backfill, and offer evidence. Reconciliation must remain
  explicit and auditable.

## Capabilities and Constraints

- Mercado Público process discovery includes search, status, buyer, region,
  closing date, document count, published amount, currency, and sort filters.
- Process detail, buyer views, historical views, and synchronization controls
  are part of the product surface.
- Published amount is source evidence. It is not required capital.
- Financial feasibility is not evaluated unless explicit evidence supports it.
- The product must not invent capital, margin, ROI, probability, scores, or
  recommendations.
- Missing values must retain their source state, including unavailable,
  not-applicable, and not-informed values.
- Omnibid does not submit bids to Mercado Público. PDF/CSV exports are admin
  reference documents for external submission.

## Brand Commitments

- Product name: Omnibid.
- Repository identity: `licitai`; inherited Twenty package names remain in
  internal paths and imports.
- Voice is sober, domain-accurate, and explicit about uncertainty.
- Product UI uses the existing Twenty shell, primitives, Lingui, and Linaria.

## Evidence on Hand

- Mercado Público surface brief: `.impeccable/surfaces/route-mercado-publico.md`.
- Domain context: `docs/business/mercado-publico-ingestion-context.md`,
  `docs/business/mercado-publico-source-contract.md`,
  `docs/business/licitacion-lifecycle.md`, and
  `docs/business/quote-and-bid-workflow.md`.
- Positioning guardrails: `docs/business/marketing-positioning.md`.
- Implemented frontend surface: `packages/twenty-front/src/pages/mercado-publico/`.
- No approved pricing, monetization model, customer claims, testimonials,
  benchmarks, or commercial guarantees are available. Future work must not
  fabricate them.

## Product Principles

1. Prioritize relevance and urgency before volume.
2. Treat source evidence and lineage as product data.
3. Separate known facts from unavailable or unevaluated facts.
4. Reduce operator effort while preserving explicit next decisions.
5. Prefer domain accuracy over generic AI claims.

## Accessibility & Inclusion

Mercado Público workflows must remain keyboard accessible, usable with screen
readers, responsive at narrow widths, and understandable without color alone.
Interactive state must retain visible focus, and motion must respect reduced
motion preferences.
