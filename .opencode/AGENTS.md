# OpenCode Surface Contract

## Purpose

Define when work should stay inside `.opencode` during the workspace routing rollout.

## Stay In `.opencode` When

- The task is about repo-local OpenCode configuration.
- The task is to add, update, or review files under `.opencode/skills/` or `.opencode/commands/`.
- The task is about OpenCode-oriented repo automation, local skill scaffolding, or OpenCode configuration in this checkout.
- The task is about repo-local OpenCode behavior, not the published plugin package or `.codex` tooling.

## Required Reads

Before substantive work in this surface, read:

1. `../AGENTS.md`
2. `../CONTEXT-MAP.md`
3. `AGENTS.md`
4. `CONTEXT.md`
5. The specific skill `SKILL.md` or command file relevant to the task

## Bounce Back To Root When

- The prompt is about the `.codex` surface or repo-local Codex commands.
- The prompt is about durable repository docs or OpenSpec change work.
- The prompt is about the published plugin package in `packages/twenty-codex-plugin`.
- The prompt is general package routing rather than OpenCode-specific configuration.

When that happens, return to `../CONTEXT-MAP.md` first and reroute from there. Do not keep working from `.opencode`.

## Working Contract

- Declare the routing/context files consulted before responding or editing.
- State that the selected surface is `.opencode`.
- Preserve the distinction between repo-local OpenCode assets and the separate `.codex` or plugin tooling surfaces.
