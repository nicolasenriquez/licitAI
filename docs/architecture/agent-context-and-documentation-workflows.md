---
type: architecture
title: Agent Context and Documentation Workflows
description: Evidence-based evaluation of staged documentation audits for this repository.
okf_version: "0.1"
---

# Agent Context and Documentation Workflows

## Purpose

Define a small, repeatable method to audit repository documentation. This
document records the evidence, limits, and pilot result. It does not adopt ICM
as a repository architecture.

## Scope

The method applies to durable documentation and its routing contracts. It does
not change package layout, Nx, runtime workflows, or CI by itself. It does not
require an OpenSpec change. The user selects the governance process for a
documentation decision.

## Repository Baseline

The repository already uses a layered documentation model:

1. `AGENTS.md` is the root operational entrypoint.
2. `index.md` routes work to a mapped surface.
3. The selected surface adds local contracts and context.
4. Durable documents hold the detailed rules.

This model matches Codex guidance discovery. Codex reads project instructions
from the root toward the working directory. A closer `AGENTS.md` can add to or
override an earlier one. See [OpenAI AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Review cutoff: 2026-08-12.

At the review cutoff, `.github/workflows/` contains 22 workflow files.
`ci-docs.yaml` runs `npx nx lint twenty-docs` only when `package.json` or
`packages/twenty-docs/**` changes. It does not validate internal `docs/` links.

## Evidence Model

Classify each material claim before using it in a decision.

| Class | Meaning | Use for repository decisions |
| --- | --- | --- |
| Repository truth | Versioned source, configuration, or test output in this checkout. | Yes, for current repository behavior. |
| Official platform source | Documentation owned by the platform that defines the behavior. | Yes, for platform behavior. |
| Author primary source | Paper or repository written by the method author. | Yes, to describe the method and its stated limits. |
| Community source | Discussion, course, or post not owned by the platform or method author. | Context only. Do not use alone for a repository rule. |
| Inference | A conclusion drawn from the other classes. | Mark it as an inference and state its limit. |

## Evidence Ledger

| Claim | Class | Source | Limit or decision |
| --- | --- | --- |
| Root routing starts with `AGENTS.md`, then `index.md`. | Repository truth | `AGENTS.md`; `index.md` | The closest surface contract adds local rules. |
| Codex applies instructions from root toward the working directory. | Official platform source | [OpenAI AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | This describes Codex, not every agent tool. |
| The repository has 22 workflow files. | Repository truth | `.github/workflows/` inventory | Recheck when this directory changes. |
| Internal docs have no CI check. | Repository truth | `.github/workflows/ci-docs.yaml` | The workflow still lints `twenty-docs`. |
| ICM uses filesystem layers and stage contracts. | Author primary source | [ICM repository](https://github.com/RinDig/Interpretable-Context-Methodology) | This describes the author method. |
| ICM has no controlled comparison with monolithic prompts. | Author primary source | [ICM paper](https://arxiv.org/html/2603.16021v2) | Do not claim a quality improvement. |
| The pilot found five stale workflow-count occurrences in four documents and one stale internal-docs CI claim. | Repository truth | Pre-correction review of `docs/README.md`, `docs/vision-product.md`, `docs/architecture/current-state.md`, and `docs/architecture/repository-strategy.md` | These claims are corrected in this change. |

## ICM Assessment

The Interpretable Context Methodology (ICM) uses filesystem layers and stage
contracts with Inputs, Process, and Outputs. Its author repository describes
that contract model. See the [ICM repository](https://github.com/RinDig/Interpretable-Context-Methodology).

ICM is useful here only as a pattern for a small, sequential, human-reviewed
audit. The paper does not provide a controlled comparison with monolithic
prompts. It also describes limits for concurrent work and dynamic branching.
See the [ICM paper](https://arxiv.org/html/2603.16021v2).

The repository must not claim that ICM improves model quality. The supported
claim is narrower: stage contracts can make audit inputs, decisions, and
outputs easier to inspect.

## Pilot

The pilot reviewed `docs/operations/` with two methods.

| Measure | Existing review | Staged audit pilot |
| --- | --- | --- |
| Scope | Read the selected documents and inspect relevant repository files. | Inventory, verify, decide, and close with explicit evidence. |
| Files reviewed | 6 Markdown files. | The same 6 Markdown files. |
| Relative links | No broken relative links found. | The same result, with the check recorded. |
| Evidence record | No common claim matrix. | Source class and verification are explicit. |
| Repository-wide drift | Not part of the surface-only review. | Confirmed five stale workflow-count occurrences in four documents and one stale internal-docs CI claim. |

The pilot did not prove a quality or speed improvement. It did show that a
small evidence ledger makes drift findings easier to reproduce and review.

## Decision

Keep the repository topology. Enable the staged documentation-audit skill as a
pilot. Do not adopt ICM as a repository-wide framework. The user decides
whether a later result needs an ADR or another governance artifact.

## Adoption Gate

Continue the pilot only if two further audits meet all of these conditions:

- detect a real, independently verified drift finding;
- avoid duplicate canonical sources;
- add no manual step without a clear review benefit;
- work with local tools and existing CI; and
- name an owner, verifier, and retirement condition.

If the gate fails, remove the pilot skill and retain this evaluation as the
record of the decision. If it passes, the user chooses the next governance
step.

## Sources

- [OpenAI: Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [GitHub: About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub: Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [ICM paper](https://arxiv.org/html/2603.16021v2)
- [ICM repository](https://github.com/RinDig/Interpretable-Context-Methodology)
