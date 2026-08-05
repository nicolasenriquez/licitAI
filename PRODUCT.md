---
type: product-overview
title: "Twenty Website - Product Context"
description: "Durable product context for the Twenty marketing website."
okf_version: "0.1"
---
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The marketing site serves route-specific audiences. Current scope centers on
partner-related pages.

The primary audience is a budget-holding decision maker, such as a founder,
RevOps lead, or COO, shopping for a CRM implementation partner. They compare
two to five candidates during one browsing session and typically spend 30 to 90
seconds on each profile.

## Product Purpose

The website explains and presents Twenty, helps prospective customers evaluate
an open-source CRM, and helps buyers find and assess implementation partners.

For partner pages, success means communicating credibility, surfacing fit
signals quickly, and giving visitors a confident next step such as booking a
call or checking LinkedIn without pressure.

## Positioning

Twenty is an open-source CRM with a customizable, design-led product
experience. The website makes that position and its implementation-partner
ecosystem legible to prospective customers.

## Operating Context

- Public-facing website evaluated during short research and comparison sessions.
- Partner visitors assess firm credibility, size, specialty, region, languages,
  deployment expertise, and budget range.
- Partner profile routes use `/partners/profile/[slug]`; related discovery and
  application routes live under `/partners`.
- Website routes are localized. The CRM application in `packages/twenty-front`
  is a separate product surface.

## Capabilities and Constraints

- Current website includes product, pricing, customer, article, release,
  partner, legal, and localized route families.
- Implementation uses Next.js 16 App Router, Linaria, Lingui, and theme tokens
  under `packages/twenty-website/src/theme/`.
- User-facing copy uses Lingui. Website claims, customer proof, partner data,
  pricing, and outcomes must come from repository-backed or user-provided
  evidence.
- Detailed visual tokens, component guidance, and motion rules remain in
  `DESIGN.md`.

## Brand Commitments

- Product name: Twenty.
- Brand personality: editorial, founder-led, and considered.
- Voice is quietly opinionated about open-source, customizable, well-designed
  CRM software; it avoids hype and pressure.
- Partner profiles should feel credible and curated rather than generic or
  template-driven.

## Evidence on Hand

- Existing route implementations and localized website copy in
  `packages/twenty-website`.
- Repository-backed customer, partner, release, and public image assets in the
  website package.
- No additional evidence or external assets were supplied during this init.
  Future work must not fabricate testimonials, customers, benchmarks, pricing,
  partner outcomes, or other proof.

## Product Principles

1. Make credibility legible through real firms, people, and work.
2. Surface fit signals before asking visitors to act.
3. Offer clear next steps without coercion.
4. Prefer confidence and comprehension over information density.
5. Keep Twenty's open-source CRM position explicit and truthful.

## Accessibility & Inclusion

Baseline requirement is WCAG AA with keyboard and screen-reader support.
Interactive elements need visible focus, semantic landmarks and heading order,
informational images need useful alt text, decorative icons need
`aria-hidden="true"`, text needs sufficient contrast, motion must respect
`prefers-reduced-motion`, and forms need explicit labels with announced errors.
