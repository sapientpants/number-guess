import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
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
  test.prop([fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 0, max: 1000 })])(
    'generateRandomNumber stays within [min, max]',
    (min, span) => {
      const max = min + span;
      const value = generateRandomNumber(min, max);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  );

  test.prop([numberInRange, numberInRange])(
    'feedback points the player towards the target',
    (guess, target) => {
      const { feedback } = checkGuess(guess, target);
      if (guess === target) expect(feedback).toBe('correct');
      else if (guess > target) expect(feedback).toBe('too-high');
      else expect(feedback).toBe('too-low');
    }
  );

  test.prop([numberInRange, numberInRange])(
    'difference is the absolute distance and buckets are monotonic',
    (guess, target) => {
      const { difference, distance } = checkGuess(guess, target);
      const absolute = Math.abs(guess - target);
      expect(difference).toBe(absolute);

      if (absolute <= 5) expect(distance).toBe('hot');
      else if (absolute <= 15) expect(distance).toBe('warm');
      else expect(distance).toBe('cold');
    }
  );

  test.prop([numberInRange, numberInRange])('checkGuess is symmetric in difference', (a, b) => {
    expect(checkGuess(a, b).difference).toBe(checkGuess(b, a).difference);
    expect(checkGuess(a, b).distance).toBe(checkGuess(b, a).distance);
  });

  test.prop([distanceArb, fc.option(fc.integer({ min: 0, max: 99 }), { nil: undefined })])(
    'color and emoji are defined for every distance/difference',
    (distance, difference) => {
      expect(getColorForDistance(distance, difference)).toMatch(/^from-\S+ to-\S+$/);
      expect(getTemperatureEmoji(distance, difference)).not.toBe('');
    }
  );

  test.prop([fc.integer({ min: 1, max: 99 }), distanceArb])(
    'only an exact hit is styled as correct',
    (difference, distance) => {
      expect(getTemperatureEmoji(distance, difference)).not.toBe('🎯');
      expect(getTemperatureEmoji(distance, 0)).toBe('🎯');
    }
  );

  test.prop([fc.constantFrom('too-high' as const, 'too-low' as const), distanceArb])(
    'hint messages tell the player which way to go',
    (feedback, distance) => {
      const message = getMessageForFeedback(feedback, distance);
      expect(message).toContain(feedback === 'too-high' ? 'Try lower' : 'Try higher');
    }
  );
});
