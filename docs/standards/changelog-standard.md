---
type: standard
title: "Changelog Standard: Semantic Versioned Release Notes"
description: "Repository standard for Changelog Standard: Semantic Versioned Release Notes."
okf_version: "0.1"
---
# Changelog Standard: Semantic Versioned Release Notes

## Overview

This repository uses `CHANGELOG.md` as the human-readable history of released
changes. The changelog must follow Semantic Versioning rules for version
numbers and release meaning, while staying concise enough for reviewers and
users to scan quickly.

## Core Principles

- Use SemVer to decide how a release is versioned.
- Write changelog entries for users, not for internal implementation details.
- Keep the changelog append-only once a release has been published.
- Make breaking changes obvious.
- Keep unreleased work separate from published releases.

## SemVer Rules

SemVer defines the meaning of the version number:

- `MAJOR` for incompatible or breaking API changes.
- `MINOR` for backward-compatible new functionality.
- `PATCH` for backward-compatible bug fixes.

Additional rules:

- Version strings must use `MAJOR.MINOR.PATCH`.
- Pre-release labels such as `1.4.0-rc.1` are allowed for staged release work.
- Build metadata such as `+build.7` may be recorded, but it does not change
  version precedence.
- Once a version is released, its published contents must not be rewritten.

## File Layout

The repository should keep the changelog at the project root unless a different
layout is explicitly required.

Recommended structure:

```text
CHANGELOG.md
```

Recommended section order:

```text
## Unreleased
## [1.4.2] - 2026-05-31
## [1.4.1] - 2026-05-18
```

## Entry Format

Each release entry should contain a heading with the version and date, followed
by short bullets that describe the user-visible change.

Example:

```markdown
## [1.4.2] - 2026-05-31

### Fixed
- Prevented duplicate opportunity rows when the backend returns repeated IDs.

### Changed
- Tightened validation on imported records to reject malformed timestamps.
```

Rules:

- Keep bullets specific.
- Mention impact before implementation detail.
- Link to the issue or pull request when that helps traceability.
- Keep unpublished work under `Unreleased` until the release is cut.

## Recommended Release Sections

The following section labels are recommended for readability. They are a
repository convention on top of SemVer, not a requirement of the spec.

- `Added` for new user-facing behavior.
- `Changed` for behavior that is still backward compatible but different.
- `Deprecated` for behavior that will be removed later.
- `Removed` for behavior that is no longer available.
- `Fixed` for bug fixes.
- `Security` for security-related fixes or mitigations.

## Release Workflow

1. Record change notes as work lands.
2. Keep `Unreleased` current during development.
3. When the release is ready, move the notes into a versioned heading.
4. Tag the release after the versioned entry is final.
5. Do not edit the published release entry except to correct a factual error
   before the release is public.

## Versioning Policy

- Breaking public API changes require a major version bump.
- Backward-compatible feature additions require a minor version bump.
- Backward-compatible bug fixes require a patch version bump.
- Pre-release versions are appropriate for release candidates and validation
  builds.
- Build metadata can be used for traceability, but never for precedence.

## Do's and Don'ts

### Do

- Write the changelog for release consumers.
- Keep release notes short, direct, and scannable.
- Include dates for released versions.
- Preserve older entries once they are published.
- Use version headings that match the release tags.

### Don't

- Don't merge implementation notes into the changelog.
- Don't rewrite history after a public release.
- Don't publish a version number that does not match the actual release.
- Don't use the changelog as a task list.
- Don't mix unpublished notes with released notes.

## References

- https://semver.org/

---

Last Updated: 2026-05-31
Version: 1.0.0
