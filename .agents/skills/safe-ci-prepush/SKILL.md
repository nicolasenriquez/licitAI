---
name: safe-ci-prepush
description: Run safe local pre-push verification and apply only supported mechanical fixes.
argument-hint: "[--no-fix]"
disable-model-invocation: true
---

# Safe CI Pre-push

Run this skill when user requests safe local pre-push verification.

Use repository `just ci-prepush` contract. Keep worktree changes. Make only
mechanical fixes that the repository tools support. Continue after failures.

Read [fix-policy.md](references/fix-policy.md) before classifying failures.

## Steps

### 1. Lock baseline

Run these commands:

```bash
git status --short --branch
git diff --stat HEAD
git diff --name-only HEAD
git ls-files --others --exclude-standard
```

Record output in temporary run notes. Include staged, unstaged, and untracked
files in baseline. The completion criterion is a complete initial file list.

### 2. Check tools

Confirm repository root, Node, `just`, and `node_modules`.

Use `just runtime-check` only for runtime diagnosis. This skill does not start
the application stack or alternate CI infrastructure.

The completion criterion is either all required tools are available or each
missing tool has a recorded blocked result.

### 3. Run CI pass

Run:

```bash
node .agents/skills/safe-ci-prepush/scripts/run-safe-ci-prepush.mjs
```

Runner invokes native `just ci-prepush` first. On aggregate failure, runner
invokes each pre-push leaf target and isolates bundled checks when needed.
Runner keeps going after every non-zero result.

Inspect each temporary log. Use first-cause diagnostics. Treat later cascade
errors as evidence only.

When aggregate and working-tree checks pass, one passing run completes this
step. When any check fails, the completion criterion is one result for every
leaf target, plus isolated results for every failed bundled target.

### 4. Classify failures

Read each failed log. Apply [fix-policy.md](references/fix-policy.md).

Separate safe fixes from skipped failures. Use first-cause evidence. Record
target, command, exit code, location, diagnostic, and root cause for each
failure.

The completion criterion is zero unclassified failures.

### 5. Apply safe fixes

Use [fix-policy.md](references/fix-policy.md).

Apply fixes only when diagnostic, file, and tool action match policy. Use exact
diagnosed files. Inspect every diff after each fix.

Run `git diff --check` after each fix. Keep fixes only when affected checks
pass. Use at most three safe-fix passes. Classify a repeated diagnostic as
skipped.

`--no-fix` means diagnostic mode. In this mode, record safe fixes but apply no
file changes.

The completion criterion is every applied fix validated, or every unfixable
diagnostic classified and recorded.

### 6. Finish run

When safe fixes occurred, run the runner again. Run native `just ci-prepush`
again through the runner when no unresolved safe fix remains.

Run:

```bash
git diff --check
git status --short --branch
```

Do not commit or push. Do not reset user changes.

The completion criterion is a final CI result, a final worktree check, and no
unclassified diagnostic.

### 7. Write terminal report

Report these sections:

```text
Safe fixes
Remaining failures
Root causes
Validation
Worktree
```

For every remaining failure, report target, command, exit code, file and line
when available, diagnostic, root cause, evidence, confidence, and next action.

State `Root cause not established` when evidence is insufficient. Never replace
an unknown cause with a guess.
