# OpenCode Index

## Purpose

Use this index to route repo-local OpenCode work inside `.opencode/`.

## Surface Layout

| Path | Role |
| --- | --- |
| `.opencode/skills/` | Retired legacy location; canonical skills live in `.agents/skills/` |
| `.opencode/commands/` | Repo-local OpenCode commands, when present |

## Routing Rule

- Stay in `.opencode/` for repo-local OpenCode configuration and native commands.
- Route canonical skill changes through `.agents/`.
- Bounce back through root `index.md` when the task is really `.codex/`,
  `.agents/`, `docs/`, `openspec/`, the published plugin package, or general package
  routing.
