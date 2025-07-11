import { describe, it, expect } from 'vitest';
import { generateRandomNumber, checkGuess, getMessageForFeedback } from './gameLogic';

describe('gameLogic', () => {
  describe('generateRandomNumber', () => {
    it('should generate a number between 1 and 100', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateRandomNumber();
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('checkGuess', () => {
    it('should return correct when guess matches target', () => {
      const result = checkGuess(50, 50);
      expect(result.feedback).toBe('correct');
      expect(result.distance).toBe('hot'); // When correct, distance is still 'hot'
    });

    it('should return too-high when guess is higher than target', () => {
      const result = checkGuess(75, 50);
      expect(result.feedback).toBe('too-high');
    });

    it('should return too-low when guess is lower than target', () => {
      const result = checkGuess(25, 50);
      expect(result.feedback).toBe('too-low');
    });

    it('should calculate cold distance for far guesses', () => {
      const result = checkGuess(90, 10);
      expect(result.distance).toBe('cold');
    });

    it('should calculate warm distance for medium guesses', () => {
      const result = checkGuess(40, 50);
      expect(result.distance).toBe('warm');
    });

    it('should calculate hot distance for close guesses', () => {
      const result = checkGuess(48, 50);
      expect(result.distance).toBe('hot');
    });
  });

  describe('getMessageForFeedback', () => {
    it('should return correct message for winning', () => {
      const message = getMessageForFeedback('correct', 'hot');
      expect(message).toBe('🎉 Congratulations! You guessed it!');
    });

    it('should return appropriate message for too-high cold', () => {
      const message = getMessageForFeedback('too-high', 'cold');
      expect(message).toBe("Too high! Try lower... You're cold");
    });

    it('should return appropriate message for too-low hot', () => {
      const message = getMessageForFeedback('too-low', 'hot');
      expect(message).toBe("Too low! Try higher... You're very close!");
    });
  });
});
