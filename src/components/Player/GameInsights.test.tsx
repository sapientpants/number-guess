import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameInsights } from './GameInsights';
import { usePlayerStore } from '../../store/playerStore';
import { useGameStore } from '../../store/gameStore';
import { Game, Player } from '../../types';

vi.mock('../../store/playerStore');
vi.mock('../../store/gameStore');

describe('GameInsights', () => {
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

  const createGame = (id: string, guesses: number[]): Game => ({
    id,
    playerId: 'player1',
    targetNumber: 42,
    guesses,
    startedAt: new Date(),
    isComplete: true,
    completedAt: new Date(),
  });

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

    const { container } = render(<GameInsights />);
    expect(container.firstChild).toBeNull();
  });

  describe('performance background classes', () => {
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

    it('should apply green background for games at or below best game', () => {
      const games = [
        createGame('game1', [1, 2, 3]), // 3 guesses = best game
        createGame('game2', [1, 2]), // 2 guesses < best game
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      // Look for the Last 5 Games section
      const lastGamesSection = screen.getByText('Last 5 Games').closest('[class*="rounded-xl"]');
      const greenEntries = lastGamesSection?.querySelectorAll('[class*="bg-green-900/20"]');

      expect(greenEntries).toHaveLength(2);
    });

    it('should apply yellow background for games between best and average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4]), // 4 guesses
        createGame('game2', [1, 2, 3, 4, 5]), // 5 guesses = average
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      const lastGamesSection = screen.getByText('Last 5 Games').closest('[class*="rounded-xl"]');
      const yellowEntries = lastGamesSection?.querySelectorAll('[class*="bg-yellow-900/20"]');

      expect(yellowEntries).toHaveLength(2);
    });

    it('should apply gray background for games above average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4, 5, 6]), // 6 guesses
        createGame('game2', [1, 2, 3, 4, 5, 6, 7]), // 7 guesses
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      const lastGamesSection = screen.getByText('Last 5 Games').closest('[class*="rounded-xl"]');
      const grayEntries = lastGamesSection?.querySelectorAll('[class*="bg-gray-800/30"]');

      expect(grayEntries).toHaveLength(2);
    });
  });

  describe('streak calculations', () => {
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

    it('should calculate current streak correctly', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4, 5]), // 5 guesses = average (good)
        createGame('game2', [1, 2, 3, 4]), // 4 guesses < average (good)
        createGame('game3', [1, 2, 3]), // 3 guesses < average (good)
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      // Current streak should be 3 - it shows because it's > 2
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      // Find the current streak value within the stats grid
      const currentStreakCard = screen.getByText('Current Streak').closest('.text-center');
      expect(currentStreakCard).toBeTruthy();
      const streakValue = currentStreakCard?.querySelector('.text-lg.font-bold.text-purple-400');
      expect(streakValue).toHaveTextContent('3');
    });

    it('should calculate best streak correctly', () => {
      // Create games that will produce a best streak > 3
      const games = [
        createGame('game1', [1, 2, 3, 4, 5, 6, 7]), // 7 guesses > average (breaks streak)
        createGame('game2', [1, 2, 3, 4, 5]), // 5 guesses = average (good)
        createGame('game3', [1, 2, 3, 4]), // 4 guesses < average (good)
        createGame('game4', [1, 2, 3]), // 3 guesses < average (good)
        createGame('game5', [1, 2]), // 2 guesses < average (good)
        createGame('game6', [1, 2, 3, 4]), // 4 guesses < average (good)
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      // Games are sorted newest first, so when processed:
      // game1(7) - bad (breaks), then game2(5), game3(4), game4(3), game5(2), game6(4) - all good
      // This creates a streak of 5 games, which should show as best streak

      // Best streak is 5, which shows because it's > 3
      expect(screen.getByText('Best Streak')).toBeInTheDocument();
      const bestStreakCard = screen.getByText('Best Streak').closest('.text-center');
      expect(bestStreakCard).toBeTruthy();
      const streakValue = bestStreakCard?.querySelector('.text-lg.font-bold.text-blue-400');
      expect(streakValue).toHaveTextContent('5');
    });

    it('should handle no good games (zero streaks)', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4, 5, 6, 7]), // 7 guesses > average
        createGame('game2', [1, 2, 3, 4, 5, 6, 7, 8]), // 8 guesses > average
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameInsights />);

      // Both streaks are 0, so they won't be shown (only show if current > 2 or best > 3)
      expect(screen.queryByText('Current Streak')).not.toBeInTheDocument();
      expect(screen.queryByText('Best Streak')).not.toBeInTheDocument();

      // The stats grid should be empty since no conditions are met
      const statsGrid = screen.getByText('Game Insights').nextElementSibling;
      expect(statsGrid?.children.length).toBe(0);
    });
  });

  it('should display perfect games count', () => {
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

    const games = [
      createGame('game1', [42]), // 1 guess = perfect
      createGame('game2', [1, 2, 3]),
      createGame('game3', [42]), // 1 guess = perfect
    ];
    mockLoadGameHistory.mockReturnValue(games);

    render(<GameInsights />);

    expect(screen.getByText('Perfect Games')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display current game progress when game is active', () => {
    const currentGame: Game = {
      id: 'current',
      playerId: 'player1',
      targetNumber: 42,
      guesses: [1, 2, 3],
      startedAt: new Date(),
      isComplete: false,
    };

    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    vi.mocked(useGameStore).mockReturnValue({
      currentGame,
      targetNumber: 42,
      guesses: [1, 2, 3],
      gameStatus: 'playing',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GameInsights />);

    expect(screen.getByText('Current Game')).toBeInTheDocument();
    expect(screen.getByText('3 guesses')).toBeInTheDocument();
    expect(screen.getByText('✨ On track for a good game!')).toBeInTheDocument();
  });
});
