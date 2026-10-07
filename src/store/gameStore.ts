import { create } from 'zustand';
import type { Game, GameStatus, GuessResult } from '../types';
import { generateRandomNumber, checkGuess } from '../utils/gameLogic';
import { saveGames, loadGames } from '../utils/storage';
import { emitter } from './eventEmitter';
import { createId } from '../utils/id';

interface GameState {
  currentGame: Game | null;
  targetNumber: number;
  guesses: number[];
  gameStatus: GameStatus;
  guessResults: GuessResult[];

  // Actions
  startNewGame: (playerId: string) => void;
  makeGuess: (guess: number) => void;
  resetGame: () => void;
  loadGameHistory: () => Game[];
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  targetNumber: 0,
  guesses: [],
  gameStatus: 'idle',
  guessResults: [],

  startNewGame: (playerId) => {
    const targetNumber = generateRandomNumber(1, 100);

    const newGame: Game = {
      id: createId('game'),
      playerId,
      targetNumber,
      guesses: [],
      isComplete: false,
      startedAt: new Date(),
      status: 'playing',
    };

    // Emit event to increment games played count
    emitter.emit('GAME_STARTED', { playerId });

    set({
      currentGame: newGame,
      targetNumber,
      guesses: [],
      gameStatus: 'playing',
      guessResults: [],
    });
  },

  makeGuess: (guess) => {
    const { currentGame, targetNumber, guesses, guessResults } = get();
    if (!currentGame || currentGame.isComplete) return;

    // Check if already guessed
    if (guesses.includes(guess)) return;

    const result = checkGuess(guess, targetNumber);
    const newGuesses = [...guesses, guess];
    const newResults = [...guessResults, result];

    const isWon = result.feedback === 'correct';
    const updatedGame: Game = {
      ...currentGame,
      guesses: newGuesses,
      isComplete: isWon,
      status: isWon ? 'won' : 'playing',
      ...(isWon && { completedAt: new Date() }),
    };

    // Save to localStorage
    const allGames = loadGames();
    const gameIndex = allGames.findIndex((g) => g.id === currentGame.id);
    if (gameIndex >= 0) {
      allGames[gameIndex] = updatedGame;
    } else {
      allGames.push(updatedGame);
    }
    saveGames(allGames);

    set({
      currentGame: updatedGame,
      guesses: newGuesses,
      guessResults: newResults,
      gameStatus: isWon ? 'won' : 'playing',
    });

    if (isWon) {
      // Emit event to update player stats
      emitter.emit('GAME_WON', { playerId: currentGame.playerId, guessCount: newGuesses.length });
    }
  },

  resetGame: () => {
    set({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      gameStatus: 'idle',
      guessResults: [],
    });
  },

  loadGameHistory: () => {
    return loadGames();
  },
}));
