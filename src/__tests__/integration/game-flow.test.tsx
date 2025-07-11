import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import * as gameLogic from '../../utils/gameLogic';

// Mock game logic to have predictable outcomes
vi.mock('../../utils/gameLogic', async () => {
  const actual = await vi.importActual<typeof gameLogic>('../../utils/gameLogic');
  return {
    ...actual,
    generateRandomNumber: vi.fn().mockReturnValue(50),
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Game Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('complete game flow', () => {
    it('should handle full game flow from player creation to winning', async () => {
      render(<App />);

      // Should show player login initially
      expect(screen.getByText('Welcome to Number Guessing Game')).toBeInTheDocument();

      // Create a new player
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Test Player');
      await userEvent.click(screen.getByText('Start Playing'));

      // Should show game board
      await waitFor(() => {
        expect(screen.getByText('Ready to Play!')).toBeInTheDocument();
      });

      // Start a new game
      await userEvent.click(screen.getByText('Start New Game'));

      // Should show guess input
      expect(screen.getByPlaceholderText('Enter your guess (1-100)')).toBeInTheDocument();
      expect(screen.getByText('Make Guess')).toBeInTheDocument();

      // Make incorrect guesses
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');

      await userEvent.type(guessInput, '25');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Too low!/)).toBeInTheDocument();
      });

      await userEvent.type(guessInput, '75');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Too high!/)).toBeInTheDocument();
      });

      // Make correct guess
      await userEvent.type(guessInput, '50');
      await userEvent.keyboard('{Enter}');

      // Should show win message
      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
        expect(screen.getByText('You won in 3 guesses!')).toBeInTheDocument();
      });

      // Check that stats were updated
      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Games played count
    });

    it('should handle abandoned game correctly', async () => {
      render(<App />);

      // Create player
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Abandon Test');
      await userEvent.click(screen.getByText('Start Playing'));

      // Start game
      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Start New Game'));

      // Make some guesses
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.type(guessInput, '30');
      await userEvent.keyboard('{Enter}');

      // Give up
      await userEvent.click(screen.getByText('Give Up'));

      // Should show the target number
      await waitFor(() => {
        expect(screen.getByText(/The number was 50/)).toBeInTheDocument();
      });

      // Start another game to check stats
      await userEvent.click(screen.getByText('Start New Game'));

      // Games played should be 2, but wins should be 0
      expect(screen.getByText('Games Played')).toBeInTheDocument();
      const gamesPlayedElements = screen.getAllByText('2');
      expect(gamesPlayedElements.length).toBeGreaterThan(0);
    });
  });

  describe('player switching', () => {
    it('should handle switching between players', async () => {
      render(<App />);

      // Create first player
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Player One');
      await userEvent.click(screen.getByText('Start Playing'));

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      // Play and win a game
      await userEvent.click(screen.getByText('Start New Game'));
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.type(guessInput, '50');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
      });

      // Switch player
      await userEvent.click(screen.getByText('Switch'));

      // Create second player
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      });

      const nameInput2 = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput2, 'Player Two');
      await userEvent.click(screen.getByText('Start Playing'));

      // Should show Player Two's fresh stats
      await waitFor(() => {
        expect(screen.getByText('Player Two')).toBeInTheDocument();
      });

      // Games played should be 0 for new player
      const statsSection = screen.getByText('Games Played').parentElement;
      expect(statsSection?.textContent).toContain('0');
    });
  });

  describe('leaderboard updates', () => {
    it('should update leaderboard after games', async () => {
      // Mock existing players in storage
      const existingPlayers = [
        {
          id: 'player-1',
          name: 'Leader',
          gamesPlayed: 5,
          gamesWon: 5,
          totalGuesses: 50,
          bestGame: 8,
          averageGuesses: 10,
          lastPlayed: new Date().toISOString(),
        },
      ];

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'numberGuessPlayers') {
          return JSON.stringify(existingPlayers);
        }
        return null;
      });

      render(<App />);

      // Create new player
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'New Player');
      await userEvent.click(screen.getByText('Start Playing'));

      // Should see leaderboard with existing player
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Leader')).toBeInTheDocument();
      });

      // Play and win a game quickly
      await userEvent.click(screen.getByText('Start New Game'));
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.type(guessInput, '50');
      await userEvent.keyboard('{Enter}');

      // Leaderboard should update
      await waitFor(() => {
        expect(screen.getByText('New Player')).toBeInTheDocument();
      });
    });
  });

  describe('input validation in game context', () => {
    it('should prevent invalid inputs during gameplay', async () => {
      render(<App />);

      // Quick setup
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Validation Test');
      await userEvent.click(screen.getByText('Start Playing'));

      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Start New Game'));

      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Try invalid inputs
      await userEvent.type(guessInput, 'abc');
      expect(guessInput).toHaveValue(null);

      await userEvent.type(guessInput, '150');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Number must be between 1 and 100')).toBeInTheDocument();
      });

      // Clear and try duplicate
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '25');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Too low!/)).toBeInTheDocument();
      });

      // Try same number again
      await userEvent.type(guessInput, '25');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('You already guessed this number')).toBeInTheDocument();
      });
    });
  });

  describe('statistics accuracy', () => {
    it('should calculate statistics correctly across multiple games', async () => {
      render(<App />);

      // Setup player
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Stats Test');
      await userEvent.click(screen.getByText('Start Playing'));

      // Play first game (win in 2 guesses)
      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Start New Game'));

      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.type(guessInput, '40');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Too low!/)).toBeInTheDocument();
      });

      await userEvent.type(guessInput, '50');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
      });

      // Start second game but abandon it
      await userEvent.click(screen.getByText('Play Again'));
      await userEvent.type(guessInput, '30');
      await userEvent.keyboard('{Enter}');
      await userEvent.click(screen.getByText('Give Up'));

      // Start third game and win in 3 guesses
      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Start New Game'));

      await userEvent.type(guessInput, '25');
      await userEvent.keyboard('{Enter}');
      await userEvent.type(guessInput, '60');
      await userEvent.keyboard('{Enter}');
      await userEvent.type(guessInput, '50');
      await userEvent.keyboard('{Enter}');

      // Check final statistics
      await waitFor(() => {
        // Games played: 3
        expect(screen.getByText('Games Played').nextElementSibling?.textContent).toBe('3');

        // Win rate should be 67% (2/3)
        expect(screen.getByText('67%')).toBeInTheDocument();

        // Average guesses should be 2.5 ((2+3)/2)
        expect(screen.getByText('Average Guesses').nextElementSibling?.textContent).toBe('2.5');

        // Best game should be 2
        expect(screen.getByText('Best Game').nextElementSibling?.textContent).toBe('2');
      });
    });
  });
});
