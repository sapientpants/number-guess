import { create } from 'zustand';
import { Player } from '../types';
import {
  savePlayers,
  loadPlayers,
  saveCurrentPlayerId,
  loadCurrentPlayerId,
} from '../utils/storage';

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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  players: [],
  currentPlayer: null,

  loadPlayers: () => {
    const players = loadPlayers();
    const currentPlayerId = loadCurrentPlayerId();
    const currentPlayer = currentPlayerId
      ? players.find((p) => p.id === currentPlayerId) || null
      : null;

    set({ players, currentPlayer });
  },

  createPlayer: (name) => {
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
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
      // Clear selection
      saveCurrentPlayerId('');
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
    const players = get().players.map((player) => {
      if (player.id === playerId) {
        const gamesWon = (player.gamesWon || 0) + 1;
        const totalGuesses = player.totalGuesses + guessCount;
        const bestGame = player.bestGame === 0 ? guessCount : Math.min(player.bestGame, guessCount);
        const averageGuesses = totalGuesses / gamesWon;

        return {
          ...player,
          gamesWon,
          totalGuesses,
          bestGame,
          averageGuesses,
          lastPlayed: new Date(),
        };
      }
      return player;
    });

    savePlayers(players);

    const currentPlayer = players.find((p) => p.id === playerId) || null;
    set({ players, currentPlayer });
  },

  incrementGamesPlayed: (playerId) => {
    const players = get().players.map((player) => {
      if (player.id === playerId) {
        const gamesPlayed = player.gamesPlayed + 1;
        // Don't recalculate average - it should only consider won games

        return {
          ...player,
          gamesPlayed,
          lastPlayed: new Date(),
        };
      }
      return player;
    });

    savePlayers(players);

    const currentPlayer = players.find((p) => p.id === playerId) || null;
    set({ players, currentPlayer });
  },

  getCurrentPlayer: () => get().currentPlayer,
}));
