import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';
import { usePlayerStore } from './playerStore';
import * as gameLogic from '../utils/gameLogic';

vi.mock('./playerStore');
vi.mock('../utils/gameLogic');

describe('gameStore', () => {
  const mockIncrementGamesPlayed = vi.fn();
  const mockUpdatePlayerStats = vi.fn();
  const mockGetCurrentPlayer = vi.fn();

  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      guessResults: [],
      gameStatus: 'idle',
    });

    vi.clearAllMocks();

    // Mock playerStore with complete interface
    vi.mocked(usePlayerStore.getState).mockReturnValue({
      players: [],
      currentPlayer: null,
      loadPlayers: vi.fn(),
      createPlayer: vi.fn(),
      selectPlayer: vi.fn(),
      incrementGamesPlayed: mockIncrementGamesPlayed,
      updatePlayerStats: mockUpdatePlayerStats,
      getCurrentPlayer: mockGetCurrentPlayer,
    });
  });

  describe('game state transitions', () => {
    describe('idle -> playing', () => {
      it('should transition from idle to playing when starting new game', () => {
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(42);

        const store = useGameStore.getState();
        store.startNewGame('player-1');

        const state = useGameStore.getState();
        expect(state.gameStatus).toBe('playing');
        expect(state.targetNumber).toBe(42);
        expect(state.guesses).toEqual([]);
        expect(state.guessResults).toEqual([]);
        expect(mockIncrementGamesPlayed).toHaveBeenCalledWith('player-1');
      });

      it('should create proper game object when starting', () => {
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);

        const store = useGameStore.getState();
        store.startNewGame('player-2');

        const state = useGameStore.getState();
        expect(state.currentGame).toMatchObject({
          playerId: 'player-2',
          targetNumber: 50,
          guesses: [],
          isComplete: false,
        });
        expect(state.currentGame?.id).toMatch(/^game-\d+$/);
      });
    });

    describe('playing -> won', () => {
      it('should transition to won when correct guess is made', () => {
        // Start game first
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
        const store = useGameStore.getState();
        store.startNewGame('player-1');

        // Make some wrong guesses
        vi.mocked(gameLogic.checkGuess).mockReturnValueOnce({
          guess: 25,
          feedback: 'too-low',
          distance: 'cold',
        });
        store.makeGuess(25);

        vi.mocked(gameLogic.checkGuess).mockReturnValueOnce({
          guess: 75,
          feedback: 'too-high',
          distance: 'cold',
        });
        store.makeGuess(75);

        // Make correct guess
        vi.mocked(gameLogic.checkGuess).mockReturnValueOnce({
          guess: 50,
          feedback: 'correct',
          distance: 'hot',
        });
        store.makeGuess(50);

        const state = useGameStore.getState();
        expect(state.gameStatus).toBe('won');
        expect(state.guesses).toEqual([25, 75, 50]);
        expect(state.currentGame?.isComplete).toBe(true);
      });

      it('should mark game as complete when winning', () => {
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
        const store = useGameStore.getState();
        store.startNewGame('player-1');

        vi.mocked(gameLogic.checkGuess).mockReturnValue({
          guess: 50,
          feedback: 'correct',
          distance: 'hot',
        });

        store.makeGuess(50);

        const state = useGameStore.getState();
        expect(state.currentGame?.isComplete).toBe(true);
        expect(state.currentGame?.completedAt).toBeDefined();
      });
    });

    describe('playing -> playing (continue)', () => {
      it('should remain in playing state for incorrect guesses', () => {
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
        const store = useGameStore.getState();
        store.startNewGame('player-1');

        vi.mocked(gameLogic.checkGuess).mockReturnValue({
          guess: 40,
          feedback: 'too-low',
          distance: 'warm',
        });

        store.makeGuess(40);

        const state = useGameStore.getState();
        expect(state.gameStatus).toBe('playing');
        expect(state.guesses).toEqual([40]);
        expect(state.guessResults).toHaveLength(1);
        expect(state.currentGame?.isComplete).toBe(false);
      });
    });

    describe('resetting game', () => {
      it('should reset to idle state', () => {
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
        const store = useGameStore.getState();
        store.startNewGame('player-1');

        // Make some guesses
        vi.mocked(gameLogic.checkGuess).mockReturnValue({
          guess: 25,
          feedback: 'too-low',
          distance: 'cold',
        });
        store.makeGuess(25);

        // Reset the game
        store.resetGame();

        const state = useGameStore.getState();
        expect(state.gameStatus).toBe('idle');
        expect(state.currentGame).toBeNull();
        expect(state.guesses).toEqual([]);
        expect(state.guessResults).toEqual([]);
      });
    });

    describe('won -> playing (new game after win)', () => {
      it('should transition from won to playing when starting new game', () => {
        // Win a game first
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
        const store = useGameStore.getState();
        store.startNewGame('player-1');

        vi.mocked(gameLogic.checkGuess).mockReturnValue({
          guess: 50,
          feedback: 'correct',
          distance: 'hot',
        });
        store.makeGuess(50);

        const wonState = useGameStore.getState();
        expect(wonState.gameStatus).toBe('won');

        // Start new game
        vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(75);
        store.startNewGame('player-1');

        const state = useGameStore.getState();
        expect(state.gameStatus).toBe('playing');
        expect(state.targetNumber).toBe(75);
        expect(state.guesses).toEqual([]);
        expect(state.guessResults).toEqual([]);
        expect(mockIncrementGamesPlayed).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('makeGuess', () => {
    it('should not allow guesses when no current game', () => {
      const store = useGameStore.getState();
      store.makeGuess(25);

      const state = useGameStore.getState();
      expect(state.guesses).toEqual([]);
      expect(gameLogic.checkGuess).not.toHaveBeenCalled();
    });

    it('should not allow duplicate guesses', () => {
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
      const store = useGameStore.getState();
      store.startNewGame('player-1');

      vi.mocked(gameLogic.checkGuess).mockReturnValueOnce({
        guess: 25,
        feedback: 'too-low',
        distance: 'cold',
      });
      store.makeGuess(25);

      vi.mocked(gameLogic.checkGuess).mockReturnValueOnce({
        guess: 30,
        feedback: 'too-low',
        distance: 'warm',
      });
      store.makeGuess(30);

      // Try duplicate guess
      const callCount = vi.mocked(gameLogic.checkGuess).mock.calls.length;
      store.makeGuess(25); // Duplicate guess

      const state = useGameStore.getState();
      expect(state.guesses).toEqual([25, 30]); // No change
      expect(vi.mocked(gameLogic.checkGuess).mock.calls.length).toBe(callCount);
    });

    it('should add guess and result for valid guess', () => {
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
      const store = useGameStore.getState();
      store.startNewGame('player-1');

      vi.mocked(gameLogic.checkGuess).mockReturnValue({
        guess: 60,
        feedback: 'too-high',
        distance: 'warm',
      });

      store.makeGuess(60);

      const state = useGameStore.getState();
      expect(state.guesses).toEqual([60]);
      expect(state.guessResults).toEqual([
        {
          guess: 60,
          feedback: 'too-high',
          distance: 'warm',
        },
      ]);
      expect(gameLogic.checkGuess).toHaveBeenCalledWith(60, 50);
    });
  });

  describe('resetGame', () => {
    it('should reset to initial state', () => {
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
      const store = useGameStore.getState();
      store.startNewGame('player-1');

      // Make some guesses
      vi.mocked(gameLogic.checkGuess).mockReturnValue({
        guess: 25,
        feedback: 'too-low',
        distance: 'cold',
      });
      store.makeGuess(25);

      store.resetGame();

      const state = useGameStore.getState();
      expect(state.currentGame).toBeNull();
      expect(state.targetNumber).toBe(0);
      expect(state.guesses).toEqual([]);
      expect(state.guessResults).toEqual([]);
      expect(state.gameStatus).toBe('idle');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid consecutive guesses', () => {
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
      const store = useGameStore.getState();
      store.startNewGame('player-1');

      vi.mocked(gameLogic.checkGuess)
        .mockReturnValueOnce({ guess: 10, feedback: 'too-low', distance: 'cold' })
        .mockReturnValueOnce({ guess: 90, feedback: 'too-high', distance: 'warm' })
        .mockReturnValueOnce({ guess: 50, feedback: 'correct', distance: 'hot' });

      store.makeGuess(10);
      store.makeGuess(90);
      store.makeGuess(50);

      const state = useGameStore.getState();
      expect(state.guesses).toEqual([10, 90, 50]);
      expect(state.gameStatus).toBe('won');
    });

    it('should not process guess after game is won', () => {
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);
      const store = useGameStore.getState();
      store.startNewGame('player-1');

      // Win the game
      vi.mocked(gameLogic.checkGuess).mockReturnValue({
        guess: 50,
        feedback: 'correct',
        distance: 'hot',
      });
      store.makeGuess(50);

      // Try to guess after winning
      const callCount = vi.mocked(gameLogic.checkGuess).mock.calls.length;
      store.makeGuess(60);

      const state = useGameStore.getState();
      expect(state.guesses).toEqual([50]); // No new guess added
      expect(vi.mocked(gameLogic.checkGuess).mock.calls.length).toBe(callCount);
    });
  });
});
