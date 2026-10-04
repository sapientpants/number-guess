# Improvement Plan: Adopting practices from `agentic-nextjs-ts-starter`

## Context

[`sapientpants/agentic-nextjs-ts-starter`](https://github.com/sapientpants/agentic-nextjs-ts-starter)
is a "batteries-included" Next.js + TypeScript template. Its value is not Next.js itself but
the **quality and delivery tooling** wrapped around the code:

| Area             | Starter                                                                                                 | number-guess today                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| TypeScript       | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`, ES2022     | `strict` + `noUncheckedIndexedAccess`, ES2020                            |
| ESLint           | Type-aware (`recommended-type-checked`), sonarjs, unicorn, security, complexity limits, JSON linting   | Non-type-aware `recommended`, hand-written globals, `eslint-plugin-prettier` |
| Tests            | Vitest, 90% coverage thresholds, property-based tests (fast-check), mutation testing (Stryker)         | Vitest, ~81% coverage, **no thresholds**, 1 skipped test                 |
| Code quality     | knip (dead code), jscpd (duplication), madge (cycles), cspell, markdownlint, size-limit                | none                                                                     |
| Git hooks        | commitlint (`commit-msg`), branch-name validation, full gate on `pre-commit`                            | full gate on `pre-commit` only                                           |
| CI               | Parallel validate / quality / security jobs, OSV scanner, CodeQL, actionlint, weekly mutation run       | Single job running `pnpm ci`, over-broad `contents: write` permission    |
| Toolchain pinning| `engines`, `mise.toml`, `.npmrc engine-strict`                                                          | `packageManager` only; CLAUDE.md documents a stale pnpm version          |
| Docs             | README, CONTRIBUTING, SECURITY, ADRs, PR/issue templates, VS Code recommendations                       | No README; ad-hoc `implementation.md` / `TEST_SUMMARY.md` at the root    |
| Input validation | "Validate all inputs at trust boundaries"                                                               | `localStorage` JSON is cast with `as Player[]` and trusted blindly       |

This plan ports the parts that fit a client-only Vite SPA and explicitly skips the rest.

## Out of scope (and why)

- **Migrating to Next.js** — the game is a pure client-side SPA with no server needs; Vite is the right tool.
- **Docker / Trivy container scanning** — nothing is shipped as a container.
- **Changesets / release automation / SBOM / publint / attw / api-extractor / typedoc** — this is an app, not a published package.
- **autocannon perf benchmarks** — no server to benchmark.
- **opencode / local-model agent configuration** — the project already uses Claude Code (`CLAUDE.md`).

## Phase 1 — Repository hygiene

1. Delete stale `tsc -b` artifacts committed to the root: `vite.config.js`, `vite.config.d.ts`.
   Stop `tsconfig.node.json` emitting them (use `noEmit`) and ignore them in `.gitignore`.
2. Add `"private": true`, a real `description`, and `engines.node` to `package.json`; drop the
   meaningless `main` field.
3. Add `mise.toml` and `.nvmrc` pinning Node 24 and the pnpm version from `packageManager`.
4. Add `.npmrc` with `engine-strict=true`.
5. Move `implementation.md` and `TEST_SUMMARY.md` into `docs/` (historical design notes).
6. Add `.editorconfig`, `.vscode/extensions.json` and `.vscode/settings.json`.

## Phase 2 — Stricter TypeScript

1. Raise target/lib to ES2022.
2. Enable `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
   `noPropertyAccessFromIndexSignature`, `forceConsistentCasingInFileNames`.
3. Fix all resulting errors in source and tests (e.g. `completedAt: undefined` assignments).

## Phase 3 — ESLint modernization

1. Rewrite `eslint.config.js` on `typescript-eslint`'s flat-config helpers with
   `recommendedTypeChecked` for `src/**` (type-aware rules: `no-floating-promises`,
   `no-misused-promises`, `no-unnecessary-condition`, `switch-exhaustiveness-check`, …).
2. Replace the hand-maintained globals list with the `globals` package.
3. Drop `eslint-plugin-prettier` (formatting is checked by Prettier directly, as in the starter);
   keep `eslint-config-prettier` last.
4. Add `eslint-plugin-react-hooks` (rules-of-hooks / exhaustive-deps — essential for React,
   absent today), `eslint-plugin-sonarjs`, a selective `eslint-plugin-unicorn` set, and
   `eslint-plugin-jsx-a11y`.
5. Add complexity guardrails for app code (`complexity`, `max-depth`, `max-params`,
   `max-nested-callbacks`) with relaxed overrides for tests.
6. Lint JSON files with `eslint-plugin-jsonc`, including `package.json` key ordering.
7. Fix every finding; remove dead code that surfaces (e.g. the unused `_games` parameter of
   `calculateLeaderboard`).

## Phase 4 — Defensive persistence (trust-boundary validation)

`localStorage` is user-editable and can be corrupted, quota-limited, or disabled (Safari private
mode). Today a malformed record is cast straight to `Player` and can crash rendering.

1. Add runtime type guards (`isPlayer`, `isGame`) in `storage.ts` and filter out invalid records on
   load instead of trusting `as Player[]`. No new runtime dependency (keeps the bundle small).
2. Wrap all `localStorage` reads/writes in `try/catch` so storage failures degrade gracefully
   instead of throwing inside store actions.
3. Treat an empty current-player id as "no selection" (today `selectPlayer('')` writes `''`).

## Phase 5 — Testing

1. Unit tests for the untested `storage.ts` (33% covered) including corruption/quota scenarios.
2. Tests for `Modal`, `PlayerLogin`, `PlayerHeader`, `LeaderboardEntry`, `leaderboardStore`, and
   the uncovered branches of `gameLogic.ts`.
3. Investigate and fix or remove the skipped integration test.
4. Property-based tests with `fast-check` for `gameLogic` (feedback/distance invariants, colour and
   emoji total functions) and `calculateLeaderboard` (sorted, ≤10 entries, contiguous ranks,
   only players with games).
5. Enforce coverage thresholds in `vitest.config.ts` at **90%** for lines/statements/functions/
   branches (matching the starter); exclude `main.tsx` and barrel `index.ts` files.
6. Add Stryker mutation testing (`pnpm mutation-test`) scoped to `src/utils` and `src/store`.

## Phase 6 — Code-quality tooling

Add as scripts and wire into the `ci` gate:

| Script                 | Tool              | Purpose                                         |
| ---------------------- | ----------------- | ----------------------------------------------- |
| `pnpm dead-code`       | knip              | unused files, exports, and dependencies         |
| `pnpm duplication`     | jscpd             | copy-paste detection                            |
| `pnpm deps:circular`   | madge             | circular imports                                |
| `pnpm lint:spelling`   | cspell            | typos in code and docs                          |
| `pnpm lint:markdown`   | markdownlint-cli2 | consistent Markdown                             |
| `pnpm size`            | size-limit        | bundle-size budget for `dist/assets/*.js`/`.css` |

Also format all files (not just `src/**/*.{ts,tsx}`) with Prettier, matching the starter.

## Phase 7 — Git hooks & commit conventions

1. `commit-msg` hook running commitlint with `@commitlint/config-conventional` (the repo already
   uses Conventional Commits informally — this enforces it).
2. Branch-name validation (`validate-branch-name`) in `pre-commit`.
3. Keep the full `pnpm ci` gate on `pre-commit` (documented project convention).

## Phase 8 — CI/CD

1. Rewrite `.github/workflows/ci.yml` into parallel jobs: **validate** (format, lint, types,
   spelling, markdown), **test** (coverage + artifact upload), **quality** (knip, jscpd, madge,
   build + size-limit), **security** (`pnpm audit`, OSV-Scanner).
2. Least-privilege `permissions: contents: read`; `concurrency` group that cancels superseded runs.
3. Node version read from `.nvmrc`; pnpm version read from `packageManager`.
4. Lint workflow files with actionlint.
5. Weekly + manual mutation-testing workflow.
6. Dependabot: add the `github-actions` ecosystem and group minor/patch npm updates.

## Phase 9 — Documentation

1. `README.md` — what the game is, quick start, scripts, architecture summary, quality gates.
2. `CONTRIBUTING.md` — workflow, branch naming, commit convention, quality gates.
3. `SECURITY.md` — reporting, threat model (client-only, localStorage), tooling.
4. ADRs in `docs/adr/` recording the key decisions (record ADRs; Vite SPA over Next.js; Zustand
   with cross-store `getState()`; localStorage persistence with validation; quality toolchain).
5. `.github/pull_request_template.md` and issue templates.
6. Update `CLAUDE.md` with the new commands, corrected pnpm version, and the validation invariant.

## Verification

- `pnpm ci` passes locally (format, lint, spelling, markdown, types, build, size, dead-code,
  duplication, cycles, coverage ≥ 90%).
- `pnpm mutation-test` runs and reports a score.
- `actionlint` passes on all workflows.
- App still builds and behaves identically (no gameplay changes).
