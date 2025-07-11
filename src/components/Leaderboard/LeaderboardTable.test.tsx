import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { usePlayerStore } from '../../store/playerStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Player } from '../../types';

vi.mock('../../store/leaderboardStore');
vi.mock('../../store/playerStore');
vi.mock('../../hooks/useMediaQuery');

describe('LeaderboardTable', () => {
  const mockUpdateLeaderboard = vi.fn();
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Alice',
      lastPlayed: new Date(),
      gamesPlayed: 10,
      totalGuesses: 50,
      bestGame: 3,
      averageGuesses: 5,
      gamesWon: 10,
    },
    {
      id: 'player2',
      name: 'Bob',
      lastPlayed: new Date(),
      gamesPlayed: 8,
      totalGuesses: 32,
      bestGame: 2,
      averageGuesses: 4,
      gamesWon: 8,
    },
    {
      id: 'player3',
      name: 'Charlie',
      lastPlayed: new Date(),
      gamesPlayed: 5,
      totalGuesses: 30,
      bestGame: 4,
      averageGuesses: 6,
      gamesWon: 4,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMediaQuery).mockReturnValue(true); // Desktop by default
  });

  it('should display empty state when no players exist', () => {
    vi.mocked(useLeaderboardStore).mockReturnValue({
      entries: [],
      updateLeaderboard: mockUpdateLeaderboard,
    });

    vi.mocked(usePlayerStore).mockReturnValue({
      players: [],
      currentPlayer: null,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    render(<LeaderboardTable />);

    expect(screen.getByText('No players yet. Be the first to play!')).toBeInTheDocument();
  });

  describe('medal emoji display', () => {
    beforeEach(() => {
      const leaderboardEntries = [
        { playerId: 'player2', playerName: 'Bob', averageGuesses: 4, gamesPlayed: 8 },
        { playerId: 'player1', playerName: 'Alice', averageGuesses: 5, gamesPlayed: 10 },
        { playerId: 'player3', playerName: 'Charlie', averageGuesses: 6, gamesPlayed: 5 },
      ];

      vi.mocked(useLeaderboardStore).mockReturnValue({
        entries: leaderboardEntries,
        updateLeaderboard: mockUpdateLeaderboard,
      });

      vi.mocked(usePlayerStore).mockReturnValue({
        players: mockPlayers,
        currentPlayer: mockPlayers[0],
        createPlayer: vi.fn(),
        setCurrentPlayer: vi.fn(),
        updatePlayerStats: vi.fn(),
        clearCurrentPlayer: vi.fn(),
      });
    });

    it('should display gold medal for first place', () => {
      render(<LeaderboardTable />);

      const firstPlaceEntry = screen.getByText('1. 🥇');
      expect(firstPlaceEntry).toBeInTheDocument();
      // Bob should be first with average of 4
      expect(firstPlaceEntry.closest('div')).toHaveTextContent('Bob');
    });

    it('should display silver medal for second place', () => {
      render(<LeaderboardTable />);

      const secondPlaceEntry = screen.getByText('2. 🥈');
      expect(secondPlaceEntry).toBeInTheDocument();
      // Alice should be second with average of 5
      expect(secondPlaceEntry.closest('div')).toHaveTextContent('Alice');
    });

    it('should display bronze medal for third place', () => {
      render(<LeaderboardTable />);

      const thirdPlaceEntry = screen.getByText('3. 🥉');
      expect(thirdPlaceEntry).toBeInTheDocument();
      // Charlie should be third with average of 6
      expect(thirdPlaceEntry.closest('div')).toHaveTextContent('Charlie');
    });
  });

  it('should highlight current player entry', () => {
    const leaderboardEntries = [
      { playerId: 'player1', playerName: 'Alice', averageGuesses: 5, gamesPlayed: 10 },
      { playerId: 'player2', playerName: 'Bob', averageGuesses: 4, gamesPlayed: 8 },
    ];

    vi.mocked(useLeaderboardStore).mockReturnValue({
      entries: leaderboardEntries,
      updateLeaderboard: mockUpdateLeaderboard,
    });

    vi.mocked(usePlayerStore).mockReturnValue({
      players: mockPlayers.slice(0, 2),
      currentPlayer: mockPlayers[0], // Alice is current player
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    render(<LeaderboardTable />);

    // Find Alice's entry
    const aliceEntries = screen.getAllByText('Alice');
    const aliceEntry = aliceEntries[0]?.closest('[class*="bg-purple"]');
    expect(aliceEntry).toHaveClass('bg-purple-900/30');

    // Bob's entry should not have purple background
    const bobEntries = screen.getAllByText('Bob');
    const bobEntry = bobEntries[0]?.closest('[class*="bg-gray"]');
    expect(bobEntry).toHaveClass('bg-gray-800/30');
  });

  it('should show (You) indicator for current player', () => {
    const leaderboardEntries = [
      { playerId: 'player1', playerName: 'Alice', averageGuesses: 5, gamesPlayed: 10 },
    ];

    vi.mocked(useLeaderboardStore).mockReturnValue({
      entries: leaderboardEntries,
      updateLeaderboard: mockUpdateLeaderboard,
    });

    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayers[0]],
      currentPlayer: mockPlayers[0],
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    render(<LeaderboardTable />);

    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('should display average guesses with one decimal place', () => {
    const leaderboardEntries = [
      { playerId: 'player1', playerName: 'Alice', averageGuesses: 5.333333, gamesPlayed: 10 },
    ];

    vi.mocked(useLeaderboardStore).mockReturnValue({
      entries: leaderboardEntries,
      updateLeaderboard: mockUpdateLeaderboard,
    });

    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayers[0]],
      currentPlayer: null,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    render(<LeaderboardTable />);

    // Find the average guess value
    const avgGuessElements = screen.getAllByText('5.3');
    expect(avgGuessElements.length).toBeGreaterThan(0);
  });
});
