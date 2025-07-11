import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameStats } from './GameStats';
import { useGameStore } from '../../store/gameStore';
import { usePlayerStore } from '../../store/playerStore';

// Mock the stores
vi.mock('../../store/gameStore');
vi.mock('../../store/playerStore');

describe('GameStats', () => {
  const mockUseGameStore = vi.mocked(useGameStore);
  const mockUsePlayerStore = vi.mocked(usePlayerStore);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayerStore.mockReturnValue({
      currentPlayer: { bestGame: 5 },
    });
  });

  it('should display initial range 1-100 with no guesses', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [],
      guessResults: [],
      gameStatus: 'playing',
    });

    render(<GameStats />);

    expect(screen.getByText('1 - 100')).toBeInTheDocument();
  });

  it('should narrow range when guess is too high', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [50],
      guessResults: [{ feedback: 'too-high', distance: 'warm' }],
      gameStatus: 'playing',
    });

    render(<GameStats />);

    // Range should be 1-49 after guessing 50 (too high)
    expect(screen.getByText('1 - 49')).toBeInTheDocument();
  });

  it('should narrow range when guess is too low', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [30],
      guessResults: [{ feedback: 'too-low', distance: 'warm' }],
      gameStatus: 'playing',
    });

    render(<GameStats />);

    // Range should be 31-100 after guessing 30 (too low)
    expect(screen.getByText('31 - 100')).toBeInTheDocument();
  });

  it('should narrow range with multiple guesses', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [50, 25, 35],
      guessResults: [
        { feedback: 'too-high', distance: 'cold' },
        { feedback: 'too-low', distance: 'warm' },
        { feedback: 'too-low', distance: 'hot' },
      ],
      gameStatus: 'playing',
    });

    render(<GameStats />);

    // Range should be 36-49 after:
    // 50 too high -> 1-49
    // 25 too low -> 26-49
    // 35 too low -> 36-49
    expect(screen.getByText('36 - 49')).toBeInTheDocument();
  });

  it('should not display range when game is won', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [50, 40],
      guessResults: [
        { feedback: 'too-high', distance: 'warm' },
        { feedback: 'correct', distance: 'exact' },
      ],
      gameStatus: 'won',
    });

    render(<GameStats />);

    // Range should not be displayed when game is won
    expect(screen.queryByText('Range')).not.toBeInTheDocument();
  });

  it('should handle edge cases for range boundaries', () => {
    mockUseGameStore.mockReturnValue({
      guesses: [99, 2],
      guessResults: [
        { feedback: 'too-high', distance: 'cold' },
        { feedback: 'too-low', distance: 'cold' },
      ],
      gameStatus: 'playing',
    });

    render(<GameStats />);

    // Range should be 3-98 after:
    // 99 too high -> 1-98
    // 2 too low -> 3-98
    expect(screen.getByText('3 - 98')).toBeInTheDocument();
  });
});
