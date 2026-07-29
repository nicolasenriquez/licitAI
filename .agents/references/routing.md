# Routing reference

`AGENTS.md` at the repository root is the canonical entrypoint. Always read
root `index.md` before choosing a mapped surface; then read the selected
surface's local routing/context files before substantive work.

- `openspec/`: use for active OpenSpec artifacts, change review, implementation,
  validation, sync, and archive work. Its requirements control the change; do
  not infer missing requirements from adjacent documentation.
- `docs/`: use for durable repository architecture, business, governance,
  operations, standards, and ADRs. Return to root if the task is actually an
  active change.
- `packages/`: select the owning package through `packages/index.md` before
  entering a leaf package. Core work most often routes to `twenty-front`,
  `twenty-server`, `twenty-shared`, `twenty-ui`, or `twenty-design-tokens`.
- `.agents/`: contains the canonical cross-harness skills. The published Codex
  plugin is a separate package under `packages/twenty-codex-plugin`.
- `.opencode/`: contains native OpenCode runtime configuration only.

The nearest applicable `AGENTS.md` takes precedence. If no mapped surface
fits, stay on the root contract instead of creating a local one.
