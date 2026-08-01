---
type: business-contract
title: "Compra Agil V2 AI Contract"
description: "Compact, evidence-labelled contract for agents working with Compra Agil V2."
okf_version: "0.1"
---

# Compra Agil V2: Contract for AI Agents

## Purpose

Use this compact contract before changing Compra Agil V2 ingestion, read
models, or operator guidance. It separates provider facts from repository
behavior so an agent does not turn an implementation detail into a source
guarantee.

## Evidence labels

Every claim in this document uses one of these labels:

- **official** — stated by ChileCompra's primary documentation.
- **repository-implemented** — verified in this repository; it is not thereby
  a provider guarantee.
- **repository-policy** — a repository safety or design rule.
- **unknown** — not established by the official material or by a verified
  implementation path; do not infer it.

Primary sources were checked on 2026-08-01:

- **official** — [Compra Agil API V2 guide (v2.1)](https://www.chilecompra.cl/wp-content/uploads/2026/05/Documentacion_API_Compra_Agil-2-1.pdf).
- **official** — [ChileCompra API terms](https://www.chilecompra.cl/api/).

## Canonical invariants

- **official** — Compra Agil V2 is a beta API with `GET /v2/compra-agil` and
  `GET /v2/compra-agil/{codigo}`; requests authenticate with the `ticket`
  header.
- **repository-policy** — Compra Agil is a separate procurement process family,
  not a licitacion subtype. Never create a licitacion relationship from
  `CodigoLicitacion`.
- **repository-policy** — Persist source evidence raw-first before
  normalization. Do not infer facts from `null`, an empty array (`[]`), or
  `oc_emitida` alone.
- **repository-policy** — Providers returned by the source belong to the
  current Compra Agil call only. Do not carry them into another call or treat
  their absence as a business fact.
- **official** — Reconcile an emitted OC using `id_orden_compra` or `id_oc`.
  `oc_emitida` and a display code are insufficient evidence on their own.
- **repository-policy** — Tickets are deployment secrets. Keep them in
  `packages/twenty-docker/.env`; never commit, log, fixture, or serialize them.

## Parameters, limits, and time

- **official** — The list endpoint documents `tamano_pagina` default `15` and
  maximum `50`, plus `ordenar_por`.
- **repository-implemented** — The current client rejects
  `tamano_pagina < 10` and accepts `orden`. These are repository constraints,
  not official V2 guarantees.
- **repository-policy** — A `10,000`-call daily ceiling is treated as a limit
  per API ticket, following the current API terms; do not describe it as a
  confirmed shared V1/V2 quota.
- **repository-policy** — `America/Santiago` is the repository's scheduling
  configuration/fallback. The V2 guide defines a calendar day and shows UTC
  examples; it does not establish that timezone as a provider fact.

## Verified implementation divergences

These are tracked facts about the current repository, not supported behavior:

- **repository-implemented** — Change-window validation does not completely
  enforce mutually exclusive alternatives.
- **repository-implemented** — Date-range validation is incomplete for some
  list inputs.
- **repository-implemented** — Quota usage is recorded after HTTP `429` and by
  source; it is not a per-ticket preemptive counter.

Treat each divergence as a separate implementation change. Do not paper over
it in API behavior, runbooks, or UI claims.

## Agent decision rule

If a needed claim is **unknown**, preserve raw evidence, state the uncertainty,
and request a source or an implementation change. Do not expand this contract
by copying external research or by treating this document as a replacement for
the official guide.

## Related contracts

- [Mercado Publico source contract](mercado-publico-source-contract.md)
- [Mercado Publico ingestion context](mercado-publico-ingestion-context.md)
- [Operator ingestion runbook](../operations/mercado-publico-ingestion.md)
