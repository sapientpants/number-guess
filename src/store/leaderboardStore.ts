import { create } from 'zustand';
import { LeaderboardEntry } from '../types';
import { calculateLeaderboard } from '../utils/storage';
import { usePlayerStore } from './playerStore';

interface LeaderboardState {
  entries: LeaderboardEntry[];

  // Actions
  updateLeaderboard: () => void;
  getPlayerRank: (playerId: string) => number | null;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],

  updateLeaderboard: () => {
    const players = usePlayerStore.getState().players;
    const entries = calculateLeaderboard(players, []);
    set({ entries });
  },

  getPlayerRank: (playerId) => {
    const entry = get().entries.find((e) => e.playerId === playerId);
    return entry ? entry.rank : null;
  },
}));
