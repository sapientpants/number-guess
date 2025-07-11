import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuessHistory } from './GuessHistory';
import { useGameStore } from '../../store/gameStore';
import { GuessResult } from '../../types';

vi.mock('../../store/gameStore');

describe('GuessHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no guesses have been made', () => {
    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GuessHistory />);

    expect(screen.getByText('No guesses yet')).toBeInTheDocument();
    expect(screen.getByText('Enter a number between 1 and 100')).toBeInTheDocument();
  });

  describe('feedback text display', () => {
    it('should display "↓ Too High" for too-high feedback', () => {
      const guessResults: GuessResult[] = [
        {
          guess: 75,
          feedback: 'too-high',
          distance: 'cold',
          difference: 25,
        },
      ];

      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 50,
        guesses: [75],
        gameStatus: 'playing',
        guessResults,
        makeGuess: vi.fn(),
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessHistory />);

      expect(screen.getByText('↓ Too High')).toBeInTheDocument();
    });

    it('should display "↑ Too Low" for too-low feedback', () => {
      const guessResults: GuessResult[] = [
        {
          guess: 25,
          feedback: 'too-low',
          distance: 'cold',
          difference: 25,
        },
      ];

      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 50,
        guesses: [25],
        gameStatus: 'playing',
        guessResults,
        makeGuess: vi.fn(),
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessHistory />);

      expect(screen.getByText('↑ Too Low')).toBeInTheDocument();
    });

    it('should display "🎯 Correct!" for correct feedback', () => {
      const guessResults: GuessResult[] = [
        {
          guess: 50,
          feedback: 'correct',
          distance: 'hot',
          difference: 0,
        },
      ];

      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 50,
        guesses: [50],
        gameStatus: 'won',
        guessResults,
        makeGuess: vi.fn(),
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessHistory />);

      expect(screen.getByText('🎯 Correct!')).toBeInTheDocument();
    });
  });

  it('should display multiple guesses in reverse order', () => {
    const guessResults: GuessResult[] = [
      {
        guess: 25,
        feedback: 'too-low',
        distance: 'cold',
        difference: 25,
      },
      {
        guess: 75,
        feedback: 'too-high',
        distance: 'cold',
        difference: 25,
      },
      {
        guess: 50,
        feedback: 'correct',
        distance: 'hot',
        difference: 0,
      },
    ];

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 50,
      guesses: [25, 75, 50],
      gameStatus: 'won',
      guessResults,
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GuessHistory />);

    const guessElements = screen.getAllByText(/^\d+$/);
    // Should be in reverse order (most recent first)
    expect(guessElements[0]).toHaveTextContent('50');
    expect(guessElements[1]).toHaveTextContent('75');
    expect(guessElements[2]).toHaveTextContent('25');
  });

  it('should display correct distance text', () => {
    const guessResults: GuessResult[] = [
      {
        guess: 50,
        feedback: 'correct',
        distance: 'hot',
        difference: 0,
      },
      {
        guess: 48,
        feedback: 'too-low',
        distance: 'hot',
        difference: 2,
      },
    ];

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 50,
      guesses: [48, 50],
      gameStatus: 'won',
      guessResults,
      makeGuess: vi.fn(),
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: vi.fn().mockReturnValue([]),
    });

    render(<GuessHistory />);

    expect(screen.getByText('Perfect!')).toBeInTheDocument();
    expect(screen.getByText('hot')).toBeInTheDocument();
  });
});
