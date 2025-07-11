import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerProfile } from './PlayerProfile';
import { usePlayerStore } from '../../store/playerStore';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import type { Player } from '../../types';

vi.mock('../../store/playerStore');
vi.mock('../../store/leaderboardStore');

describe('PlayerProfile', () => {
  const mockUpdateLeaderboard = vi.fn();
  const mockGetPlayerRank = vi.fn();

  const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'player-1',
    name: 'Test Player',
    gamesPlayed: 0,
    gamesWon: 0,
    totalGuesses: 0,
    bestGame: 0,
    averageGuesses: 0,
    lastPlayed: new Date(),
    ...overrides,
  });

  const mockPlayerStore = (player: Player) => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [player],
      currentPlayer: player,
      loadPlayers: vi.fn(),
      createPlayer: vi.fn().mockReturnValue(player),
      selectPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      incrementGamesPlayed: vi.fn(),
      getCurrentPlayer: vi.fn().mockReturnValue(player),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLeaderboardStore).mockReturnValue({
      entries: [],
      updateLeaderboard: mockUpdateLeaderboard,
      getPlayerRank: mockGetPlayerRank,
    });
  });

  describe('win rate calculation', () => {
    it('should calculate win rate correctly for players with wins', () => {
      const mockPlayer = createMockPlayer({
        gamesPlayed: 10,
        gamesWon: 7,
        totalGuesses: 105,
        bestGame: 10,
        averageGuesses: 15,
      });

      mockPlayerStore(mockPlayer);

      render(<PlayerProfile />);

      // Win rate should be 70%
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('should show 0% win rate for player with no wins', () => {
      const mockPlayer = {
        id: 'player-2',
        name: 'No Wins Player',
        gamesPlayed: 5,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
        lastPlayed: new Date(),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should calculate 100% win rate when all games are won', () => {
      const mockPlayer = {
        id: 'player-3',
        name: 'Perfect Player',
        gamesPlayed: 15,
        gamesWon: 15,
        totalGuesses: 150,
        bestGame: 5,
        averageGuesses: 10,
        lastPlayed: new Date(),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle edge case of 0 games played', () => {
      const mockPlayer = {
        id: 'player-4',
        name: 'New Player',
        gamesPlayed: 0,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
        lastPlayed: new Date(),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      // Should not show win rate section when no games played
      expect(screen.queryByText('Win Rate')).not.toBeInTheDocument();
    });

    it('should round win rate correctly', () => {
      const testCases = [
        { gamesPlayed: 3, gamesWon: 1, expectedRate: '33%' }, // 33.33...%
        { gamesPlayed: 3, gamesWon: 2, expectedRate: '67%' }, // 66.66...%
        { gamesPlayed: 7, gamesWon: 3, expectedRate: '43%' }, // 42.857...%
        { gamesPlayed: 11, gamesWon: 5, expectedRate: '45%' }, // 45.454...%
      ];

      testCases.forEach(({ gamesPlayed, gamesWon, expectedRate }) => {
        vi.clearAllMocks();

        const mockPlayer = {
          id: 'player-test',
          name: 'Test Player',
          gamesPlayed,
          gamesWon,
          totalGuesses: gamesWon * 15,
          bestGame: 10,
          averageGuesses: 15,
          lastPlayed: new Date(),
        };

        vi.mocked(usePlayerStore).mockReturnValue({
          currentPlayer: mockPlayer,
          players: [mockPlayer],
          selectPlayer: vi.fn(),
        });

        const { unmount } = render(<PlayerProfile />);

        expect(screen.getByText(expectedRate)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('average guesses display', () => {
    it('should display average guesses when player has won games', () => {
      const mockPlayer = {
        id: 'player-5',
        name: 'Average Player',
        gamesPlayed: 5,
        gamesWon: 3,
        totalGuesses: 45,
        bestGame: 10,
        averageGuesses: 15,
        lastPlayed: new Date(),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      expect(screen.getByText('Average Guesses')).toBeInTheDocument();
      expect(screen.getByText('15.0')).toBeInTheDocument();
    });

    it('should show dash when no games won', () => {
      const mockPlayer = {
        id: 'player-6',
        name: 'No Wins Player',
        gamesPlayed: 3,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
        lastPlayed: new Date(),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      const stats = screen.getAllByText('-');
      // Should have dashes for Best Game, Average Guesses, and Leaderboard Rank
      expect(stats.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('stats display', () => {
    it('should display all stats correctly', () => {
      const mockPlayer = {
        id: 'player-7',
        name: 'Stats Player',
        gamesPlayed: 20,
        gamesWon: 15,
        totalGuesses: 225,
        bestGame: 8,
        averageGuesses: 15,
        lastPlayed: new Date('2024-01-15'),
      };

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      mockGetPlayerRank.mockReturnValue(3);

      render(<PlayerProfile />);

      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();

      expect(screen.getByText('Best Game')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      expect(screen.getByText('Average Guesses')).toBeInTheDocument();
      expect(screen.getByText('15.0')).toBeInTheDocument();

      expect(screen.getByText('Leaderboard Rank')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined gamesWon gracefully', () => {
      const mockPlayer = createMockPlayer({
        id: 'player-8',
        name: 'Legacy Player',
        gamesPlayed: 10,
        gamesWon: undefined as unknown as number, // Simulating old data
        totalGuesses: 100,
        bestGame: 10,
        averageGuesses: 10,
      });

      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: mockPlayer,
        players: [mockPlayer],
        selectPlayer: vi.fn(),
      });

      render(<PlayerProfile />);

      // Should treat undefined gamesWon as 0
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should return null when no current player', () => {
      vi.mocked(usePlayerStore).mockReturnValue({
        currentPlayer: null,
        players: [],
        selectPlayer: vi.fn(),
      });

      const { container } = render(<PlayerProfile />);

      expect(container.firstChild).toBeNull();
    });
  });
});
