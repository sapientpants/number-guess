import type { GuessResult } from '../types';

type Distance = GuessResult['distance'];
type Feedback = GuessResult['feedback'];

interface FeedbackStyle {
  color: string;
  emoji: string;
}

/** Fine-grained styling by exact distance from the target, checked in ascending order. */
const DIFFERENCE_BANDS: readonly (FeedbackStyle & { maxDifference: number })[] = [
  { maxDifference: 0, color: 'from-green-500 to-emerald-600', emoji: '🎯' }, // Correct
  { maxDifference: 2, color: 'from-red-700 to-red-600', emoji: '🔥' }, // Extremely hot
  { maxDifference: 5, color: 'from-red-600 to-orange-600', emoji: '🌡️' }, // Very hot
  { maxDifference: 10, color: 'from-orange-600 to-yellow-600', emoji: '☀️' }, // Hot to warm
  { maxDifference: 15, color: 'from-yellow-600 to-amber-600', emoji: '🌤️' }, // Warm
  { maxDifference: 25, color: 'from-blue-500 to-cyan-500', emoji: '❄️' }, // Cool
  { maxDifference: Infinity, color: 'from-blue-700 to-indigo-700', emoji: '🧊' }, // Cold
];

/** Coarse styling used when only the hot/warm/cold bucket is known. */
const DISTANCE_STYLES: Record<Distance, FeedbackStyle> = {
  hot: { color: 'from-red-500 to-orange-500', emoji: '🔥' },
  warm: { color: 'from-yellow-500 to-orange-500', emoji: '☀️' },
  cold: { color: 'from-blue-500 to-cyan-500', emoji: '❄️' },
};

const TEMPERATURE_HINTS: Record<Distance, string> = {
  hot: "... You're very close!",
  warm: "... You're getting warmer",
  cold: "... You're cold",
};

export const generateRandomNumber = (min = 1, max = 100): number => {
  // Using Math.random() is safe here as this is a game application
  // where cryptographic randomness is not required. The predictability
  // of Math.random() does not pose a security risk in this context.
  // eslint-disable-next-line sonarjs/pseudo-random -- see comment above
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getDistance = (difference: number): Distance => {
  if (difference <= 5) return 'hot';
  if (difference <= 15) return 'warm';
  return 'cold';
};

const getFeedback = (guess: number, target: number): Feedback => {
  if (guess === target) return 'correct';
  return guess > target ? 'too-high' : 'too-low';
};

export const checkGuess = (guess: number, target: number): GuessResult => {
  const difference = Math.abs(guess - target);

  return {
    guess,
    feedback: getFeedback(guess, target),
    distance: getDistance(difference),
    difference, // Include actual difference for more precise styling
  };
};

const getFeedbackStyle = (distance: Distance, difference?: number): FeedbackStyle => {
  if (difference === undefined) return DISTANCE_STYLES[distance];
  // The final band is unbounded, so a match is always found for a non-negative difference.
  return (
    DIFFERENCE_BANDS.find((band) => difference <= band.maxDifference) ?? DISTANCE_STYLES[distance]
  );
};

export const getColorForDistance = (distance: Distance, difference?: number): string =>
  getFeedbackStyle(distance, difference).color;

export const getTemperatureEmoji = (distance: Distance, difference?: number): string =>
  getFeedbackStyle(distance, difference).emoji;

export const getMessageForFeedback = (feedback: Feedback, distance: Distance): string => {
  if (feedback === 'correct') {
    return '🎉 Congratulations! You guessed it!';
  }

  const direction = feedback === 'too-high' ? 'lower' : 'higher';
  const adjective = feedback === 'too-high' ? 'high' : 'low';

  return `Too ${adjective}! Try ${direction}${TEMPERATURE_HINTS[distance]}`;
};
