---
type: governance
title: AI Context Management
description: Rules for maintaining reliable AI-agent context during repository work.
okf_version: "0.1"
---

# AI Context Management

## Purpose

Keep AI-agent work reliable as session context grows.

## Primary Audience

AI agents, engineers, and reviewers working on this repository.

## Core Rules

- Keep one cohesive task per session.
- Load only files and tool output required for the current task.
- Use repository paths with an instruction that explains when to read them.
- Prefer progressive disclosure over loading all available documentation.
- Do not re-paste large context as a recovery method.
- Start a fresh session at task or phase boundaries when context quality declines.

## Degradation Signals

Start a handoff when the agent:

- forgets documented constraints;
- repeats questions already answered;
- ignores relevant files or instructions;
- makes unrelated edits;
- needs repeated correction for the same issue; or
- loses track of completed work or next steps.

Quality signals take priority over token estimates.

## Required Response

When degradation appears:

1. Stop expanding scope.
2. Record a handoff artifact.
3. Start a fresh session.
4. Read root routing files and the handoff.
5. Verify repository state before continuing.

Do not continue a degraded session only because the model reports available
context space.

## Handoff Format

Every handoff should state:

- objective;
- completed work;
- current state;
- decisions and constraints;
- files changed or inspected;
- validation run and results;
- blockers; and
- next action.

Use the handoff mechanism provided by the active workflow. Store durable facts
in repository files, not only in chat history.

## Token Guidance

Matt Pocock's AI coding dictionary describes a practical smart zone and dumb
zone. It reports that quality decline often begins before a model reaches its
maximum context window and gives an approximate `125K-150K` token range for
some frontier models. This repository uses `~120K` only as a conservative,
advisory planning signal.

The range is not a limit or a performance guarantee. Model, harness, task
shape, tool output, and context structure change usable capacity. A session
with fewer tokens can still degrade when relevant instructions compete with
noise.

## Clearing And Compaction

- **Clearing** starts a new session with no active conversation context. Write
  a handoff first when decisions or state must survive.
- **Compaction** summarizes the current conversation in place. Use it at a
  deliberate phase boundary, not while solving a tightly coupled task.
- **Handoff** transfers explicit state to a fresh session. Prefer it when the
  next session needs decisions, evidence, blockers, or file-level continuity.

## Related Documents

- `AGENTS.md` — Short operational rules for every agent session.
- `docs/governance/ai-assisted-delivery.md` — General AI delivery guardrails.
- `docs/operations/okf-authoring-guide.md` — Documentation authoring rules.

## Sources

- [Smart zone / Dumb zone](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Smart%20zone.md)
- [Attention degradation](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Attention%20degradation.md)
- [Attention budget](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Attention%20budget.md)
- [Context window](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Context%20window.md)
- [Clearing](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Clearing.md)
- [Compaction](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Compaction.md)
- [Handoff](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Handoff.md)
- [Progressive disclosure](https://github.com/mattpocock/dictionary-of-ai-coding/blob/main/dictionary/Progressive%20disclosure.md)
- [LLM Fundamentals](https://www.aihero.dev/llm-fundamentals)
- [What Is the Context Window?](https://www.aihero.dev/what-is-the-context-window)
- [How to Make Codebases AI Agents Love](https://www.aihero.dev/how-to-make-codebases-ai-agents-love)
