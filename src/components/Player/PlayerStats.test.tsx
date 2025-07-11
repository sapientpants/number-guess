import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerStats } from './PlayerStats';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import { Game, Player } from '../../types';

vi.mock('../../store/playerStore');
vi.mock('../../store/gameStore');

describe('PlayerStats', () => {
  const mockLoadGameHistory = vi.fn();
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    lastPlayed: new Date(),
    gamesPlayed: 10,
    gamesWon: 10,
    totalGuesses: 50,
    bestGame: 3,
    averageGuesses: 5,
  };

  const createGame = (id: string, guesses: number[], daysAgo: number = 0): Game => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id,
      playerId: 'player1',
      targetNumber: 42,
      guesses,
      startedAt: date,
      isComplete: true,
      completedAt: date,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when there is no current player', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [],
      currentPlayer: null,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: mockLoadGameHistory,
    });

    const { container } = render(<PlayerStats />);
    expect(container.firstChild).toBeNull();
  });

  describe('performance text color classes', () => {
    beforeEach(() => {
      vi.mocked(usePlayerStore).mockReturnValue({
        players: [mockPlayer],
        currentPlayer: mockPlayer,
        createPlayer: vi.fn(),
        setCurrentPlayer: vi.fn(),
        updatePlayerStats: vi.fn(),
        clearCurrentPlayer: vi.fn(),
      });

      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [],
        gameStatus: 'idle',
        guessResults: [],
        makeGuess: vi.fn(),
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: mockLoadGameHistory,
      });
    });

    it('should apply green text color for games at or below best game', () => {
      const games = [
        createGame('game1', [1, 2, 3], 0), // 3 guesses = best game
        createGame('game2', [1, 2], 1), // 2 guesses < best game
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<PlayerStats />);

      // Find the guess count elements
      const guessElements = screen.getAllByText(/\d+ guesses?/);
      expect(guessElements[0]).toHaveClass('text-green-400');
      expect(guessElements[1]).toHaveClass('text-green-400');
    });

    it('should apply yellow text color for games between best and average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4], 0), // 4 guesses
        createGame('game2', [1, 2, 3, 4, 5], 1), // 5 guesses = average
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<PlayerStats />);

      const guessElements = screen.getAllByText(/\d+ guesses?/);
      expect(guessElements[0]).toHaveClass('text-yellow-400');
      expect(guessElements[1]).toHaveClass('text-yellow-400');
    });

    it('should apply gray text color for games above average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4, 5, 6], 0), // 6 guesses
        createGame('game2', [1, 2, 3, 4, 5, 6, 7], 1), // 7 guesses
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<PlayerStats />);

      const guessElements = screen.getAllByText(/\d+ guesses?/);
      expect(guessElements[0]).toHaveClass('text-gray-400');
      expect(guessElements[1]).toHaveClass('text-gray-400');
    });
  });

  it('should display performance trend correctly', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: mockLoadGameHistory,
    });

    // Recent games (better performance)
    const recentGames = [
      createGame('game1', [1, 2, 3], 0),
      createGame('game2', [1, 2, 3], 1),
      createGame('game3', [1, 2, 3], 2),
      createGame('game4', [1, 2, 3], 3),
      createGame('game5', [1, 2, 3], 4),
    ];

    // Older games (worse performance)
    const olderGames = [
      createGame('game6', [1, 2, 3, 4, 5, 6], 5),
      createGame('game7', [1, 2, 3, 4, 5, 6], 6),
      createGame('game8', [1, 2, 3, 4, 5, 6], 7),
      createGame('game9', [1, 2, 3, 4, 5, 6], 8),
      createGame('game10', [1, 2, 3, 4, 5, 6], 9),
    ];

    mockLoadGameHistory.mockReturnValue([...recentGames, ...olderGames]);

    render(<PlayerStats />);

    // Recent average: 3, Older average: 6
    // Improvement: ((6 - 3) / 6) * 100 = 50%
    expect(screen.getByText('Performance Trend')).toBeInTheDocument();
    expect(screen.getByText('↑ 50%')).toBeInTheDocument();
    expect(screen.getByText('improving')).toBeInTheDocument();
  });

  it('should show only last 10 games', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: mockLoadGameHistory,
    });

    // Create 15 games
    const games = Array.from({ length: 15 }, (_, i) => createGame(`game${i}`, [1, 2, 3], i));
    mockLoadGameHistory.mockReturnValue(games);

    render(<PlayerStats />);

    // Should only show 10 games
    const guessElements = screen.getAllByText(/\d+ guesses?/);
    expect(guessElements).toHaveLength(10);
  });

  it('should handle single guess correctly', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: mockLoadGameHistory,
    });

    const games = [createGame('game1', [42])]; // Perfect guess
    mockLoadGameHistory.mockReturnValue(games);

    render(<PlayerStats />);

    expect(screen.getByText('1 guesses')).toBeInTheDocument();
  });
});
