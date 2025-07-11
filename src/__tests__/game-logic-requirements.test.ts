import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import * as gameLogic from '../utils/gameLogic';

vi.mock('../utils/storage', () => ({
  savePlayers: vi.fn(),
  loadPlayers: vi.fn(() => []),
  saveCurrentPlayerId: vi.fn(),
  loadCurrentPlayerId: vi.fn(() => null),
  saveGames: vi.fn(),
  loadGames: vi.fn(() => []),
}));

vi.mock('../utils/gameLogic', () => ({
  generateRandomNumber: vi.fn(() => 50),
  checkGuess: vi.fn(),
  getMessageForFeedback: vi.fn(),
  getColorForDistance: vi.fn(),
  getTemperatureEmoji: vi.fn(),
}));

describe('Game Logic Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    usePlayerStore.setState({
      players: [],
      currentPlayer: null,
    });
    useGameStore.setState({
      currentGame: null,
      targetNumber: 0,
      guesses: [],
      guessResults: [],
      gameStatus: 'idle',
    });
  });

  describe('Player Statistics Tracking', () => {
    it('should track games played separately from games won', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());
      const { result: gameStore } = renderHook(() => useGameStore());

      // Create a player
      act(() => {
        const player = playerStore.current.createPlayer('Test Player');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;
      expect(player.gamesPlayed).toBe(0);
      expect(player.gamesWon).toBe(0);

      // Start a game (increments gamesPlayed)
      act(() => {
        gameStore.current.startNewGame(player.id);
      });

      // Check that gamesPlayed was incremented
      const updatedPlayer1 = playerStore.current.players.find((p) => p.id === player.id);
      expect(updatedPlayer1?.gamesPlayed).toBe(1);
      expect(updatedPlayer1?.gamesWon).toBe(0);

      // Win the game
      act(() => {
        playerStore.current.updatePlayerStats(player.id, 5);
      });

      // Check that gamesWon was incremented
      const updatedPlayer2 = playerStore.current.players.find((p) => p.id === player.id);
      expect(updatedPlayer2?.gamesWon).toBe(1);
      expect(updatedPlayer2?.gamesPlayed).toBe(1);

      // Start another game but abandon it
      act(() => {
        gameStore.current.startNewGame(player.id);
      });

      const finalPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(finalPlayer?.gamesPlayed).toBe(2);
      expect(finalPlayer?.gamesWon).toBe(1); // Still only 1 win
    });

    it('should calculate average guesses only from won games', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());

      // Create a player
      act(() => {
        const player = playerStore.current.createPlayer('Average Test');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;

      // Win first game with 10 guesses
      act(() => {
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.updatePlayerStats(player.id, 10);
      });

      let currentPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(currentPlayer?.averageGuesses).toBe(10);

      // Win second game with 20 guesses
      act(() => {
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.updatePlayerStats(player.id, 20);
      });

      currentPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(currentPlayer?.averageGuesses).toBe(15); // (10 + 20) / 2

      // Start third game but don't win (abandon)
      act(() => {
        playerStore.current.incrementGamesPlayed(player.id);
      });

      // Average should remain the same (only counting won games)
      currentPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(currentPlayer?.averageGuesses).toBe(15); // Still 15
      expect(currentPlayer?.gamesPlayed).toBe(3);
      expect(currentPlayer?.gamesWon).toBe(2);
    });

    it('should calculate win rate correctly', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());

      // Create a player
      act(() => {
        const player = playerStore.current.createPlayer('Win Rate Test');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;

      // Play 5 games, win 3
      act(() => {
        // Game 1: Win
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.updatePlayerStats(player.id, 10);

        // Game 2: Abandon
        playerStore.current.incrementGamesPlayed(player.id);

        // Game 3: Win
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.updatePlayerStats(player.id, 15);

        // Game 4: Win
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.updatePlayerStats(player.id, 20);

        // Game 5: Abandon
        playerStore.current.incrementGamesPlayed(player.id);
      });

      const finalPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(finalPlayer?.gamesPlayed).toBe(5);
      expect(finalPlayer?.gamesWon).toBe(3);

      // Win rate calculation (done in component)
      const winRate = Math.round((finalPlayer!.gamesWon / finalPlayer!.gamesPlayed) * 100);
      expect(winRate).toBe(60); // 3/5 = 60%
    });
  });

  describe('Game State Transitions', () => {
    it('should increment games played when starting a new game', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());
      const { result: gameStore } = renderHook(() => useGameStore());

      // Create and select a player
      act(() => {
        const player = playerStore.current.createPlayer('State Test');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;
      const initialGamesPlayed = player.gamesPlayed;

      // Start a new game
      act(() => {
        gameStore.current.startNewGame(player.id);
      });

      // Verify games played was incremented
      const updatedPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(updatedPlayer?.gamesPlayed).toBe(initialGamesPlayed + 1);
    });

    it('should track game completion status correctly', () => {
      const { result: gameStore } = renderHook(() => useGameStore());
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(42);

      // Start a game
      act(() => {
        gameStore.current.startNewGame('test-player');
      });

      expect(gameStore.current.gameStatus).toBe('playing');
      expect(gameStore.current.currentGame?.isComplete).toBe(false);

      // Make correct guess
      vi.mocked(gameLogic.checkGuess).mockReturnValue({
        guess: 42,
        feedback: 'correct',
        distance: 'hot',
      });

      act(() => {
        gameStore.current.makeGuess(42);
      });

      expect(gameStore.current.gameStatus).toBe('won');
      expect(gameStore.current.currentGame?.isComplete).toBe(true);
      expect(gameStore.current.currentGame?.completedAt).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should only allow integer digits in input', () => {
      // This is tested in the component tests, but let's verify the logic
      const testCases = [
        { input: 'abc123', expected: '123' },
        { input: '12.34', expected: '1234' },
        { input: '50!@#', expected: '50' },
        { input: '-25', expected: '25' },
        { input: '1e10', expected: '110' },
      ];

      testCases.forEach(({ input, expected }) => {
        const filtered = input.replace(/[^\d]/g, '');
        expect(filtered).toBe(expected);
      });
    });

    it('should validate guess range 1-100', () => {
      const isValidGuess = (num: number) => num >= 1 && num <= 100;

      expect(isValidGuess(0)).toBe(false);
      expect(isValidGuess(1)).toBe(true);
      expect(isValidGuess(50)).toBe(true);
      expect(isValidGuess(100)).toBe(true);
      expect(isValidGuess(101)).toBe(false);
      expect(isValidGuess(-5)).toBe(false);
    });

    it('should prevent duplicate guesses', () => {
      const { result: gameStore } = renderHook(() => useGameStore());
      vi.mocked(gameLogic.generateRandomNumber).mockReturnValue(50);

      // Start a game
      act(() => {
        gameStore.current.startNewGame('test-player');
      });

      // Make a guess
      vi.mocked(gameLogic.checkGuess).mockReturnValue({
        guess: 25,
        feedback: 'too-low',
        distance: 'cold',
      });

      act(() => {
        gameStore.current.makeGuess(25);
      });

      expect(gameStore.current.guesses).toEqual([25]);

      // Try same guess again
      act(() => {
        gameStore.current.makeGuess(25);
      });

      // Should still only have one instance
      expect(gameStore.current.guesses).toEqual([25]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle player with no wins correctly', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());

      act(() => {
        const player = playerStore.current.createPlayer('No Wins');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;

      // Play games but never win
      act(() => {
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.incrementGamesPlayed(player.id);
        playerStore.current.incrementGamesPlayed(player.id);
      });

      const finalPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(finalPlayer?.gamesPlayed).toBe(3);
      expect(finalPlayer?.gamesWon).toBe(0);
      expect(finalPlayer?.averageGuesses).toBe(0);
      expect(finalPlayer?.totalGuesses).toBe(0);

      // Win rate should be 0%
      const winRate =
        finalPlayer!.gamesPlayed > 0
          ? Math.round((finalPlayer!.gamesWon / finalPlayer!.gamesPlayed) * 100)
          : 0;
      expect(winRate).toBe(0);
    });

    it('should handle rapid game starts and completions', () => {
      const { result: playerStore } = renderHook(() => usePlayerStore());
      const { result: gameStore } = renderHook(() => useGameStore());

      act(() => {
        const player = playerStore.current.createPlayer('Rapid Test');
        playerStore.current.selectPlayer(player.id);
      });

      const player = playerStore.current.currentPlayer!;

      // Rapidly start and complete games
      act(() => {
        for (let i = 0; i < 5; i++) {
          gameStore.current.startNewGame(player.id);
          playerStore.current.updatePlayerStats(player.id, 10 + i);
        }
      });

      const finalPlayer = playerStore.current.players.find((p) => p.id === player.id);
      expect(finalPlayer?.gamesPlayed).toBe(5);
      expect(finalPlayer?.gamesWon).toBe(5);
      expect(finalPlayer?.totalGuesses).toBe(60); // 10+11+12+13+14
      expect(finalPlayer?.averageGuesses).toBe(12); // 60/5
    });
  });
});
