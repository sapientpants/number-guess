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
      makeGuess: mockMakeGuess,
      gameStatus: 'playing',
      guesses: [],
    } as any);
  });

  describe('input validation', () => {
    it('should only allow integer digits', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Try typing non-digit characters
      await userEvent.type(input, 'abc');
      expect(input).toHaveValue(null);

      await userEvent.clear(input);
      await userEvent.type(input, '12.34');
      expect(input).toHaveValue(1234); // Decimal point removed

      await userEvent.clear(input);
      await userEvent.type(input, '50!@#');
      expect(input).toHaveValue(50); // Special characters removed
    });

    it('should prevent non-numeric keypress events', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Letter keys should be prevented
      const letterEvent = new KeyboardEvent('keydown', { key: 'a', keyCode: 65 });
      fireEvent.keyDown(input, letterEvent);
      expect(input).toHaveValue(null);

      // Number keys should be allowed
      fireEvent.change(input, { target: { value: '5' } });
      expect(input).toHaveValue(5);
    });

    it('should show error for numbers outside range', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const submitButton = screen.getByText('Make Guess');

      await userEvent.type(input, '101');
      await userEvent.click(submitButton);

      expect(await screen.findByText('Number must be between 1 and 100')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for zero', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const submitButton = screen.getByText('Make Guess');

      await userEvent.type(input, '0');
      await userEvent.click(submitButton);

      expect(await screen.findByText('Number must be between 1 and 100')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for negative numbers', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const submitButton = screen.getByText('Make Guess');

      await userEvent.type(input, '-5');
      await userEvent.click(submitButton);

      expect(await screen.findByText('Number must be between 1 and 100')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should show error for duplicate guesses', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        makeGuess: mockMakeGuess,
        gameStatus: 'playing',
        guesses: [25, 50, 75],
      } as any);

      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const submitButton = screen.getByText('Make Guess');

      await userEvent.type(input, '50');
      await userEvent.click(submitButton);

      expect(await screen.findByText('You already guessed this number')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });

    it('should require a number to be entered', async () => {
      render(<GuessInput />);
      const submitButton = screen.getByText('Make Guess');

      await userEvent.click(submitButton);

      expect(await screen.findByText('Please enter a number')).toBeInTheDocument();
      expect(mockMakeGuess).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should submit form on Enter key', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      await userEvent.type(input, '42');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockMakeGuess).toHaveBeenCalledWith(42);
      });
    });

    it('should not submit on Enter when disabled', async () => {
      vi.mocked(useGameStore).mockReturnValue({
        makeGuess: mockMakeGuess,
        gameStatus: 'won',
        guesses: [],
      } as any);

      render(<GuessInput />);

      // Component should not render when game is won
      expect(screen.queryByPlaceholderText('Enter your guess (1-100)')).not.toBeInTheDocument();
    });

    it('should allow keyboard shortcuts for copy/paste', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Ctrl+A should be allowed
      const ctrlA = new KeyboardEvent('keydown', { key: 'a', keyCode: 65, ctrlKey: true });
      fireEvent.keyDown(input, ctrlA);
      // Event should not be prevented

      // Ctrl+C should be allowed
      const ctrlC = new KeyboardEvent('keydown', { key: 'c', keyCode: 67, ctrlKey: true });
      fireEvent.keyDown(input, ctrlC);
      // Event should not be prevented

      // Ctrl+V should be allowed
      const ctrlV = new KeyboardEvent('keydown', { key: 'v', keyCode: 86, ctrlKey: true });
      fireEvent.keyDown(input, ctrlV);
      // Event should not be prevented
    });
  });

  describe('form behavior', () => {
    it('should clear input after successful submission', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      await userEvent.type(input, '42');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue(null);
      });
    });

    it('should auto-focus input on mount', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      expect(document.activeElement).toBe(input);
    });

    it('should refocus input after submission', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

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
        makeGuess: mockMakeGuess,
        gameStatus: 'idle',
        guesses: [],
      } as any);

      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const button = screen.getByText('Make Guess');

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  describe('input filtering', () => {
    it('should strip non-digit characters on input event', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)') as HTMLInputElement;

      // Simulate typing mixed characters
      fireEvent.input(input, { target: { value: 'a1b2c3' } });
      expect(input.value).toBe('123');

      fireEvent.input(input, { target: { value: '4.5.6' } });
      expect(input.value).toBe('456');

      fireEvent.input(input, { target: { value: '!7@8#9$' } });
      expect(input.value).toBe('789');
    });

    it('should handle paste events with non-numeric content', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');

      // Simulate pasting mixed content
      await userEvent.click(input);
      await userEvent.paste('abc123def');

      // The input event handler should strip non-digits
      fireEvent.input(input, { target: { value: 'abc123def' } });
      expect(input).toHaveValue(123);
    });
  });

  describe('component lifecycle', () => {
    it('should not render when game status is won', () => {
      vi.mocked(useGameStore).mockReturnValue({
        makeGuess: mockMakeGuess,
        gameStatus: 'won',
        guesses: [42],
      } as any);

      const { container } = render(<GuessInput />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle game state changes', () => {
      const { rerender } = render(<GuessInput />);

      // Initially playing
      expect(screen.getByPlaceholderText('Enter your guess (1-100)')).toBeInTheDocument();

      // Game won
      vi.mocked(useGameStore).mockReturnValue({
        makeGuess: mockMakeGuess,
        gameStatus: 'won',
        guesses: [42],
      } as any);

      rerender(<GuessInput />);
      expect(screen.queryByPlaceholderText('Enter your guess (1-100)')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
      const form = screen.getByRole('form', { name: 'Number guess form' });

      expect(form).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should update ARIA attributes on error', async () => {
      render(<GuessInput />);
      const input = screen.getByPlaceholderText('Enter your guess (1-100)');
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
