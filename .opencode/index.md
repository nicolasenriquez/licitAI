# OpenCode Index

## Purpose

Use this index to route repo-local OpenCode work inside `.opencode/`.

## Surface Layout

| Path | Role |
| --- | --- |
| `.opencode/skills/` | Repo-local OpenCode skills and references |
| `.opencode/commands/` | Repo-local OpenCode commands, when present |

## Routing Rule

- Stay in `.opencode/` for repo-local OpenCode configuration and skills.
- Bounce back through root `index.md` when the task is really `.codex/`,
  `docs/`, `openspec/`, the published plugin package, or general package
  routing.
