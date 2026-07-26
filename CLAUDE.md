# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript number guessing game (1-100) built with Vite, featuring per-player stat tracking, a leaderboard, and hot/cold visual feedback. All data persists to `localStorage` — there is no backend.

## Development Commands

Package manager is `pnpm` (v10.12.1).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check (`tsc -b`) then Vite production build
- `pnpm preview` — preview the production build
- `pnpm typecheck` / `pnpm check-types` — type-check only (`tsc -b` / `tsc --noEmit`)
- `pnpm lint` / `pnpm lint:fix` — ESLint over `.ts,.tsx`
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm test` — Vitest in watch mode
- `pnpm test:ui` — Vitest UI
- `pnpm test:coverage` — single run with coverage (used by CI)
- `pnpm ci` — full gate: audit + format:check + lint + check-types + build + test:coverage

Run a single test file: `pnpm test src/utils/gameLogic.test.ts` (append `--run` for a one-shot, non-watch run).

The Husky `pre-commit` hook runs `pnpm run ci`, so a commit fails unless format, lint, types, build, and coverage all pass.

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

Consequence: `averageGuesses = totalGuesses / gamesWon` — averaged over **won games only**, not games played. `incrementGamesPlayed` deliberately does *not* recompute the average. Keep this invariant if you touch stat logic.

### Persistence

`src/utils/storage.ts` is the only module that touches `localStorage` (keys: `number-guess-players`, `number-guess-games`, `number-guess-current-player`). Store actions call these save/load helpers directly. `Date` fields are serialized as strings and rehydrated to `Date` objects on load — preserve that when adding date fields.

### Game logic

`src/utils/gameLogic.ts` is pure and framework-free: `checkGuess` returns feedback (`too-high`/`too-low`/`correct`) plus a hot/warm/cold `distance` and numeric `difference`; helper functions map that to Tailwind gradient classes, emoji, and messages. This is the most heavily unit-tested module.

### Leaderboard rules

`calculateLeaderboard` (in `storage.ts`) includes only players with `gamesPlayed > 0`, sorts by `averageGuesses` ascending, and returns the top 10.

### Types

All shared types are centralized in `src/types/index.ts` (`Player`, `Game`, `LeaderboardEntry`, `GameStatus`, `GuessResult`). Import from there rather than redefining.

## Conventions

- Path alias `@` → `src/` is configured for Vitest; prefer relative imports for app code to match the existing codebase.
- Tests are colocated with source as `*.test.ts(x)`; broader flows live in `src/__tests__/`. Test env is `jsdom` with `@testing-library/react`; global setup in `src/test/setup.ts`.
- Styling is Tailwind CSS v4 (via `@tailwindcss/vite`) with a purple-pink gradient / dark theme; animations use Framer Motion.
- `Math.random()` in `generateRandomNumber` is intentional and annotated (`NOSONAR`) — it is not a security issue for this game; don't "fix" it.
