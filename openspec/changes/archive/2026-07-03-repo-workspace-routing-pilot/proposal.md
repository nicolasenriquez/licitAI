# Change Proposal: repo-workspace-routing-pilot

## Why

This repository already uses root-level agent entry files, durable docs, and OpenSpec change artifacts, but it did not yet have an explicit routing contract for folder-scoped agent work.

That gap made it too easy for an agent to:

- stay in the wrong surface for the task
- mix durable docs work with active change work
- invent local folder rules for areas that were not yet mapped
- answer without making its consulted context explicit

This change delivers a file-based routing contract for the whole repository through a validated pilot and a staged rollout. The pilot proved the contract on the root, `openspec/`, and `docs/`, and the staged waves then extended the same contract to every mapped repo surface, including `packages/` as a package-index, every leaf package with a routing contract of its own, `.codex/` and `.opencode/` as AI-tooling surfaces, and the `packages/twenty-apps` index for the apps collection. It is not a product feature and does not alter runtime behavior.

## Scope

### In

- A root routing contract using:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `CONTEXT-MAP.md`
- Folder-local routing contracts for:
  - `openspec/`
  - `docs/`
- A public file-contract definition for routing surfaces
- A recorded manual acceptance result for the validated pilot
- A staged rollout plan for the remaining repository surfaces
- The next routing waves for:
  - `packages/` as the package-index surface
  - `packages/twenty-docs`
  - `packages/twenty-claude-skills`
  - `.codex/`
  - `packages/twenty-codex-plugin`
  - `.opencode/`
  - core monorepo packages and then remaining package groups
- A clear position on external discovery tools such as Understand Anything

### Out

- Product-facing routing features inside Twenty
- Automatic semantic evaluation of agent answers
- Blind one-shot expansion to every folder in a single pass
- Treating external graph tooling as the source of truth for routing contracts
- `.agents/` support in this checkout

## Decisions

- The root `AGENTS.md` remains the canonical agent entrypoint.
- `CLAUDE.md` stays compatible as a lightweight shim into the same routing contract.
- `CONTEXT-MAP.md` remains the root routing map.
- The validated pilot surfaces are `openspec/` and `docs/`.
- If a prompt lands in the wrong folder, the agent must bounce back through the root map before rerouting.
- Unmapped surfaces must not get improvised folder-local routing rules during rollout.
- The agent must declare consulted routing/context files before substantive response or action.
- Future expansion proceeds by ordered waves, not all at once.
- `packages/` should gain a parent routing contract before broad leaf-package expansion.
- Existing local `AGENTS.md` files must be harmonized with the root routing contract instead of drifting.
- Understand Anything may be used as an optional discovery aid, but the file-backed routing contract remains the only source of truth and no plugin dependency is introduced by this change.
- `.opencode/` is a parallel AI-tooling surface to `.codex/`, with the same file contract and explicit bounce rules between the two.

## Expected Outcome

At the end of this change, the repository has:

- a validated root routing contract
- a recorded pilot acceptance result
- an explicit wave plan for extending routing documentation across the rest of the repo
- a consistent rule that every mapped surface uses repo-native files, not external generated truth
- a backlog of remaining work that can be executed without reopening the same design questions each time

## Rollout Order (Executed)

1. Pilot closeout and rollout architecture
   - defined the full surface inventory
   - added `packages/` as the package-index surface
   - reconciled pre-existing local `AGENTS.md` files
2. Docs-heavy wave
   - `packages/twenty-docs`
   - `packages/twenty-claude-skills`
3. AI tooling wave
   - `.codex/`
   - `packages/twenty-codex-plugin`
   - `.opencode/` (added during the AI-tooling extension in wave 5)
4. Core monorepo wave
   - `packages/twenty-server`
   - `packages/twenty-front`
   - `packages/twenty-shared`
   - `packages/twenty-ui`
5. Remaining `packages/` by functional group
   - SDK and CLI: `create-twenty-app`, `twenty-sdk`, `twenty-cli`, `twenty-client-sdk`
   - App and runtime support: `twenty-front-component-renderer`, `twenty-emails`, `twenty-companion`, `twenty-zapier`
   - Infra, testing, and utilities: `twenty-docker`, `twenty-e2e-testing`, `twenty-utils`, `twenty-oxlint-rules`
   - Websites: `twenty-website`, `twenty-website-redone`
   - App collections: `packages/twenty-apps` (index surface; individual apps deferred to the index)
6. Operational surfaces such as `.github/`, `.cursor/`, `.vscode/`, `.yarn/` remain intentionally root-routed and are documented as such in `CONTEXT-MAP.md`.
