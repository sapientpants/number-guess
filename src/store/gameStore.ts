import { create } from 'zustand';
import { Game, GameStatus, GuessResult } from '../types';
import { generateRandomNumber, checkGuess } from '../utils/gameLogic';
import { saveGames, loadGames } from '../utils/storage';
import { usePlayerStore } from './playerStore';

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
      id: `game-${Date.now()}`,
      playerId,
      targetNumber,
      guesses: [],
      isComplete: false,
      startedAt: new Date(),
    };

    // Increment games played count when starting a new game
    usePlayerStore.getState().incrementGamesPlayed(playerId);

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
      completedAt: isWon ? new Date() : undefined,
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
