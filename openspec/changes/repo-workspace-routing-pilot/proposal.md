# Change Proposal: repo-workspace-routing-pilot

## Why

This repository already uses root-level agent entry files, durable docs, and OpenSpec change artifacts, but it does not yet have an explicit routing contract for folder-scoped agent work.

That gap makes it too easy for an agent to:

- stay in the wrong surface for the task
- mix durable docs work with active change work
- invent local folder rules for areas that are not yet mapped
- answer without making its consulted context explicit

The initial pilot for root, `openspec/`, and `docs/` is now in place and the manual test gate has been completed by the user. The remaining problem is consistency: the change still reads like a pending pilot instead of a validated pilot that now needs a controlled rollout to the rest of the repository.

This change therefore continues past the pilot and becomes the rollout-tracking spec for staged routing documentation expansion across the repo. It is not a product feature and does not alter runtime behavior.

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
  - `.codex`
  - `packages/twenty-codex-plugin`
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

## Expected Outcome

At the end of this change, the repository has:

- a validated root routing contract
- a recorded pilot acceptance result
- an explicit wave plan for extending routing documentation across the rest of the repo
- a consistent rule that every mapped surface uses repo-native files, not external generated truth
- a backlog of remaining work that can be executed without reopening the same design questions each time

## Expansion Order After The Pilot

1. Stabilize rollout architecture
   - define the full surface inventory
   - add `packages/` as the package-index surface
   - reconcile pre-existing local `AGENTS.md` files
2. Docs-heavy surfaces
   - `packages/twenty-docs`
   - `packages/twenty-claude-skills`
3. AI tooling surfaces
   - `.codex`
   - `packages/twenty-codex-plugin`
4. Core monorepo packages first
   - `packages/twenty-server`
   - `packages/twenty-front`
   - `packages/twenty-shared`
   - `packages/twenty-ui`
5. The rest of `packages/` by functional group
6. Decide separately whether top-level operational surfaces such as `.github/` should become first-class routing surfaces or remain root-routed
