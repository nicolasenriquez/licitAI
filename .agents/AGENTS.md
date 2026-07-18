---
type: agent-contract
title: Shared Agent Skills Contract
description: Canonical routing contract for harness-agnostic repository skills.
---

# Shared Agent Skills Contract

`.agents/skills/` is the single source of truth for repository-local skills.

Keep each skill in one directory with a `SKILL.md` and co-locate only the
references, scripts, and assets that the skill actually uses. Harness-specific
dispatch belongs in a clearly named reference inside the owning skill.

Codex and OpenCode may retain thin native command or configuration adapters,
but they must not contain a second full copy of a skill.

The published plugin package under `packages/twenty-codex-plugin` is separate
from these repository-local skills.
