import type { Game, Player } from '../types';

export interface GameSummary {
  totalGuesses: number;
  gamesUnder5: number;
  perfectGames: number;
}

export interface Streaks {
  currentStreak: number;
  bestStreak: number;
}

export type PerformanceTier = 'best' | 'good' | 'normal';

const completedTime = (game: Game): number => new Date(game.completedAt ?? 0).getTime();

/** A player's completed games, most recently completed first. */
export const getCompletedGames = (games: Game[], playerId: string): Game[] =>
  games
    .filter((game) => game.playerId === playerId && game.isComplete)
    .sort((a, b) => completedTime(b) - completedTime(a));

export const summarizeGames = (games: Game[]): GameSummary => {
  let totalGuesses = 0;
  let gamesUnder5 = 0;
  let perfectGames = 0;

  for (const { guesses } of games) {
    totalGuesses += guesses.length;
    if (guesses.length <= 5) gamesUnder5++;
    if (guesses.length === 1) perfectGames++;
  }

  return { totalGuesses, gamesUnder5, perfectGames };
};

/**
 * Streaks of games won in no more than `avgGuesses` guesses.
 * `games` must be ordered most recent first, so the current streak is the leading run.
 */
export const calculateStreaks = (games: Game[], avgGuesses: number): Streaks => {
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (const game of games) {
    if (game.guesses.length <= avgGuesses) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }
  }
  if (currentStreak === 0) currentStreak = tempStreak;

  return { currentStreak, bestStreak };
};

/** How a single game's guess count compares with the player's record. */
export const getPerformanceTier = (
  guessCount: number,
  player: Pick<Player, 'bestGame' | 'averageGuesses'>
): PerformanceTier => {
  if (guessCount <= player.bestGame) return 'best';
  if (guessCount <= player.averageGuesses) return 'good';
  return 'normal';
};

/** Percentage of games played that were won, rounded to the nearest integer. */
export const calculateWinRate = (player: Pick<Player, 'gamesPlayed' | 'gamesWon'>): number =>
  player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;

/** Average guesses to one decimal place, or `fallback` when the player has no wins yet. */
export const formatAverage = (averageGuesses: number, fallback = '-'): string =>
  averageGuesses > 0 ? averageGuesses.toFixed(1) : fallback;
