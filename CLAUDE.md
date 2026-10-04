# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript number guessing game (1-100) built with Vite, featuring per-player stat tracking, a leaderboard, and hot/cold visual feedback. All data persists to `localStorage` — there is no backend.

## Development Commands

Package manager is `pnpm` (version pinned by `packageManager` in `package.json`); Node 24 (`.nvmrc`, `mise.toml`).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check (`tsc -b`) then Vite production build
- `pnpm preview` — preview the production build
- `pnpm typecheck` / `pnpm check-types` — type-check only (`tsc -b` / `tsc --noEmit`)
- `pnpm lint` / `pnpm lint:fix` — type-aware ESLint over TS/TSX, JSON and Markdown
- `pnpm lint:spelling` — cspell (add genuine new words to `cspell.json`)
- `pnpm format` / `pnpm format:check` — Prettier over the whole repo
- `pnpm test` — Vitest in watch mode; `pnpm test:ui` — Vitest UI
- `pnpm test:coverage` — single run with coverage; fails below 90% on any metric
- `pnpm mutation-test` — Stryker mutation testing of `src/utils` + `src/store` (~4 min)
- `pnpm quality` — knip (dead code/deps), jscpd (duplication), madge (circular imports)
- `pnpm size` — bundle size budgets in `.size-limit.json` (needs `pnpm build` first)
- `pnpm ci` — full gate: audit, format, lint, spelling, types, quality, build, size, coverage

Run a single test file: `pnpm test src/utils/gameLogic.test.ts` (append `--run` for a one-shot, non-watch run).

Git hooks (Husky): `pre-commit` validates the branch name (`<type>/<kebab-description>`, see `.validate-branch-namerc.json`) and runs `pnpm run ci`; `commit-msg` runs commitlint (Conventional Commits, body lines ≤ 100 chars).

## Architecture

### State: three interconnected Zustand stores

State lives in `src/store/` and stores call each other directly via `getState()` rather than through React:

- **`playerStore`** — player list + `currentPlayer`; source of truth for all player stats.
- **`gameStore`** — the in-progress game (`targetNumber`, `guesses`, `gameStatus`, `guessResults`). `startNewGame` calls `usePlayerStore.getState().incrementGamesPlayed(...)`.
- **`leaderboardStore`** — derived view; `updateLeaderboard` reads `usePlayerStore.getState().players` and recomputes.

### Where stats get written (important, non-obvious)

Stat updates are split between a store action and a component effect:

- **Games played** is incremented in `gameStore.startNewGame` (in the store).
- **Win stats** (`gamesWon`, `totalGuesses`, `bestGame`, `averageGuesses`) are written by a `useEffect` in `src/components/Game/GameBoard.tsx` that fires when `gameStatus` becomes `'won'` and calls `playerStore.updatePlayerStats`.

Consequence: `averageGuesses = totalGuesses / gamesWon` — averaged over **won games only**, not games played. `incrementGamesPlayed` deliberately does _not_ recompute the average. Keep this invariant if you touch stat logic.

### Persistence

`src/utils/storage.ts` is the only module that touches `localStorage` (keys: `number-guess-players`, `number-guess-games`, `number-guess-current-player`). Store actions call these save/load helpers directly.

`localStorage` is treated as untrusted (ADR 0004): every loaded record goes through `parsePlayer` / `parseGame`, which validate types, rehydrate `Date` fields from strings, drop malformed records, and normalize legacy data (missing `gamesWon` → `0`). Reads and writes never throw. When adding a persisted field, add it to the matching parser (with a default if older data may lack it).

Ids come from `createId(prefix)` in `src/utils/id.ts` — don't use `Date.now()` alone (it collides).

### Game logic

`src/utils/gameLogic.ts` is pure and framework-free: `checkGuess` returns feedback (`too-high`/`too-low`/`correct`) plus a hot/warm/cold `distance` and numeric `difference`; a single `DIFFERENCE_BANDS` table maps that to Tailwind gradient classes and emoji. `src/utils/insights.ts` holds the pure analytics shown in the UI (streaks, win rate, summaries). Both have example tests plus fast-check property tests (`*.property.test.ts`).

### Leaderboard rules

`calculateLeaderboard` (in `storage.ts`) includes only players with `gamesPlayed > 0`, sorts by `averageGuesses` ascending, and returns the top 10.

### Types

All shared types are centralized in `src/types/index.ts` (`Player`, `Game`, `LeaderboardEntry`, `GameStatus`, `GuessResult`). Import from there rather than redefining.

## Conventions

- Path alias `@` → `src/` is configured for Vitest; prefer relative imports for app code to match the existing codebase.
- Tests are colocated with source as `*.test.ts(x)`; broader flows live in `src/__tests__/`. Test env is `jsdom` with `@testing-library/react`; global setup in `src/test/setup.ts` provides a working in-memory `localStorage` that is cleared after each test.
- No barrel `index.ts` files — import components from their own module.
- Stryker uses the `command` test runner on purpose: the Vitest runner can't activate mutants under Vitest 5 (ADR 0005).
- Architecture decisions live in `docs/adr/`; add one for significant structural or tooling changes.
- Styling is Tailwind CSS v4 (via `@tailwindcss/vite`) with a purple-pink gradient / dark theme; animations use Framer Motion.
- `Math.random()` in `generateRandomNumber` is intentional and documented with a comment — it is not a security issue for this game; don't "fix" it.
