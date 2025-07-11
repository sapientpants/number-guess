import { GuessResult } from '../types';

export const generateRandomNumber = (min: number = 1, max: number = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const checkGuess = (guess: number, target: number): GuessResult => {
  const difference = Math.abs(guess - target);

  let feedback: 'too-high' | 'too-low' | 'correct';
  if (guess === target) {
    feedback = 'correct';
  } else if (guess > target) {
    feedback = 'too-high';
  } else {
    feedback = 'too-low';
  }

  let distance: 'hot' | 'warm' | 'cold';
  if (difference === 0) {
    distance = 'hot';
  } else if (difference <= 5) {
    distance = 'hot';
  } else if (difference <= 15) {
    distance = 'warm';
  } else {
    distance = 'cold';
  }

  return {
    guess,
    feedback,
    distance,
    difference, // Include actual difference for more precise styling
  };
};

export const getColorForDistance = (
  distance: 'hot' | 'warm' | 'cold',
  difference?: number
): string => {
  // More nuanced color gradients based on exact difference with better contrast
  if (difference !== undefined) {
    if (difference === 0) {
      return 'from-green-500 to-emerald-600'; // Correct answer - darker for better contrast
    } else if (difference <= 2) {
      return 'from-red-700 to-red-600'; // Extremely hot - darker for contrast
    } else if (difference <= 5) {
      return 'from-red-600 to-orange-600'; // Very hot - darker
    } else if (difference <= 10) {
      return 'from-orange-600 to-yellow-600'; // Hot to warm - darker
    } else if (difference <= 15) {
      return 'from-yellow-600 to-amber-600'; // Warm - darker
    } else if (difference <= 25) {
      return 'from-blue-500 to-cyan-500'; // Cool
    } else {
      return 'from-blue-700 to-indigo-700'; // Cold - darker
    }
  }

  // Fallback to basic colors if difference not provided
  switch (distance) {
    case 'hot':
      return 'from-red-500 to-orange-500';
    case 'warm':
      return 'from-yellow-500 to-orange-500';
    case 'cold':
      return 'from-blue-500 to-cyan-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

// New function to get temperature emoji
export const getTemperatureEmoji = (
  distance: 'hot' | 'warm' | 'cold',
  difference?: number
): string => {
  if (difference !== undefined) {
    if (difference === 0) return '🎯';
    if (difference <= 2) return '🔥';
    if (difference <= 5) return '🌡️';
    if (difference <= 10) return '☀️';
    if (difference <= 15) return '🌤️';
    if (difference <= 25) return '❄️';
    return '🧊';
  }

  switch (distance) {
    case 'hot':
      return '🔥';
    case 'warm':
      return '☀️';
    case 'cold':
      return '❄️';
    default:
      return '❓';
  }
};

export const getMessageForFeedback = (
  feedback: 'too-high' | 'too-low' | 'correct',
  distance: 'hot' | 'warm' | 'cold'
): string => {
  if (feedback === 'correct') {
    return '🎉 Congratulations! You guessed it!';
  }

  const direction = feedback === 'too-high' ? 'lower' : 'higher';
  let temperatureHint = '';

  if (distance === 'hot') {
    temperatureHint = "... You're very close!";
  } else if (distance === 'warm') {
    temperatureHint = "... You're getting warmer";
  } else {
    temperatureHint = "... You're cold";
  }

  return `Too ${feedback.split('-')[1]}! Try ${direction}${temperatureHint}`;
};
