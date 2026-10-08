import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import {
  checkGuess,
  generateRandomNumber,
  getColorForDistance,
  getMessageForFeedback,
  getTemperatureEmoji,
} from './gameLogic';

const numberInRange = fc.integer({ min: 1, max: 100 });
const distanceArb = fc.constantFrom('hot' as const, 'warm' as const, 'cold' as const);

describe('gameLogic properties', () => {
  test('generateRandomNumber stays within [min, max]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (min, span) => {
          const max = min + span;
          const value = generateRandomNumber(min, max);
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(min);
          expect(value).toBeLessThanOrEqual(max);
        }
      )
    );
  });

  test('feedback points the player towards the target', () => {
    fc.assert(
      fc.property(numberInRange, numberInRange, (guess, target) => {
        const { feedback } = checkGuess(guess, target);
        if (guess === target) expect(feedback).toBe('correct');
        else if (guess > target) expect(feedback).toBe('too-high');
        else expect(feedback).toBe('too-low');
      })
    );
  });

  test('difference is the absolute distance and buckets are monotonic', () => {
    fc.assert(
      fc.property(numberInRange, numberInRange, (guess, target) => {
        const { difference, distance } = checkGuess(guess, target);
        const absolute = Math.abs(guess - target);
        expect(difference).toBe(absolute);

        if (absolute <= 5) expect(distance).toBe('hot');
        else if (absolute <= 15) expect(distance).toBe('warm');
        else expect(distance).toBe('cold');
      })
    );
  });

  test('checkGuess is symmetric in difference', () => {
    fc.assert(
      fc.property(numberInRange, numberInRange, (a, b) => {
        expect(checkGuess(a, b).difference).toBe(checkGuess(b, a).difference);
        expect(checkGuess(a, b).distance).toBe(checkGuess(b, a).distance);
      })
    );
  });

  test('color and emoji are defined for every distance/difference', () => {
    fc.assert(
      fc.property(
        distanceArb,
        fc.option(fc.integer({ min: 0, max: 99 }), { nil: undefined }),
        (distance, difference) => {
          expect(getColorForDistance(distance, difference)).toMatch(/^from-\S+ to-\S+$/);
          expect(getTemperatureEmoji(distance, difference)).not.toBe('');
        }
      )
    );
  });

  test('only an exact hit is styled as correct', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), distanceArb, (difference, distance) => {
        expect(getTemperatureEmoji(distance, difference)).not.toBe('🎯');
        expect(getTemperatureEmoji(distance, 0)).toBe('🎯');
      })
    );
  });

  test('hint messages tell the player which way to go', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('too-high' as const, 'too-low' as const),
        distanceArb,
        (feedback, distance) => {
          const message = getMessageForFeedback(feedback, distance);
          expect(message).toContain(feedback === 'too-high' ? 'Try lower' : 'Try higher');
        }
      )
    );
  });
});
