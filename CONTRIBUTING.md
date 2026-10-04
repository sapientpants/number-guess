# Contributing

## Setup

1. Install Node.js 24 and the pnpm version from `package.json` (`mise install` does both).
2. `pnpm install` — this also installs the Git hooks.
3. `pnpm dev` to run the app, `pnpm test` to run tests in watch mode.

## Workflow

1. Branch from `main` using `<type>/<short-description>`, e.g. `feat/sound-effects` or
   `fix/leaderboard-ties`. Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
   `test`, `build`, `ci`, `chore`, `revert`. The pre-commit hook rejects other names.
2. Write tests alongside your change (`*.test.ts(x)` next to the source file; broader flows in
   `src/__tests__/`).
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/), e.g.
   `fix: keep best game when a slower game is won`. The commit-msg hook enforces this.
4. Open a pull request against `main`. CI must be green before merging; use **Squash and merge**.

## Quality gates

The pre-commit hook runs `pnpm ci`, which fails on any of:

- Prettier formatting, ESLint (type-aware), cspell
- TypeScript errors (strict mode, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, …)
- Dead code or unused dependencies (knip), duplicated code (jscpd), circular imports (madge)
- Production build errors or bundle size over budget (size-limit)
- Failing tests or coverage below 90% for statements, branches, functions or lines
- Known vulnerabilities in dependencies (`pnpm audit`)

Run `pnpm ci` locally before pushing to get the same result as CI. To fix most formatting and lint
issues automatically: `pnpm format && pnpm lint:fix`.

### Mutation testing

`pnpm mutation-test` runs [Stryker](https://stryker-mutator.io/) against `src/utils` and
`src/store`. It takes a few minutes, so CI runs it weekly rather than on every PR. The build
breaks below a 50% score; the current score is around 95%. Open
`reports/mutation/index.html` to see surviving mutants.

### Property-based tests

Pure logic should have [fast-check](https://fast-check.dev/) properties in addition to example
tests — see `src/utils/gameLogic.property.test.ts` and `src/utils/storage.test.ts`.

## Conventions

- Shared types live in `src/types/index.ts`.
- Only `src/utils/storage.ts` touches `localStorage`. Validate anything new you persist there.
- Use relative imports in app code.
- Record significant decisions as ADRs in `docs/adr/`.
