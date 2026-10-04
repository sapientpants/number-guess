import { describe, it, expect, beforeEach } from 'vitest';
import { useLeaderboardStore } from './leaderboardStore';
import { usePlayerStore } from './playerStore';
import type { Player } from '../types';

const player = (id: string, averageGuesses: number, gamesPlayed = 1): Player => ({
  id,
  name: id,
  gamesPlayed,
  gamesWon: gamesPlayed,
  totalGuesses: averageGuesses * gamesPlayed,
  bestGame: averageGuesses,
  averageGuesses,
  lastPlayed: new Date('2026-01-01T00:00:00.000Z'),
});

describe('leaderboardStore', () => {
  beforeEach(() => {
    useLeaderboardStore.setState({ entries: [] });
    usePlayerStore.setState({ players: [], currentPlayer: null });
  });

  it('derives entries from the player store', () => {
    usePlayerStore.setState({
      players: [player('slow', 8), player('fast', 4), player('new', 0, 0)],
    });

    useLeaderboardStore.getState().updateLeaderboard();

    expect(useLeaderboardStore.getState().entries.map((e) => [e.playerId, e.rank])).toEqual([
      ['fast', 1],
      ['slow', 2],
    ]);
  });

  it('looks up a player rank', () => {
    usePlayerStore.setState({ players: [player('a', 3), player('b', 5)] });
    const store = useLeaderboardStore.getState();
    store.updateLeaderboard();

    expect(useLeaderboardStore.getState().getPlayerRank('b')).toBe(2);
    expect(useLeaderboardStore.getState().getPlayerRank('missing')).toBeNull();
  });
});
