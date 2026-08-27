# Safe Fix Policy

Use this policy for every CI failure.

## Safe Fix

A safe fix is local, mechanical, tool-owned, and non-semantic. It preserves
runtime behavior. It changes only diagnosed files.

Inspect the diff before validation. Run the affected check after the fix.

## Allowed Fixes

- Formatting, spacing, indentation, and line endings: run `npx oxfmt` on exact diagnosed files.
- Auto-fixable lint rules: run `npx oxlint --fix` with repository config on exact diagnosed files.
- Type diagnostics: apply only an obvious type-position correction that uses an existing repository type, changes no emitted behavior, adds no `any`, assertion, suppression, or non-null escape, and passes targeted typecheck.

The skill treats `rof` as formatting.

## Skipped Fixes

- Type diagnostics without a provably mechanical correction.
- Build or bundler errors.
- Test, snapshot, or Storybook failures.
- Generated file, GraphQL codegen, migration, or schema failures.
- Dependency, lockfile, cache, or installation failures.
- Security, secret-scan, audit, or SBOM findings.
- Environment, service, Docker, database, or network failures.
- API, data, business-rule, or runtime behavior changes.

Record skipped failures. Continue with next target.

## Root Cause Method

Use first-cause evidence from the target log and repository files.

- Lint or format: name rule or formatting contract and affected file.
- Typecheck: name the incompatible declaration, import, or type contract.
- Build: name missing input, dependency, configuration, or compile contract.
- Test: name observed behavior and expected contract.
- Dependency or environment: name missing version, service, variable, or access.
- Generated or migration check: name source drift and generated artifact.

Use `Root cause not established` when log and source inspection cannot prove a
cause. Add confidence: high, medium, or low.

## Report Record

Use one record per remaining failure:

```text
- Target: <target>
  Command: <command>
  Exit: <code>
  Location: <path:line or none>
  Diagnostic: <short message>
  Root cause: <cause or Root cause not established>
  Evidence: <log or source evidence>
  Confidence: <high|medium|low>
  Action: skipped; <next action>
```
