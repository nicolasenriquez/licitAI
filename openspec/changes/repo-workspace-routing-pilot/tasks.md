# Tasks: repo-workspace-routing-pilot

## Phase 0: Pilot Closeout

- [x] 1. Extend the root routing contract in `AGENTS.md` without replacing the existing repository rules.
- [x] 2. Keep `CLAUDE.md` compatible with the same routing contract as an incremental shim.
- [x] 3. Add `CONTEXT-MAP.md` at the repository root as the master routing map.
- [x] 4. Add `openspec/AGENTS.md` and `openspec/CONTEXT.md` with explicit bounce-back rules.
- [x] 5. Add `docs/AGENTS.md` and `docs/CONTEXT.md` with explicit bounce-back rules.
- [x] 6. Create the OpenSpec change artifacts for `repo-workspace-routing-pilot`.
- [x] 7. Create a manual acceptance suite with prompt cases, expected consulted files, expected final folder, expected behavior, and result-tracking fields.
- [x] 8. Record the user-completed manual acceptance result for Codex.
- [x] 9. Record the user-completed manual acceptance result for Claude Code.
- [x] 10. Unlock post-pilot expansion only after both manual pilot runs pass completely.
- [x] 11. Update the change artifacts so they describe validated-pilot rollout rather than a still-pending pilot.

## Phase 1: Rollout Architecture

- [x] 12. Inventory the remaining top-level repo surfaces and assign each one to an explicit rollout wave.
- [x] 13. Add `packages/AGENTS.md` and `packages/CONTEXT.md` as the package-index routing surface before broad leaf-package expansion.
- [x] 14. Decide which pre-existing local `AGENTS.md` files must be harmonized first, including `packages/twenty-codex-plugin/AGENTS.md` and package templates that may otherwise drift.
- [x] 15. Define the functional grouping for the remaining packages so expansion does not devolve into one-off folder rules.
- [x] 16. Extend `manual-acceptance.md` with per-wave case templates before implementing the next wave.

## Phase 2: Docs-Heavy Wave

- [x] 17. Add routing/context files for `packages/twenty-docs`.
- [x] 18. Add routing/context files for `packages/twenty-claude-skills`.
- [x] 19. Update `CONTEXT-MAP.md` and any affected folder contracts to include the docs-heavy wave once the files land.
- [x] 20. Add manual acceptance cases for the docs-heavy wave in Codex and Claude Code.
- [x] 21. Execute and record the docs-heavy wave acceptance results.

## Phase 3: AI Tooling Wave

- [x] 22. Add routing/context files for `.codex`.
- [x] 23. Harmonize `packages/twenty-codex-plugin/AGENTS.md` with the root contract and add a matching `CONTEXT.md`.
- [x] 24. Update `CONTEXT-MAP.md` and any affected folder contracts to include the AI-tooling wave once the files land.
- [x] 25. Add manual acceptance cases for the AI-tooling wave in Codex and Claude Code.
- [x] 26. Execute and record the AI-tooling wave acceptance results.

## Phase 4: Core Monorepo Wave

- [x] 27. Add routing/context files for `packages/twenty-server`.
- [x] 28. Add routing/context files for `packages/twenty-front`.
- [x] 29. Add routing/context files for `packages/twenty-shared`.
- [x] 30. Add routing/context files for `packages/twenty-ui`.
- [x] 31. Update `CONTEXT-MAP.md` and the package-index routing docs to include the core-package wave once the files land.
- [x] 32. Add manual acceptance cases for the core-package wave in Codex and Claude Code.
- [x] 33. Execute and record the core-package wave acceptance results.

## Phase 5: Remaining Repo Surfaces

- [x] 34. Expand the package-index routing docs to the remaining package groups in dependency-aware order.
- [x] 35. Decide whether top-level operational surfaces such as `.github/` should become first-class routing surfaces or remain root-routed.
- [x] 36. Run a final consistency pass so root, package-index, and leaf contracts use the same vocabulary and bounce rules.
- [x] 37. Execute the final cross-wave manual acceptance pass after the remaining surfaces are mapped.
- [x] 38. Decide whether this change should archive after full rollout or split later waves into follow-up changes.

## Notes

- The pilot acceptance was reported complete by the user and is recorded as such in `manual-acceptance.md`.
- Understand Anything is intentionally treated as optional discovery support only, not as required routing infrastructure.
- Phase 1 rollout architecture is captured in `surface-inventory.md`, and the root contract now includes the `packages/` package-index surface.
- Phase 2 docs-heavy wave acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Phase 3 AI-tooling wave acceptance complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 2 and wave 3 are gated-closed.
- Wave 4 core monorepo wave complete: all 10 cases (5 patterns × 2 tools) pass.
- Wave 5 remaining surfaces complete: all 10 cases (5 patterns × 2 tools) pass.
- Task 35 decision: `.opencode/` mapped as AI-tooling surface; `.github/`, `.cursor/`, `.vscode/`, `.yarn/` remain intentionally root-routed with explicit documentation.
- Task 36 consistency pass: all 28 mapped surfaces verified — every AGENTS.md has Bounce Back To Root When + Working Contract; every CONTEXT.md has Scope Boundary; CONTEXT-MAP.md canonical table complete.
- Task 38 archive decision: archive `repo-workspace-routing-pilot` after this commit. All surfaces mapped. No further waves needed.
- All 38 tasks complete. Change ready for archive.
