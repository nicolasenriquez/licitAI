---
type: package-readme
title: "twenty-design-tokens"
description: "Canonical DTCG source and deterministic adapters for product and marketing visual registers."
okf_version: "0.1"
---
# twenty-design-tokens

Private workspace package for the canonical design-token seam.

## Commands

```bash
npx nx run twenty-design-tokens:validate
npx nx run twenty-design-tokens:generate
npx nx run twenty-design-tokens:test
npx nx run twenty-design-tokens:typecheck
```

Source records live under `src/source/`. Generated CSS, TypeScript, and Figma
bundles live under `generated/` and carry a generated-file header. The current
source population is an incremental parity baseline; `twenty-ui` remains the
public runtime contract until each legacy surface is migrated and verified.
