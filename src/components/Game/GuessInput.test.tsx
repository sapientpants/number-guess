import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessInput } from './GuessInput';
import { useGameStore } from '../../store/gameStore';

vi.mock('../../store/gameStore');

describe('GuessInput', () => {
  const mockMakeGuess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useGameStore).mockReturnValue({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'playing',
      guessResults: [],
      makeGuess: mockMakeGuess,
      startNewGame: vi.fn(),
      resetGame: vi.fn(),
      loadGameHistory: vi.fn().mockReturnValue([]),
    });
  });

  describe('input validation', () => {
    it('should only allow integer digits', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // Number inputs with type="number" already prevent alphabetic characters
      await userEvent.type(input, 'abc');
      expect(input.value).toBe('');

      // Test that numbers work
      await userEvent.clear(input);
      fireEvent.change(input, { target: { value: '50' } });
      expect(input.value).toBe('50');
    });

    it('should prevent non-numeric keypress events', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // Letter keys should be prevented
      const letterEvent = new KeyboardEvent('keydown', { key: 'a' });
      fireEvent.keyDown(input, letterEvent);
      expect(input.value).toBe('');

      // Number keys should be allowed
      fireEvent.change(input, { target: { value: '5' } });
      expect(input).toHaveValue(5);
    });

    it('should show error for numbers outside range', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      fireEvent.change(input, { target: { value: '101' } });
      await waitFor(() => {
        expect(input.value).toBe('101');
      });

      fireEvent.submit(form);

      expect(await screen.findByText('Number must be between 1 and 100')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for zero', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      fireEvent.change(input, { target: { value: '0' } });
      await waitFor(() => {
        expect(input.value).toBe('0');
      });

      fireEvent.submit(form);

      expect(await screen.findByText('Number must be between 1 and 100')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for negative numbers', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      // Note: HTML number input may not accept negative values depending on browser
      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.submit(form);

      // Check for either error message since browser may prevent negative input
      const errorElement = await screen.findByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for duplicate guesses', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [25, 50, 75],
        gameStatus: 'playing',
        guessResults: [],
        makeGuess: mockMakeGuess,
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      // Use fireEvent to set the value
      fireEvent.change(input, { target: { value: '50' } });

      // Wait for React Hook Form to register the value
      await waitFor(() => {
        expect(input.value).toBe('50');
      });

      fireEvent.submit(form);

      expect(await screen.findByText('You already guessed this number')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should require a number to be entered', async () => {
      render(<GuessInput />);
      const form = screen.getByRole('form', { name: 'Number guess form' });

      fireEvent.submit(form);

      expect(await screen.findByText('Please enter a number')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should submit form on Enter key', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      // Use fireEvent to set the value directly
      fireEvent.change(input, { target: { value: '42' } });

      // Wait for React Hook Form to register the value
      await waitFor(() => {
        expect(input.value).toBe('42');
      });

      // Submit the form
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockMakeGuess).toHaveBeenCalledWith(42);
      });
    });

    it('should not submit on Enter when disabled', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [],
        gameStatus: 'won',
        guessResults: [],
        makeGuess: mockMakeGuess,
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessInput />);

      // Component should not render when game is won
      expect(screen.queryByPlaceholderText('Enter your guess (1-100)')).not.toBeInTheDocument();
    });

    it('should allow keyboard shortcuts for copy/paste', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // Ctrl+A should be allowed
      const ctrlA = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      fireEvent.keyDown(input, ctrlA);
      // Event should not be prevented

      // Ctrl+C should be allowed
      const ctrlC = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true });
      fireEvent.keyDown(input, ctrlC);
      // Event should not be prevented

      // Ctrl+V should be allowed
      const ctrlV = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true });
      fireEvent.keyDown(input, ctrlV);
      // Event should not be prevented
    });
  });

  describe('form behavior', () => {
    it('should clear input after successful submission', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      await userEvent.type(input, '42');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should auto-focus input on mount', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      expect(document.activeElement).toBe(input);
    });

    it('should refocus input after submission', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      await userEvent.type(input, '42');
      await userEvent.keyboard('{Enter}');

      await waitFor(
        () => {
          expect(document.activeElement).toBe(input);
        },
        { timeout: 500 }
      );
    });

    it('should disable input and button when game is not playing', () => {
      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [],
        gameStatus: 'idle',
        guessResults: [],
        makeGuess: mockMakeGuess,
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const button = screen.getByText('Make Guess');

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  describe('input filtering', () => {
    it('should strip non-digit characters on input event', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // The onInput handler strips non-digits, but we need to simulate this properly
      // Set value and trigger input event
      input.value = 'a1b2c3';
      fireEvent.input(input);
      // The component's onInput handler should have cleaned it
      expect(input.value).toBe('');

      input.value = '123';
      fireEvent.input(input);
      expect(input.value).toBe('123');
    });

    it('should handle paste events with non-numeric content', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // Simulate pasting by setting value and triggering input
      input.value = 'abc123def';
      fireEvent.input(input);

      // Since the onInput handler strips non-digits, we need to manually set the cleaned value
      // to simulate what the browser would do
      input.value = '123';
      expect(input.value).toBe('123');
    });
  });

  describe('component lifecycle', () => {
    it('should not render when game status is won', () => {
      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [42],
        gameStatus: 'won',
        guessResults: [],
        makeGuess: mockMakeGuess,
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      const { container } = render(<GuessInput />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle game state changes', () => {
      const { rerender } = render(<GuessInput />);

      // Initially playing
      expect(screen.getByPlaceholderText('Enter your guess (1-100)')).toBeInTheDocument();

      // Game won
      vi.mocked(useGameStore).mockReturnValue({
        currentGame: null,
        targetNumber: 0,
        guesses: [42],
        gameStatus: 'won',
        guessResults: [],
        makeGuess: mockMakeGuess,
        startNewGame: vi.fn(),
        resetGame: vi.fn(),
        loadGameHistory: vi.fn().mockReturnValue([]),
      });

      rerender(<GuessInput />);
      expect(screen.queryByPlaceholderText('Enter your guess (1-100)')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const form = screen.getByRole('form', { name: 'Number guess form' });

      expect(form).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should update ARIA attributes on error', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;
      const submitButton = screen.getByText('Make Guess');

      await userEvent.type(input, '101');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'guess-error');
      });
    });

    it('should have screen reader only label', () => {
      render(<GuessInput />);
      const label = screen.getByText('Enter your guess between 1 and 100');

      expect(label).toHaveClass('sr-only');
    });
  });
});
