import { describe, it, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
  calculateStreaks,
  calculateWinRate,
  formatAverage,
  getCompletedGames,
  getPerformanceTier,
  summarizeGames,
} from './insights';
import type { Game } from '../types';

let nextId = 0;
const game = (guessCount: number, overrides: Partial<Game> = {}): Game => ({
  id: `game-${nextId++}`,
  playerId: 'player-1',
  targetNumber: 50,
  guesses: Array.from({ length: guessCount }, (_, i) => i + 1),
  isComplete: true,
  startedAt: new Date('2026-01-01T00:00:00.000Z'),
  completedAt: new Date('2026-01-01T00:01:00.000Z'),
  ...overrides,
});

describe('getCompletedGames', () => {
  it("returns only the player's completed games, newest first", () => {
    const older = game(3, { completedAt: new Date('2026-01-01T00:00:00.000Z') });
    const newer = game(4, { completedAt: new Date('2026-02-01T00:00:00.000Z') });
    const otherPlayer = game(2, { playerId: 'player-2' });
    const { completedAt: _unused, ...inProgressBase } = game(1, { isComplete: false });

    expect(getCompletedGames([older, otherPlayer, inProgressBase, newer], 'player-1')).toEqual([
      newer,
      older,
    ]);
  });
});

describe('summarizeGames', () => {
  it('counts totals, games under five guesses and perfect games', () => {
    expect(summarizeGames([game(1), game(5), game(6), game(1)])).toEqual({
      totalGuesses: 13,
      gamesUnder5: 3,
      perfectGames: 2,
    });
  });

  it('handles no games', () => {
    expect(summarizeGames([])).toEqual({ totalGuesses: 0, gamesUnder5: 0, perfectGames: 0 });
  });
});

describe('calculateStreaks', () => {
  it('reports the leading run as the current streak', () => {
    // newest first: 3 good, 1 bad, 4 good
    const games = [3, 3, 3, 9, 2, 2, 2, 2].map((n) => game(n));
    expect(calculateStreaks(games, 5)).toEqual({ currentStreak: 3, bestStreak: 4 });
  });

  it('treats an unbroken run as both current and best', () => {
    expect(calculateStreaks([game(1), game(2)], 5)).toEqual({ currentStreak: 2, bestStreak: 2 });
  });

  it('returns zeros when no game meets the average', () => {
    expect(calculateStreaks([game(9), game(9)], 5)).toEqual({ currentStreak: 0, bestStreak: 0 });
  });

  test.prop([fc.array(fc.integer({ min: 1, max: 20 })), fc.integer({ min: 1, max: 20 })])(
    'current streak never exceeds best streak or the number of games',
    (guessCounts, average) => {
      const { currentStreak, bestStreak } = calculateStreaks(
        guessCounts.map((n) => game(n)),
        average
      );
      expect(bestStreak).toBeLessThanOrEqual(guessCounts.length);
      expect(currentStreak).toBeLessThanOrEqual(bestStreak);
    }
  );
});

describe('getPerformanceTier', () => {
  const player = { bestGame: 3, averageGuesses: 6 };

  it.each([
    [2, 'best'],
    [3, 'best'],
    [5, 'good'],
    [6, 'good'],
    [7, 'normal'],
  ] as const)('%i guesses is %s', (guesses, tier) => {
    expect(getPerformanceTier(guesses, player)).toBe(tier);
  });
});

describe('calculateWinRate', () => {
  it.each([
    [0, 0, 0],
    [10, 0, 0],
    [4, 4, 100],
    [3, 1, 33],
    [3, 2, 67],
  ])('%i played / %i won => %i%%', (gamesPlayed, gamesWon, expected) => {
    expect(calculateWinRate({ gamesPlayed, gamesWon })).toBe(expected);
  });
});

describe('formatAverage', () => {
  it('formats to one decimal place', () => {
    expect(formatAverage(2.25)).toBe('2.3');
  });

  it('uses the fallback when there is no average yet', () => {
    expect(formatAverage(0)).toBe('-');
    expect(formatAverage(0, 'N/A')).toBe('N/A');
  });
});
