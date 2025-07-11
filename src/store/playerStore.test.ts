import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from './playerStore';
import * as storage from '../utils/storage';

vi.mock('../utils/storage');

describe('playerStore', () => {
  beforeEach(() => {
    // Reset store and mocks before each test
    usePlayerStore.setState({
      players: [],
      currentPlayer: null,
    });
    vi.clearAllMocks();
  });

  describe('createPlayer', () => {
    it('should create a new player with initial stats', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Alice');

      expect(player).toMatchObject({
        name: 'Alice',
        gamesPlayed: 0,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
      });
      expect(player.id).toMatch(/^player-\d+$/);
      expect(storage.savePlayers).toHaveBeenCalledWith([player]);
      expect(storage.saveCurrentPlayerId).toHaveBeenCalledWith(player.id);
    });

    it('should set the created player as current player', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Bob');

      const updatedState = usePlayerStore.getState();
      expect(updatedState.currentPlayer).toEqual(player);
    });
  });

  describe('incrementGamesPlayed', () => {
    it('should increment games played without affecting other stats', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Charlie');
      const initialStats = { ...player };

      store.incrementGamesPlayed(player.id);

      const updatedState = usePlayerStore.getState();
      const updatedPlayer = updatedState.players.find((p) => p.id === player.id);
      expect(updatedPlayer?.gamesPlayed).toBe(1);
      expect(updatedPlayer?.gamesWon).toBe(initialStats.gamesWon);
      expect(updatedPlayer?.totalGuesses).toBe(initialStats.totalGuesses);
      expect(updatedPlayer?.averageGuesses).toBe(initialStats.averageGuesses);
    });

    it('should not affect average guesses calculation', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('David');

      // Start and win some games
      store.incrementGamesPlayed(player.id); // Game 1 started
      store.updatePlayerStats(player.id, 10); // Game 1 won

      store.incrementGamesPlayed(player.id); // Game 2 started
      store.updatePlayerStats(player.id, 20); // Game 2 won

      const statsBeforeIncrement = usePlayerStore
        .getState()
        .players.find((p) => p.id === player.id);
      const averageBeforeIncrement = statsBeforeIncrement?.averageGuesses;

      // Increment games played (simulating abandoned game)
      store.incrementGamesPlayed(player.id); // Game 3 started but not won

      const statsAfterIncrement = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(statsAfterIncrement?.averageGuesses).toBe(averageBeforeIncrement);
      expect(statsAfterIncrement?.gamesPlayed).toBe(3);
      expect(statsAfterIncrement?.gamesWon).toBe(2);
    });
  });

  describe('updatePlayerStats', () => {
    it('should update stats correctly for first win', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Eve');

      store.updatePlayerStats(player.id, 15);

      const updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer).toMatchObject({
        gamesWon: 1,
        totalGuesses: 15,
        bestGame: 15,
        averageGuesses: 15,
      });
    });

    it('should calculate average only from won games', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Frank');

      // Play 3 games, but only win 2
      store.incrementGamesPlayed(player.id); // Game 1: started
      store.updatePlayerStats(player.id, 10); // Game 1: won with 10 guesses

      store.incrementGamesPlayed(player.id); // Game 2: started
      store.updatePlayerStats(player.id, 20); // Game 2: won with 20 guesses

      store.incrementGamesPlayed(player.id); // Game 3: started but abandoned

      const updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer).toMatchObject({
        gamesPlayed: 3,
        gamesWon: 2,
        totalGuesses: 30,
        averageGuesses: 15, // (10 + 20) / 2, not / 3
      });
    });

    it('should update best game correctly', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Grace');

      store.updatePlayerStats(player.id, 20);
      let updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer?.bestGame).toBe(20);

      store.updatePlayerStats(player.id, 10);
      updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer?.bestGame).toBe(10);

      store.updatePlayerStats(player.id, 15);
      updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer?.bestGame).toBe(10); // Should remain 10
    });

    it('should handle multiple wins correctly', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Henry');

      const guesses = [5, 10, 15, 20, 25];
      guesses.forEach((g) => store.updatePlayerStats(player.id, g));

      const updatedPlayer = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(updatedPlayer).toMatchObject({
        gamesWon: 5,
        totalGuesses: 75,
        bestGame: 5,
        averageGuesses: 15,
      });
    });
  });

  describe('selectPlayer', () => {
    it('should set current player when valid ID provided', async () => {
      const store = usePlayerStore.getState();
      const player1 = store.createPlayer('Iris');

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const player2 = store.createPlayer('Jack');

      // After creating both players, player2 is current
      const currentState = usePlayerStore.getState();
      expect(currentState.currentPlayer?.name).toBe('Jack');
      expect(currentState.currentPlayer?.id).toBe(player2.id);

      // Verify players are different
      expect(player1.id).not.toBe(player2.id);

      // Select player1
      usePlayerStore.getState().selectPlayer(player1.id);
      const afterSelect1 = usePlayerStore.getState();
      expect(afterSelect1.currentPlayer?.name).toBe('Iris');
      expect(afterSelect1.currentPlayer?.id).toBe(player1.id);

      // Select player2 again
      usePlayerStore.getState().selectPlayer(player2.id);
      const afterSelect2 = usePlayerStore.getState();
      expect(afterSelect2.currentPlayer?.name).toBe('Jack');
      expect(afterSelect2.currentPlayer?.id).toBe(player2.id);
    });

    it('should clear current player when empty string provided', () => {
      const store = usePlayerStore.getState();
      store.createPlayer('Kate');

      store.selectPlayer('');
      expect(usePlayerStore.getState().currentPlayer).toBeNull();
      expect(storage.saveCurrentPlayerId).toHaveBeenCalledWith('');
    });

    it('should not change current player for invalid ID', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Liam');

      store.selectPlayer('invalid-id');
      expect(usePlayerStore.getState().currentPlayer).toEqual(player);
    });
  });

  describe('loadPlayers', () => {
    it('should load players from storage', () => {
      const mockPlayers = [
        {
          id: 'player-1',
          name: 'Mary',
          gamesPlayed: 5,
          gamesWon: 3,
          totalGuesses: 45,
          bestGame: 10,
          averageGuesses: 15,
          lastPlayed: new Date(),
        },
        {
          id: 'player-2',
          name: 'Nancy',
          gamesPlayed: 10,
          gamesWon: 8,
          totalGuesses: 120,
          bestGame: 8,
          averageGuesses: 15,
          lastPlayed: new Date(),
        },
      ];

      vi.mocked(storage.loadPlayers).mockReturnValue(mockPlayers);
      vi.mocked(storage.loadCurrentPlayerId).mockReturnValue('player-2');

      const store = usePlayerStore.getState();
      store.loadPlayers();

      const updatedState = usePlayerStore.getState();
      expect(updatedState.players).toEqual(mockPlayers);
      expect(updatedState.currentPlayer).toEqual(mockPlayers[1]);
    });

    it('should handle no current player in storage', () => {
      const mockPlayers = [
        {
          id: 'player-1',
          name: 'Oliver',
          gamesPlayed: 1,
          gamesWon: 1,
          totalGuesses: 15,
          bestGame: 15,
          averageGuesses: 15,
          lastPlayed: new Date(),
        },
      ];

      vi.mocked(storage.loadPlayers).mockReturnValue(mockPlayers);
      vi.mocked(storage.loadCurrentPlayerId).mockReturnValue(null);

      const store = usePlayerStore.getState();
      store.loadPlayers();

      const updatedState = usePlayerStore.getState();
      expect(updatedState.players).toEqual(mockPlayers);
      expect(updatedState.currentPlayer).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle player with no wins correctly', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Paula');

      // Start games but never win
      store.incrementGamesPlayed(player.id);
      store.incrementGamesPlayed(player.id);
      store.incrementGamesPlayed(player.id);

      const updatedState = usePlayerStore.getState();
      const updatedPlayer = updatedState.players.find((p) => p.id === player.id);
      expect(updatedPlayer).toMatchObject({
        gamesPlayed: 3,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
      });
    });

    it('should maintain data integrity across multiple operations', () => {
      const store = usePlayerStore.getState();
      const player = store.createPlayer('Quinn');

      // Complex sequence of operations
      store.incrementGamesPlayed(player.id); // Start game 1
      store.updatePlayerStats(player.id, 25); // Win game 1

      store.incrementGamesPlayed(player.id); // Start game 2
      // Abandon game 2

      store.incrementGamesPlayed(player.id); // Start game 3
      store.updatePlayerStats(player.id, 15); // Win game 3

      store.incrementGamesPlayed(player.id); // Start game 4
      store.updatePlayerStats(player.id, 10); // Win game 4

      const final = usePlayerStore.getState().players.find((p) => p.id === player.id);
      expect(final).toMatchObject({
        gamesPlayed: 4,
        gamesWon: 3,
        totalGuesses: 50, // 25 + 15 + 10
        bestGame: 10,
        averageGuesses: 50 / 3, // Total guesses / games won
      });
    });
  });
});
