import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';

import type { Player } from '../../types';

// Mock the stores
vi.mock('../../store/gameStore');
vi.mock('../../store/playerStore');

describe('GameBoard', () => {
  const mockUseGameStore = vi.mocked(useGameStore);
  const mockUsePlayerStore = vi.mocked(usePlayerStore);

  const mockResetGame = vi.fn();
  const mockStartNewGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock with complete PlayerStore interface
    const mockPlayer: Player = {
      id: 'player-1',
      name: 'Alice',
      gamesPlayed: 0,
      gamesWon: 0,
      totalGuesses: 0,
      bestGame: 5,
      averageGuesses: 0,
      lastPlayed: new Date(),
    };

    mockUsePlayerStore.mockReturnValue({
      players: [],
      currentPlayer: mockPlayer,
      loadPlayers: vi.fn(),
      createPlayer: vi.fn().mockReturnValue(mockPlayer),
      selectPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      incrementGamesPlayed: vi.fn(),
      getCurrentPlayer: vi.fn().mockReturnValue(mockPlayer),
    });
  });

  it('should render idle state when no game is in progress', () => {
    mockUseGameStore.mockReturnValue({
      gameStatus: 'idle',
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      guessResults: [],
      startNewGame: mockStartNewGame,
      makeGuess: vi.fn(),
      resetGame: mockResetGame,
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GameBoard />);
    expect(screen.getByText('Ready to Play?')).toBeInTheDocument();
  });

  it('should render playing state when game is in progress', () => {
    mockUseGameStore.mockReturnValue({
      gameStatus: 'playing',
      currentGame: {
        id: 'game-1',
        playerId: 'player-1',
        targetNumber: 42,
        guesses: [],
        isComplete: false,
        startedAt: new Date(),
      },
      targetNumber: 42,
      guesses: [],
      guessResults: [],
      startNewGame: mockStartNewGame,
      makeGuess: vi.fn(),
      resetGame: mockResetGame,
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GameBoard />);
    expect(screen.getByText('Number Guessing Game')).toBeInTheDocument();
  });

  it('should render won state when game is won', () => {
    mockUseGameStore.mockReturnValue({
      gameStatus: 'won',
      currentGame: {
        id: 'game-1',
        playerId: 'player-1',
        targetNumber: 42,
        guesses: [42],
        isComplete: true,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      targetNumber: 42,
      guesses: [42],
      guessResults: [],
      startNewGame: mockStartNewGame,
      makeGuess: vi.fn(),
      resetGame: mockResetGame,
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GameBoard />);
    expect(screen.getByText(/Congratulations, Alice!/)).toBeInTheDocument();
  });

  it('should render lost state when game is lost', () => {
    const mockLoadGameHistory = vi.fn().mockReturnValue([]);
    const mockMakeGuess = vi.fn();

    mockUseGameStore.mockReturnValue({
      gameStatus: 'lost',
      currentGame: {
        id: 'game-1',
        playerId: 'player-1',
        targetNumber: 42,
        guesses: [10, 20, 30],
        isComplete: true,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      targetNumber: 42,
      guesses: [10, 20, 30],
      guessResults: [],
      startNewGame: mockStartNewGame,
      makeGuess: mockMakeGuess,
      resetGame: mockResetGame,
      loadGameHistory: mockLoadGameHistory,
    });

    render(<GameBoard />);
    expect(screen.getByText(/Game Over, Alice!/)).toBeInTheDocument();

    // Test handleGiveUp
    const giveUpButton = screen.getByText('Give Up');
    expect(giveUpButton).toBeInTheDocument();
  });

  it('should handle race condition when game is won but no current player', () => {
    mockUseGameStore.mockReturnValue({
      gameStatus: 'won',
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      guessResults: [],
      startNewGame: mockStartNewGame,
      makeGuess: vi.fn(),
      resetGame: mockResetGame,
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    mockUsePlayerStore.mockReturnValue({
      players: [],
      currentPlayer: null,
      loadPlayers: vi.fn(),
      createPlayer: vi.fn(),
      selectPlayer: vi.fn(),
      updatePlayerStats: vi.fn(),
      incrementGamesPlayed: vi.fn(),
      getCurrentPlayer: vi.fn().mockReturnValue(null),
    });

    const { container } = render(<GameBoard />);
    expect(container.firstChild).toBeNull();
  });
});
