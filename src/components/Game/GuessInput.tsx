import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../UI/Button';
import { useGameStore } from '../../store/gameStore';

interface GuessFormData {
  guess: string;
}

export const GuessInput = () => {
  const { makeGuess, gameStatus, guesses } = useGameStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuessFormData>();

  // Auto-focus input after each guess
  useEffect(() => {
    if (!isSubmitting && gameStatus === 'playing') {
      inputRef.current?.focus();
    }
  }, [guesses.length, isSubmitting, gameStatus]);

  const onSubmit = async (data: GuessFormData) => {
    const guessNumber = parseInt(data.guess);

    if (guesses.includes(guessNumber)) {
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

  // Don't render the form when the game is won
  if (gameStatus === 'won') {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Number guess form">
      <div>
        <label htmlFor="guess-input" className="sr-only">
          Enter your guess between 1 and 100
        </label>
        <input
          {...register('guess', {
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
              const num = parseInt(value);
              if (isNaN(num)) return 'Please enter a valid number';
              if (guesses.includes(num)) return 'You already guessed this number';
              return true;
            },
          })}
          id="guess-input"
          ref={(e) => {
            register('guess').ref(e);
            inputRef.current = e;
          }}
          type="number"
          placeholder="Enter your guess (1-100)"
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[48px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            errors.guess ? 'border-red-500' : 'border-gray-700'
          }`}
          disabled={isDisabled}
          autoFocus
          aria-invalid={!!errors.guess}
          aria-describedby={errors.guess ? 'guess-error' : undefined}
          onKeyDown={(e) => {
            // Ensure Enter key submits the form
            if (e.key === 'Enter' && !isDisabled) {
              e.preventDefault();
              handleSubmit(onSubmit)();
            }
            // Allow: backspace, delete, tab, escape, enter
            if (
              [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
              (e.keyCode === 65 && e.ctrlKey === true) ||
              (e.keyCode === 67 && e.ctrlKey === true) ||
              (e.keyCode === 86 && e.ctrlKey === true) ||
              (e.keyCode === 88 && e.ctrlKey === true)
            ) {
              return;
            }
            // Ensure that it is a number and stop the keypress
            if (
              (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
              (e.keyCode < 96 || e.keyCode > 105)
            ) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            // Remove any non-digit characters
            const target = e.target as HTMLInputElement;
            target.value = target.value.replace(/[^\d]/g, '');
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
