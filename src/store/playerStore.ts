import { create } from 'zustand';
import type { Player } from '../types';
import {
  savePlayers,
  loadPlayers,
  saveCurrentPlayerId,
  clearCurrentPlayerId,
  loadCurrentPlayerId,
} from '../utils/storage';
import { emitter } from './eventEmitter';
import { createId } from '../utils/id';

interface PlayerState {
  players: Player[];
  currentPlayer: Player | null;

  // Actions
  loadPlayers: () => void;
  createPlayer: (name: string) => Player;
  selectPlayer: (playerId: string) => void;
  updatePlayerStats: (playerId: string, guessCount: number) => void;
  incrementGamesPlayed: (playerId: string) => void;
  getCurrentPlayer: () => Player | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  /** Applies `update` to one player, persists all players, and makes that player current. */
  const updatePlayer = (playerId: string, update: (player: Player) => Partial<Player>) => {
    const players = get().players.map((player) =>
      player.id === playerId ? { ...player, ...update(player), lastPlayed: new Date() } : player
    );
    savePlayers(players);
    set({ players, currentPlayer: players.find((p) => p.id === playerId) ?? null });
  };

  // Listen to events
  emitter.on('GAME_STARTED', ({ playerId }) => {
    get().incrementGamesPlayed(playerId);
  });

  emitter.on('GAME_WON', ({ playerId, guessCount }) => {
    get().updatePlayerStats(playerId, guessCount);
  });

  emitter.on('GAME_LOST', ({ playerId }) => {
    get().incrementGamesPlayed(playerId);
  });

  return {
    players: [],
    currentPlayer: null,

    loadPlayers: () => {
      const players = loadPlayers();
      const currentPlayerId = loadCurrentPlayerId();
      const currentPlayer = currentPlayerId
        ? (players.find((p) => p.id === currentPlayerId) ?? null)
        : null;

      set({ players, currentPlayer });
    },

    createPlayer: (name) => {
      const newPlayer: Player = {
        id: createId('player'),
        name,
        gamesPlayed: 0,
        gamesWon: 0,
        totalGuesses: 0,
        bestGame: 0,
        averageGuesses: 0,
        lastPlayed: new Date(),
      };

      const players = [...get().players, newPlayer];
      savePlayers(players);
      saveCurrentPlayerId(newPlayer.id);

      set({ players, currentPlayer: newPlayer });
      return newPlayer;
    },

    selectPlayer: (playerId) => {
      if (!playerId) {
        clearCurrentPlayerId();
        set({ currentPlayer: null });
        return;
      }

      const player = get().players.find((p) => p.id === playerId);
      if (player) {
        saveCurrentPlayerId(playerId);
        set({ currentPlayer: player });
      }
    },

    updatePlayerStats: (playerId, guessCount) => {
      updatePlayer(playerId, (player) => {
        const gamesWon = player.gamesWon + 1;
        const totalGuesses = player.totalGuesses + guessCount;
        return {
          gamesWon,
          totalGuesses,
          bestGame: player.bestGame === 0 ? guessCount : Math.min(player.bestGame, guessCount),
          averageGuesses: totalGuesses / gamesWon,
        };
      });
    },

    incrementGamesPlayed: (playerId) => {
      // Don't recalculate average - it should only consider won games
      updatePlayer(playerId, (player) => ({ gamesPlayed: player.gamesPlayed + 1 }));
    },

    getCurrentPlayer: () => get().currentPlayer,
  };
});
