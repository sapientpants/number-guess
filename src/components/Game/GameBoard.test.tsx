import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { GameBoard } from './GameBoard';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';

// Mock the stores
vi.mock('../../store/gameStore');
vi.mock('../../store/playerStore');

describe('GameBoard', () => {
  const mockUseGameStore = vi.mocked(useGameStore);
  const mockUsePlayerStore = vi.mocked(usePlayerStore);

  const mockUpdatePlayerStats = vi.fn();
  const mockResetGame = vi.fn();
  const mockStartNewGame = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsePlayerStore.mockReturnValue({
      currentPlayer: { id: 'player-1', name: 'Alice', bestGame: 5 },
      updatePlayerStats: mockUpdatePlayerStats,
    });
  });

  it('should only update player stats once when game is won', () => {
    const currentGame = {
      id: 'game-1',
      playerId: 'player-1',
      targetNumber: 42,
      guesses: [50, 25, 35, 42],
      isComplete: true,
      startedAt: new Date(),
      completedAt: new Date(),
    };

    // Start with playing state
    mockUseGameStore.mockReturnValue({
      gameStatus: 'playing',
      currentGame,
      guesses: [50, 25, 35],
      guessResults: [],
      startNewGame: mockStartNewGame,
      resetGame: mockResetGame,
    });

    const { rerender } = render(<GameBoard />);

    // Verify stats not updated during play
    expect(mockUpdatePlayerStats).not.toHaveBeenCalled();

    // Update to won state
    mockUseGameStore.mockReturnValue({
      gameStatus: 'won',
      currentGame,
      guesses: [50, 25, 35, 42],
      guessResults: [],
      startNewGame: mockStartNewGame,
      resetGame: mockResetGame,
    });

    rerender(<GameBoard />);

    // Should update stats exactly once
    expect(mockUpdatePlayerStats).toHaveBeenCalledTimes(1);
    expect(mockUpdatePlayerStats).toHaveBeenCalledWith('player-1', 4);

    // Re-render again to ensure no duplicate calls
    rerender(<GameBoard />);

    // Still should have only been called once
    expect(mockUpdatePlayerStats).toHaveBeenCalledTimes(1);
  });

  it('should not update stats if game is not complete', () => {
    const currentGame = {
      id: 'game-1',
      playerId: 'player-1',
      targetNumber: 42,
      guesses: [50, 25, 35, 42],
      isComplete: false, // Not complete yet
      startedAt: new Date(),
    };

    mockUseGameStore.mockReturnValue({
      gameStatus: 'won',
      currentGame,
      guesses: [50, 25, 35, 42],
      guessResults: [],
      startNewGame: mockStartNewGame,
      resetGame: mockResetGame,
    });

    render(<GameBoard />);

    // Should not update stats if game is not marked complete
    expect(mockUpdatePlayerStats).not.toHaveBeenCalled();
  });
});
