import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameHistory } from './GameHistory';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';
import { Game, Player } from '../../types';

vi.mock('../../store/gameStore');
vi.mock('../../store/playerStore');

describe('GameHistory', () => {
  const mockLoadGameHistory = vi.fn();
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    lastPlayed: new Date(),
    gamesPlayed: 5,
    gamesWon: 5,
    totalGuesses: 25,
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

  it('should not render when there is no current player', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [],
      currentPlayer: null,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    const { container } = render(<GameHistory />);
    expect(container.firstChild).toBeNull();
  });

  it('should show empty state when player has no completed games', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    mockLoadGameHistory.mockReturnValue([]);

    render(<GameHistory />);
    expect(
      screen.getByText('No completed games yet. Play a game to see your history!')
    ).toBeInTheDocument();
  });

  describe('performance color classes', () => {
    beforeEach(() => {
      vi.mocked(usePlayerStore).mockReturnValue({
        players: [mockPlayer],
        currentPlayer: mockPlayer,
        createPlayer: vi.fn(),
        setCurrentPlayer: vi.fn(),
        updatePlayerStats: vi.fn(),
        clearCurrentPlayer: vi.fn(),
      });
    });

    it('should show green color for games at or below best game', () => {
      const games = [
        createGame('game1', [1, 2, 3]), // 3 guesses = best game
        createGame('game2', [1, 2]), // 2 guesses < best game
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameHistory />);

      const guessTexts = screen.getAllByText(/\d+ guess(es)?/);
      expect(guessTexts[0]).toHaveClass('text-green-400');
      expect(guessTexts[1]).toHaveClass('text-green-400');
    });

    it('should show yellow color for games between best and average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4]), // 4 guesses (between best:3 and avg:5)
        createGame('game2', [1, 2, 3, 4, 5]), // 5 guesses = average
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameHistory />);

      const guessTexts = screen.getAllByText(/\d+ guess(es)?/);
      expect(guessTexts[0]).toHaveClass('text-yellow-400');
      expect(guessTexts[1]).toHaveClass('text-yellow-400');
    });

    it('should show gray color for games above average', () => {
      const games = [
        createGame('game1', [1, 2, 3, 4, 5, 6]), // 6 guesses > average
        createGame('game2', [1, 2, 3, 4, 5, 6, 7, 8]), // 8 guesses > average
      ];
      mockLoadGameHistory.mockReturnValue(games);

      render(<GameHistory />);

      const guessTexts = screen.getAllByText(/\d+ guess(es)?/);
      expect(guessTexts[0]).toHaveClass('text-gray-300');
      expect(guessTexts[1]).toHaveClass('text-gray-300');
    });
  });

  it('should format game duration correctly', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    const now = new Date();
    const game: Game = {
      id: 'game1',
      playerId: 'player1',
      targetNumber: 42,
      guesses: [1, 2, 3],
      startedAt: new Date(now.getTime() - 65000), // 65 seconds ago
      isComplete: true,
      completedAt: now,
    };
    mockLoadGameHistory.mockReturnValue([game]);

    render(<GameHistory />);

    expect(screen.getByText('1m 5s')).toBeInTheDocument();
  });

  it('should handle ambiguous spacing correctly', () => {
    vi.mocked(usePlayerStore).mockReturnValue({
      players: [mockPlayer],
      currentPlayer: mockPlayer,
      createPlayer: vi.fn(),
      setCurrentPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      clearCurrentPlayer: vi.fn(),
    });

    const games = [createGame('game1', [1, 2, 3])];
    mockLoadGameHistory.mockReturnValue(games);

    render(<GameHistory />);

    // Check that "Game History" text has proper spacing
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.textContent).toMatch(/Game History\s+\(1 game\)/);
  });
});
