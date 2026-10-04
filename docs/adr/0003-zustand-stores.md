# 3. Zustand stores that call each other via `getState()`

- Status: Accepted
- Date: 2026-10-04

## Context

The game needs three pieces of shared state: players and their stats, the game in progress, and
the leaderboard derived from player stats.

## Decision

Use three [Zustand](https://zustand.docs.pmnd.rs/) stores (`playerStore`, `gameStore`,
`leaderboardStore`). Stores coordinate by calling each other's actions through `getState()` rather
than through React, e.g. `gameStore.startNewGame` increments games played on the player store.

The player store is the single source of truth for stats. Win statistics are recorded when the
game board observes a won game; `averageGuesses` is `totalGuesses / gamesWon`, i.e. averaged over
won games only, and `incrementGamesPlayed` deliberately never recomputes it.

## Consequences

- Stores are easy to test in isolation by mocking the stores they depend on.
- Cross-store calls are implicit; they are documented in `CLAUDE.md` and must not form import
  cycles (enforced by madge).
