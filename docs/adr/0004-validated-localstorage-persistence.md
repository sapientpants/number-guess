# 4. Validate everything loaded from `localStorage`

- Status: Accepted
- Date: 2026-10-04

## Context

All data persists to `localStorage`. Previously, loaded JSON was cast straight to `Player[]` /
`Game[]`. Stored data can be corrupted, hand-edited, written by an older version of the app
(e.g. players saved before `gamesWon` existed), or storage can be full or disabled entirely, in
which case `localStorage` methods throw.

## Decision

- `src/utils/storage.ts` remains the only module that touches `localStorage`.
- Every loaded record passes through a parser (`parsePlayer`, `parseGame`) that validates field
  types and rehydrates dates.
- A player is dropped only if it can't be identified (missing id or name). Invalid or missing
  stats are reset to 0 instead, because the filtered list is written back on the next save, so
  dropping a player would permanently delete them. Malformed games are dropped.
- Legacy records are normalized at this boundary (missing `gamesWon` becomes `0`; an empty
  current-player id means "none"), so the rest of the app can trust its types.
- Reads and writes never throw: if storage is unavailable the game keeps working in memory.
- Validation uses small hand-written type guards rather than a schema library, keeping the
  production bundle small for two simple record types.

## Consequences

- New persisted fields must be added to the matching parser, with a default if older data may
  lack them.
- Property-based tests assert that parsers never throw and that valid data round-trips.
