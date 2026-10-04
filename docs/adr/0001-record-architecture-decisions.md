# 1. Record architecture decisions

- Status: Accepted
- Date: 2026-10-04

## Context

Decisions about this project's structure and tooling have so far lived only in commit messages
and in `CLAUDE.md`. Contributors (human or AI) need to know not just what the conventions are but
why, so they don't undo them by accident.

## Decision

Record significant decisions as lightweight Architecture Decision Records (ADRs), as described by
[Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), in
`docs/adr/NNNN-title.md`. ADRs are immutable once accepted; a later ADR supersedes an earlier one.

## Consequences

New structural or tooling decisions come with a short ADR in the same pull request.
