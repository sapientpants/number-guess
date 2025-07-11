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
    it(
      'should handle full game flow from player creation to winning',
      async () => {
        render(<App />);

        // Should show the game title
        expect(screen.getByText('Number Guessing Game')).toBeInTheDocument();

        // Click to create a new player
        await userEvent.click(screen.getByText('Create New Player'));

        // Enter player name
        const nameInput = screen.getByPlaceholderText('Enter your name');
        await userEvent.type(nameInput, 'Test Player');
        await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

        // Should show game board
        await waitFor(() => {
          expect(screen.getByText('Ready to Play?')).toBeInTheDocument();
        });

        // Start a new game
        const startButton = screen.getByRole('button', { name: 'Start New Game' });
        await userEvent.click(startButton);

        // Should show guess input
        expect(screen.getByPlaceholderText('Enter your guess (1-100)')).toBeInTheDocument();
        expect(screen.getByText('Make Guess')).toBeInTheDocument();

        // Make incorrect guesses
        const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');

        // Wait for input to be ready and make first guess
        await waitFor(() => {
          expect(guessInput).not.toBeDisabled();
        });

        // Type the guess and click submit
        await userEvent.type(guessInput, '25');
        
        // Click the submit button directly
        const submitButton = screen.getByRole('button', { name: 'Make Guess' });
        await userEvent.click(submitButton);

        // Wait for the guess to be processed
        await waitFor(
          () => {
            // Look for the feedback text in a more flexible way
            const feedbackElements = screen.queryAllByText(/Too Low/i);
            expect(feedbackElements.length).toBeGreaterThan(0);
          },
          { timeout: 5000 }
        );

        await userEvent.clear(guessInput);
        await userEvent.type(guessInput, '75');
        await userEvent.click(screen.getByText('Make Guess'));

        await waitFor(
          () => {
            expect(screen.getByText('↓ Too High')).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Make correct guess
        await userEvent.clear(guessInput);
        await userEvent.type(guessInput, '50');
        await userEvent.click(screen.getByText('Make Guess'));

        // Should show win message
        await waitFor(() => {
          expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
          expect(screen.getByText('You won in 3 guesses!')).toBeInTheDocument();
        });

        // Check that stats were updated
        expect(screen.getByText('Games Played')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Games played count
      },
      { timeout: 10000 }
    );

    it('should handle abandoned game correctly', async () => {
      render(<App />);

      // Create player
      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Abandon Test');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      // Wait for game board to render with more flexible timing
      await waitFor(() => {
        const readyText = screen.queryByText('Ready to Play?');
        const startButton = screen.queryByRole('button', { name: 'Start New Game' });
        expect(readyText || startButton).toBeTruthy();
      }, { timeout: 5000 });

      // Click start new game
      const startButton = screen.getByRole('button', { name: 'Start New Game' });
      await userEvent.click(startButton);

      // Make some guesses
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '30');
      await userEvent.click(screen.getByText('Make Guess'));

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
      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Player One');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      // Play and win a game
      await userEvent.click(screen.getByText('Start New Game'));
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '50');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
      });

      // Switch player
      await userEvent.click(screen.getByText('Switch'));

      // Create second player
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput2 = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput2, 'Player Two');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

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
      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'New Player');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      // Should see leaderboard with existing player
      await waitFor(() => {
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Leader')).toBeInTheDocument();
      });

      // Play and win a game quickly
      await userEvent.click(screen.getByText('Start New Game'));
      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '50');
      await userEvent.click(screen.getByText('Make Guess'));

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
      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Validation Test');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Start New Game'));

      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Try invalid inputs (number input prevents alphabetic characters)
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, 'abc');
      expect(guessInput).toHaveValue(null);

      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '150');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(() => {
        expect(screen.getByText('Number must be between 1 and 100')).toBeInTheDocument();
      });

      // Clear and try duplicate
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '25');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(
        () => {
          expect(screen.getByText('↑ Too Low')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Try same number again
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '25');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(() => {
        expect(screen.getByText('You already guessed this number')).toBeInTheDocument();
      });
    });
  });

  describe('statistics accuracy', () => {
    it('should calculate statistics correctly across multiple games', async () => {
      render(<App />);

      // Setup player
      await userEvent.click(screen.getByText('Create New Player'));
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await userEvent.type(nameInput, 'Stats Test');
      await userEvent.click(screen.getByRole('button', { name: 'Create Player' }));

      // Play first game (win in 2 guesses)
      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Start New Game'));

      const guessInput = screen.getByPlaceholderText('Enter your guess (1-100)');
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '40');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(
        () => {
          expect(screen.getByText('↑ Too Low')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '50');
      await userEvent.click(screen.getByText('Make Guess'));

      await waitFor(() => {
        expect(screen.getByText(/Congratulations!/)).toBeInTheDocument();
      });

      // Start second game but abandon it
      await userEvent.click(screen.getByText('Play Again'));
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '30');
      await userEvent.click(screen.getByText('Make Guess'));
      await userEvent.click(screen.getByText('Give Up'));

      // Start third game and win in 3 guesses
      await waitFor(() => {
        expect(screen.getByText('Start New Game')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Start New Game'));

      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '25');
      await userEvent.click(screen.getByText('Make Guess'));
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '60');
      await userEvent.click(screen.getByText('Make Guess'));
      await userEvent.clear(guessInput);
      await userEvent.type(guessInput, '50');
      await userEvent.click(screen.getByText('Make Guess'));

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
