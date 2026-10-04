# 5. Quality toolchain

- Status: Accepted
- Date: 2026-10-04

## Context

The project had linting, formatting and tests, but no coverage thresholds, non-type-aware lint
rules, and no checks for dead code, duplication, spelling or bundle size. We adopted the quality
tooling from agentic-nextjs-ts-starter where it fits a client-only app.

## Decision

- **TypeScript**: strict mode plus `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noImplicitReturns` and `noPropertyAccessFromIndexSignature`.
- **ESLint**: `typescript-eslint` type-checked configs, react-hooks, jsx-a11y, sonarjs, selected
  unicorn rules, complexity limits, JSON and Markdown (`@eslint/markdown`) linting. Prettier
  formats; ESLint does not.
- **Tests**: Vitest with 90% coverage thresholds; fast-check property tests for pure logic;
  Stryker mutation testing weekly in CI.
- **Static checks**: knip, jscpd, madge, cspell and size-limit, all part of `pnpm ci`.
- **Process**: Conventional Commits enforced by commitlint; branch names validated; the full gate
  runs in the pre-commit hook and in parallel CI jobs.

Two tool choices differ from the starter:

- Stryker uses the **command** test runner. `@stryker-mutator/vitest-runner` 10 does not activate
  mutants under Vitest 5, so every mutant falsely "survives". The command runner runs the whole
  suite per mutant, which is slower but correct. Revisit when the Vitest runner supports Vitest 5.
- Markdown is linted with `@eslint/markdown` rather than `markdownlint-cli2`, whose transitive
  `braces` dependency has an advisory with no patched release.

## Consequences

- Commits take longer because the pre-commit hook runs the full gate.
- Some plugins (jsx-a11y, madge) have not widened their peer ranges to ESLint 10 / TypeScript 6;
  this is recorded in `pnpm-workspace.yaml` and should be removed once they do.
