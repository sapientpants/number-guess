import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../UI/Button';
import { useGameStore } from '../../store/gameStore';

interface GuessFormData {
  guess: string;
}

const EDITING_KEYS = ['Delete', 'Backspace', 'Tab', 'Escape', 'Enter'];
const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
const CLIPBOARD_SHORTCUT_KEYS = ['a', 'c', 'v', 'x'];

/** Whether a keystroke may reach the numeric guess input. */
const isAllowedKey = (key: string, ctrlKey: boolean): boolean =>
  EDITING_KEYS.includes(key) ||
  NAVIGATION_KEYS.includes(key) ||
  (ctrlKey && CLIPBOARD_SHORTCUT_KEYS.includes(key)) ||
  /^\d$/.test(key);

export const GuessInput = () => {
  const { makeGuess, gameStatus, guesses } = useGameStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<GuessFormData>();

  // Auto-focus input after each guess
  useEffect(() => {
    if (!isSubmitting && gameStatus === 'playing') {
      inputRef.current?.focus();
    }
  }, [guesses.length, isSubmitting, gameStatus]);

  const onSubmit = (data: GuessFormData) => {
    const guessNumber = parseInt(data.guess, 10);

    // Don't submit if it's a duplicate guess - show validation error
    if (guesses.includes(guessNumber)) {
      setError('guess', {
        type: 'manual',
        message: 'You already guessed this number',
      });
      return;
    }

    setIsSubmitting(true);
    makeGuess(guessNumber);
    reset();

    // Small delay for animation, then refocus
    setTimeout(() => {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }, 300);
  };

  const isDisabled = gameStatus !== 'playing' || isSubmitting;

  const guessField = register('guess', {
    required: 'Please enter a number',
    min: {
      value: 1,
      message: 'Number must be between 1 and 100',
    },
    max: {
      value: 100,
      message: 'Number must be between 1 and 100',
    },
    validate: (value) => {
      const num = parseInt(value, 10);
      if (Number.isNaN(num)) return 'Please enter a valid number';
      return true;
    },
  });

  // Don't render the form when the game is won
  if (gameStatus === 'won') {
    return null;
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-4"
      aria-label="Number guess form"
    >
      <div>
        <label htmlFor="guess-input" className="sr-only">
          Enter your guess between 1 and 100
        </label>
        <input
          {...guessField}
          id="guess-input"
          ref={(e) => {
            guessField.ref(e);
            inputRef.current = e;
          }}
          type="number"
          placeholder="Enter your guess (1-100)"
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[48px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            errors.guess ? 'border-red-500' : 'border-gray-700'
          }`}
          disabled={isDisabled}
          aria-invalid={!!errors.guess}
          aria-describedby={errors.guess ? 'guess-error' : undefined}
          onKeyDown={(e) => {
            // Ensure Enter key submits the form
            if (e.key === 'Enter' && !isDisabled) {
              e.preventDefault();
              void handleSubmit(onSubmit)();
            }
            // Block anything that isn't a digit, editing, navigation or clipboard key
            if (!isAllowedKey(e.key, e.ctrlKey)) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            // Remove any non-digit characters
            const target = e.currentTarget;
            target.value = target.value.replace(/\D/g, '');
          }}
        />
        {errors.guess && (
          <p id="guess-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.guess.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isDisabled} className="w-full" size="lg">
        Make Guess
      </Button>
    </form>
  );
};
