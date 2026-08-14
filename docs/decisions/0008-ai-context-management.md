---
type: decision
title: AI Context Management
description: Proposed repository rule for reliable AI-agent context management.
okf_version: "0.1"
---

# ADR 0008: AI Context Management

## Status

Proposed

## Date

2026-08-12

## Purpose

Define a shared rule for keeping AI-agent sessions reliable as context grows.

## Primary Audience

AI agents, engineers, reviewers, and maintainers working on this repository.

## Executive Summary

Long AI-agent sessions can lose reliability before the model reaches its
advertised context-window limit. The repository will use symptom-led context
management: keep sessions focused, load context progressively, and hand off to
a fresh session before degraded context affects correctness.

Token estimates are advisory. They do not enforce a hard limit or replace
reviewer judgment.

## Context

The repository uses root routing files, durable documentation, tools, and
conversation history as working context for AI-assisted delivery. More context
does not always improve results. Relevant instructions can compete with
irrelevant history and tool output, causing forgotten constraints, repeated
questions, and unrelated edits.

The repository needs one concise operational rule in `AGENTS.md` and one durable
document with the full procedure. The rule must remain useful across models and
harnesses without introducing token-count tooling or pretending that one token
threshold fits every task.

## Decision

1. Keep one cohesive task per session.
2. Load only context required for the current task and use progressive
   disclosure for deeper material.
3. Treat forgotten constraints, repeated questions, ignored files, unrelated
   edits, repeated correction, and lost task state as context degradation.
4. When degradation appears, stop expanding scope, write a handoff, start a
   fresh session, reread routing files and the handoff, and verify repository
   state.
5. Handoffs must record objective, completed work, current state, decisions,
   constraints, files, validation, blockers, and next action.
6. Use `~120K` tokens only as conservative planning guidance. Quality signals
   take priority. No automated token counter or forced reset is required.

## Consequences

### Positive

- Reduces errors caused by overloaded session context.
- Makes cross-session work explicit and recoverable.
- Keeps root instructions short and durable detail in `docs/`.
- Works across model providers and agent harnesses.

### Costs

- Handoffs add a small documentation step.
- Fresh sessions lose implicit conversation state unless the handoff records it.
- Agents and reviewers must recognize degradation signals.

### Constraints

- Do not treat maximum context-window size as the usable task budget.
- Do not make a fixed token number a correctness gate.
- Do not use repeated prompt text as the primary recovery method.

## Alternatives Considered

### Fixed Token Limit

- **What**: Force a handoff at one token count, such as `120K`.
- **Why rejected**: Usable capacity changes by model, harness, task shape, and
  tool output. The count may also be unavailable or inaccurate.

### Automatic Compaction Only

- **What**: Let the harness summarize context when the window is nearly full.
- **Why rejected**: Automatic summaries can omit constraints and can occur in
  the middle of a tightly coupled task. Manual phase boundaries are safer.

### No Shared Rule

- **What**: Leave context management to each agent or tool.
- **Why rejected**: The repository already depends on shared agent guidance.
  Unwritten handoff behavior causes avoidable loss of state and inconsistent
  recovery.

## Related Documents

- `AGENTS.md` — Root operational summary.
- `docs/governance/ai-context-management.md` — Detailed procedure and sources.
- `docs/governance/ai-assisted-delivery.md` — General AI delivery guardrails.
- `docs/decisions/README.md` — ADR index and acceptance rules.
