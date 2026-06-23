# Manual Acceptance: repo-workspace-routing-pilot

## Purpose

Provide the manual acceptance suite and result log for the workspace routing pilot.

Pilot execution status in this document is user-reported completion. The pilot was not rerun automatically in this editing session.

## Execution Rules

- Run each case from the stated starting surface.
- Record the routing/context files actually consulted before the agent responds or acts.
- Record the final folder chosen by the agent.
- Record the expected and actual behavior.
- Mark pass/fail per tool.
- Do not expand the pilot to another folder until every case passes in both Codex and Claude Code.

## Gate Checklist

- [x] Codex passes all pilot cases
- [x] Claude Code passes all pilot cases
- [x] No case wanders into an unmapped surface
- [x] Every passing case declares consulted files before substantive action

## Cases

| Case | Tool | Starting surface | Prompt | Expected consulted files | Expected final folder | Expected behavior | Actual result | Pass/Fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Codex | root | I want to review an active OpenSpec change. | `AGENTS.md`, `CONTEXT-MAP.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Routes to `openspec/`, declares consulted files, and does not stay at root only. | User-reported pass; routing matched expected behavior. | Pass |
| 1 | Claude Code | root | I want to review an active OpenSpec change. | `AGENTS.md`, `CONTEXT-MAP.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Routes to `openspec/`, declares consulted files, and does not stay at root only. | User-reported pass; routing matched expected behavior. | Pass |
| 2 | Codex | root | I want to understand the repo architecture. | `AGENTS.md`, `CONTEXT-MAP.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Routes to `docs/`, declares consulted files, and uses durable docs context. | User-reported pass; routing matched expected behavior. | Pass |
| 2 | Claude Code | root | I want to understand the repo architecture. | `AGENTS.md`, `CONTEXT-MAP.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Routes to `docs/`, declares consulted files, and uses durable docs context. | User-reported pass; routing matched expected behavior. | Pass |
| 3 | Codex | `docs/` | Please update the tasks for the active OpenSpec change. | `AGENTS.md`, `CONTEXT-MAP.md`, `docs/AGENTS.md`, `docs/CONTEXT.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Bounces out of `docs/`, returns through the root map, and reroutes into `openspec/`. | User-reported pass; routing matched expected behavior. | Pass |
| 3 | Claude Code | `docs/` | Please update the tasks for the active OpenSpec change. | `AGENTS.md`, `CONTEXT-MAP.md`, `docs/AGENTS.md`, `docs/CONTEXT.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Bounces out of `docs/`, returns through the root map, and reroutes into `openspec/`. | User-reported pass; routing matched expected behavior. | Pass |
| 4 | Codex | `openspec/` | Explain the repository governance model. | `AGENTS.md`, `CONTEXT-MAP.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Bounces out of `openspec/`, returns through the root map, and reroutes into `docs/`. | User-reported pass; routing matched expected behavior. | Pass |
| 4 | Claude Code | `openspec/` | Explain the repository governance model. | `AGENTS.md`, `CONTEXT-MAP.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Bounces out of `openspec/`, returns through the root map, and reroutes into `docs/`. | User-reported pass; routing matched expected behavior. | Pass |
| 5 | Codex | root | Work inside a folder-local contract for `packages/twenty-front`. | `AGENTS.md`, `CONTEXT-MAP.md` | root | States that `packages/twenty-front` is unmapped in this pilot and does not wander into another surface. | User-reported pass; routing matched expected behavior. | Pass |
| 5 | Claude Code | root | Work inside a folder-local contract for `packages/twenty-front`. | `AGENTS.md`, `CONTEXT-MAP.md` | root | States that `packages/twenty-front` is unmapped in this pilot and does not wander into another surface. | User-reported pass; routing matched expected behavior. | Pass |

## Post-Pilot Wave Template

Before each new wave is marked complete, append cases that cover at minimum:

- root -> new surface
- wrong-folder bounce -> root -> new surface
- new surface -> root -> correct alternative surface
- unmapped refusal still works
- consulted-file declaration still happens

## Reusable Wave Case Table

Copy this table for each new wave and replace `<wave>` and `<surface>`:

| Case | Tool | Starting surface | Prompt | Expected consulted files | Expected final folder | Expected behavior | Actual result | Pass/Fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Codex | root | Route me to `<surface>` work. | `AGENTS.md`, `CONTEXT-MAP.md`, `<surface>/AGENTS.md`, `<surface>/CONTEXT.md` | `<surface>` | Routes from root into the new surface and declares consulted files. | Pending | Pending |
| 1 | Claude Code | root | Route me to `<surface>` work. | `AGENTS.md`, `CONTEXT-MAP.md`, `<surface>/AGENTS.md`, `<surface>/CONTEXT.md` | `<surface>` | Routes from root into the new surface and declares consulted files. | Pending | Pending |
| 2 | Codex | wrong folder | Perform `<surface>` work from the wrong folder. | root files plus wrong-folder files plus `<surface>` files | `<surface>` | Bounces through root and reroutes correctly. | Pending | Pending |
| 2 | Claude Code | wrong folder | Perform `<surface>` work from the wrong folder. | root files plus wrong-folder files plus `<surface>` files | `<surface>` | Bounces through root and reroutes correctly. | Pending | Pending |
| 3 | Codex | `<surface>` | Do unrelated docs or OpenSpec work from `<surface>`. | root files plus `<surface>` files plus target-surface files | target surface | Leaves the new surface and reroutes correctly. | Pending | Pending |
| 3 | Claude Code | `<surface>` | Do unrelated docs or OpenSpec work from `<surface>`. | root files plus `<surface>` files plus target-surface files | target surface | Leaves the new surface and reroutes correctly. | Pending | Pending |
| 4 | Codex | root | Work in an unmapped sibling surface instead. | `AGENTS.md`, `CONTEXT-MAP.md` | root | Refuses to invent a sibling routing contract. | Pending | Pending |
| 4 | Claude Code | root | Work in an unmapped sibling surface instead. | `AGENTS.md`, `CONTEXT-MAP.md` | root | Refuses to invent a sibling routing contract. | Pending | Pending |

## Wave 2: Docs-Heavy Cases

| Case | Tool | Starting surface | Prompt | Expected consulted files | Expected final folder | Expected behavior | Actual result | Pass/Fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Codex | root | Update the public documentation site navigation. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-docs/AGENTS.md`, `packages/twenty-docs/CONTEXT.md` | `packages/twenty-docs` | Routes from root through `packages/` into `packages/twenty-docs` and declares consulted files. | Not run | Pending |
| 1 | Claude Code | root | Update the public documentation site navigation. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-docs/AGENTS.md`, `packages/twenty-docs/CONTEXT.md` | `packages/twenty-docs` | Routes from root through `packages/` into `packages/twenty-docs` and declares consulted files. | Not run | Pending |
| 2 | Codex | root | Update the Claude skills package documentation. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-claude-skills/AGENTS.md`, `packages/twenty-claude-skills/CONTEXT.md` | `packages/twenty-claude-skills` | Routes from root through `packages/` into `packages/twenty-claude-skills` and declares consulted files. | Not run | Pending |
| 2 | Claude Code | root | Update the Claude skills package documentation. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-claude-skills/AGENTS.md`, `packages/twenty-claude-skills/CONTEXT.md` | `packages/twenty-claude-skills` | Routes from root through `packages/` into `packages/twenty-claude-skills` and declares consulted files. | Not run | Pending |
| 3 | Codex | `packages/twenty-docs` | Update the repository ADR baseline. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-docs/AGENTS.md`, `packages/twenty-docs/CONTEXT.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Leaves `packages/twenty-docs`, returns through root, and reroutes into root `docs/`. | Not run | Pending |
| 3 | Claude Code | `packages/twenty-docs` | Update the repository ADR baseline. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-docs/AGENTS.md`, `packages/twenty-docs/CONTEXT.md`, `docs/AGENTS.md`, `docs/CONTEXT.md` | `docs/` | Leaves `packages/twenty-docs`, returns through root, and reroutes into root `docs/`. | Not run | Pending |
| 4 | Codex | `packages/twenty-claude-skills` | Review the active OpenSpec change tasks. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-claude-skills/AGENTS.md`, `packages/twenty-claude-skills/CONTEXT.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Leaves `packages/twenty-claude-skills`, returns through root, and reroutes into `openspec/`. | Not run | Pending |
| 4 | Claude Code | `packages/twenty-claude-skills` | Review the active OpenSpec change tasks. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-claude-skills/AGENTS.md`, `packages/twenty-claude-skills/CONTEXT.md`, `openspec/AGENTS.md`, `openspec/CONTEXT.md` | `openspec/` | Leaves `packages/twenty-claude-skills`, returns through root, and reroutes into `openspec/`. | Not run | Pending |
| 5 | Codex | root | Work inside a folder-local contract for `packages/twenty-server`. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md` | `packages/` | Uses the package-index surface only and does not invent an unmapped core-package leaf contract. | Not run | Pending |
| 5 | Claude Code | root | Work inside a folder-local contract for `packages/twenty-server`. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md` | `packages/` | Uses the package-index surface only and does not invent an unmapped core-package leaf contract. | Not run | Pending |

## Wave 3: AI-Tooling Cases

| Case | Tool | Starting surface | Prompt | Expected consulted files | Expected final folder | Expected behavior | Actual result | Pass/Fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Codex | root | Update the repo-local Codex commands. | `AGENTS.md`, `CONTEXT-MAP.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md` | `.codex` | Routes from root into `.codex` and declares consulted files. | Not run | Pending |
| 1 | Claude Code | root | Update the repo-local Codex commands. | `AGENTS.md`, `CONTEXT-MAP.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md` | `.codex` | Routes from root into `.codex` and declares consulted files. | Not run | Pending |
| 2 | Codex | root | Update the published Twenty Codex plugin package. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md` | `packages/twenty-codex-plugin` | Routes from root through `packages/` into `packages/twenty-codex-plugin` and declares consulted files. | Not run | Pending |
| 2 | Claude Code | root | Update the published Twenty Codex plugin package. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md` | `packages/twenty-codex-plugin` | Routes from root through `packages/` into `packages/twenty-codex-plugin` and declares consulted files. | Not run | Pending |
| 3 | Codex | `.codex` | Change the published plugin package manifest. | `AGENTS.md`, `CONTEXT-MAP.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md` | `packages/twenty-codex-plugin` | Leaves `.codex`, returns through root, and reroutes into the plugin package. | Not run | Pending |
| 3 | Claude Code | `.codex` | Change the published plugin package manifest. | `AGENTS.md`, `CONTEXT-MAP.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md` | `packages/twenty-codex-plugin` | Leaves `.codex`, returns through root, and reroutes into the plugin package. | Not run | Pending |
| 4 | Codex | `packages/twenty-codex-plugin` | Adjust the repo-local Codex command set. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md` | `.codex` | Leaves the plugin package, returns through root, and reroutes into `.codex`. | Not run | Pending |
| 4 | Claude Code | `packages/twenty-codex-plugin` | Adjust the repo-local Codex command set. | `AGENTS.md`, `CONTEXT-MAP.md`, `packages/AGENTS.md`, `packages/CONTEXT.md`, `packages/twenty-codex-plugin/AGENTS.md`, `packages/twenty-codex-plugin/CONTEXT.md`, `.codex/AGENTS.md`, `.codex/CONTEXT.md` | `.codex` | Leaves the plugin package, returns through root, and reroutes into `.codex`. | Not run | Pending |
| 5 | Codex | root | Work inside a folder-local contract for `.github`. | `AGENTS.md`, `CONTEXT-MAP.md` | root | Refuses to invent an unmapped top-level operational routing contract. | Not run | Pending |
| 5 | Claude Code | root | Work inside a folder-local contract for `.github`. | `AGENTS.md`, `CONTEXT-MAP.md` | root | Refuses to invent an unmapped top-level operational routing contract. | Not run | Pending |
