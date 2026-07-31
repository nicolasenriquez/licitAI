---
type: governance
title: "AI-Assisted Delivery"
description: "Governance guidance for AI-Assisted Delivery."
okf_version: "0.1"
---
# AI-Assisted Delivery

## Purpose
Define how the Twenty CRM monorepo expects humans and AI agents to collaborate safely during development, code review, and delivery.

## Primary Audience
AI agents (Claude Code, Codex, Cursor), engineers, and reviewers working on the Twenty codebase.

## Executive Summary
AI-assisted delivery is an explicit operating assumption for Twenty. The repository provides enough context — through `CLAUDE.md`, `docs/`, ADRs, and `.cursor/rules/` — that an AI agent can plan, implement, and explain changes without silently inventing domain facts, business rules, or shared defaults. Humans remain accountable for final review and business decisions.

## Core Operating Assumptions

- AI agents will read repository documents before making material changes.
- Humans retain accountability for business decisions and final review.
- Shared context must live in files (docs, ADRs, code comments), not only in chat or memory.
- The repository optimizes for a small engineering team augmented by AI.

## Required Reading Order For AI Agents

Before making any code change, an AI agent must read:

1. `CLAUDE.md` — Fast operational rules. Dev workflow, testing, lint commands.
2. `docs/README.md` — Documentation index and reading paths.
3. `docs/architecture/current-state.md` — What Twenty is today (packages, stack, architecture).
4. `docs/architecture/reference-architecture.md` — System diagram and integration rules.
5. `docs/architecture/ai-and-mcp-layer.md` — Product AI and MCP runtime boundaries when the change touches either surface.
6. `docs/architecture/repository-strategy.md` — Monorepo layout, build order, package rules.
7. **Context-specific docs**: read the architecture doc relevant to the change area:
   - Data model changes → `docs/architecture/data-model.md`
   - Auth/security changes → `docs/architecture/security-and-identity.md`
   - Frontend/UI changes → `docs/design/design-system.md`
   - Operations changes → `docs/operations/command-surface.md`, `docs/operations/local-development.md`, `docs/operations/data-operations.md`
8. **Relevant ADRs**: read any ADR that covers the decision space being modified.
9. **`.cursor/rules/`**: read the technology-specific rule file for the language/framework being changed.

## Agent Guardrails

1. **Do not invent business facts.** If a business rule is not documented, ask — do not assume.
2. **Do not collapse current state and target state.** If a doc describes a target that differs from the code, do not silently align them without review.
3. **Do not change a shared rule in code only.** If you need to change a rule that affects multiple packages or modules, propose an ADR update first.
4. **Do not modify instance command `up`/`down` logic.** Instance commands are immutable once committed. Write a new command for further changes.
5. **Do not change `nx.json` or CI workflows without explicit approval.** These changes affect every developer and every CI run.
6. **Do not commit secrets, `.env` files, or credentials.** Use environment variables and `.env.example` as the template.
7. **Always run `lint:diff-with-main` and `typecheck` after code changes.** These are the minimum quality gates before committing.
8. **Generate instance commands after entity changes.** Any change to entity files requires `database:migrate:generate`.
9. **Run `graphql:generate` after GraphQL schema changes.** Stale frontend types cause type errors across the codebase.
10. **Test single files during development.** `npx jest path/to/test.test.ts --config=...` is the recommended fast path.

## Delivery Workflow

| Step | Expectation |
| --- | --- |
| 1. Understand context | Read relevant docs. Identify current state, target state, and open decisions. |
| 2. Verify baseline | Run `lint:diff-with-main` and `typecheck` on the unchanged code to confirm a clean baseline. |
| 3. Plan the change | Identify what files change, what tests are needed, and whether an instance command or ADR is required. |
| 4. Implement | Write code following code style rules (`CLAUDE.md:119-154`). Preserve existing patterns. |
| 5. Verify | Run `lint:diff-with-main`, `typecheck`, and relevant tests. Generate instance command if entity changed. |
| 6. Review self-check | Verify no secrets committed, no hardcoded assumptions, docs consistent with change. |
| 7. Submit PR | Explain what changed, why, what was tested, and what remains uncertain. |

## Documentation Update Triggers

Update repository docs when:

- A new entity is created (update `docs/architecture/data-model.md` if it changes the core model).
- A new technology is introduced (update `docs/architecture/technology-standards.md` + consider an ADR).
- A shared architectural default changes (update relevant architecture doc + ADR).
- A security rule or auth flow changes (update `docs/architecture/security-and-identity.md`).
- A new operational workflow becomes standard (update `docs/operations/`).
- An ADR is created or superseded (update `docs/decisions/README.md`).

## Review Expectations

AI-generated changes must be reviewed for:

| Concern | What To Check |
| --- | --- |
| **Domain correctness** | Does the change respect Twenty's architecture and product scope? |
| **Code style** | Does it follow naming conventions, file structure, import order? |
| **Documentation consistency** | Are docs updated if the change affects documented behavior? |
| **Test coverage** | Does the change include tests? Do existing tests pass? |
| **Instance command correctness** | If entities changed, was an instance command generated? Are `up`/`down` both implemented? |
| **Security** | Are there any new auth paths, data exposure risks, or secret handling concerns? |
| **GraphQL schema** | If the schema changed, were frontend types regenerated? |

## Prohibited Actions

The following are never permitted for AI agents:

- Committing secrets, `.env` files, or credentials.
- Force-pushing to shared branches.
- Changing CI/CD workflows without explicit approval.
- Modifying committed instance command `up`/`down` logic.
- Squashing or rewriting shared Git history without coordination.
- Bypassing lint, typecheck, or test gates in CI.
- Introducing `any` types in application code.
- Using default exports (except SDK `define*()` functions).

## Agent Tools Inventory

AI agents working in this repo have access to:

| Area | Tools |
| --- | --- |
| Development | `npx nx start`, `npx nx build`, `yarn start` |
| Testing | `npx jest`, `npx nx test`, `npx nx storybook:test` |
| Quality | `npx nx lint:diff-with-main`, `npx nx lint`, `npx nx typecheck`, `npx nx fmt` |
| Database | `npx nx database:reset`, `npx nx run twenty-server:database:migrate:generate` |
| GraphQL | `npx nx run twenty-front:graphql:generate` |
| Docker | `just dev-up`, `just dev-up-build`, `just dev-down`; `packages/twenty-docker/docker-compose.dev.yml` is infrastructure-only for intentional host-source workflows. |
| Git | Full git access. Prefer `lint:diff-with-main` which compares against `main`. |
| MCP | `.mcp.json` configures developer tooling; the product endpoint `/mcp` has its own authentication, workspace authorization, and tool boundaries. |
| Docs | `yarn docs:generate`, `yarn docs:generate-navigation-template` |

## Development AI Versus Product AI

The AI tools used to develop this repository are not the product's AI runtime.
Developer tooling is governed by this document and may use local MCP clients.
Product agents, provider credentials, code interpretation, and the `/mcp`
endpoint are described in `docs/architecture/ai-and-mcp-layer.md` and
`docs/operations/ai-runtime-configuration.md`. Changes to either boundary
require an explicit review of permissions, secrets, and operational impact.

## Current Assumptions

- The repository is optimized for AI-assisted delivery. Documentation is part of the delivery system, not an afterthought.
- Good documentation reduces both human onboarding cost and AI error rate.
- AI agents are collaborators, not replacements. Human review remains mandatory for all changes.
- The reading order and guardrails in this document apply to all AI agents regardless of IDE or platform.

## Open Decisions

- Should certain workflows be mandatory for all AI-assisted work (e.g., always run `lint:diff-with-main` before proposing a change)?
- Should there be an AI-review log or trace artifact for changes proposed by agents?
- Should there be a pre-commit hook that enforces minimum quality gates locally?
