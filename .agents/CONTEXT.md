---
type: context
title: Shared Agent Skills Context
description: Scope and ownership of the repository's portable skills.
---

# Shared Agent Skills Context

`.agents/skills/` owns portable workflow instructions for all supported AI
harnesses in this checkout. Each skill has one canonical `SKILL.md` and may
contain on-demand references, scripts, or assets.

Codex-specific and OpenCode-specific behavior is kept as a co-located adapter
reference when the workflow cannot be expressed portably.
