import { Player, Game, LeaderboardEntry } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'number-guess-players',
  GAMES: 'number-guess-games',
  CURRENT_PLAYER: 'number-guess-current-player',
} as const;

// Player storage functions
export const savePlayers = (players: Player[]): void => {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
};

export const loadPlayers = (): Player[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (!data) return [];

  try {
    const players = JSON.parse(data) as Player[];
    // Convert date strings back to Date objects
    return players.map((player) => ({
      ...player,
      lastPlayed: new Date(player.lastPlayed),
    }));
  } catch {
    return [];
  }
};

export const saveCurrentPlayerId = (playerId: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER, playerId);
};

export const loadCurrentPlayerId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER);
};

// Game storage functions
export const saveGames = (games: Game[]): void => {
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
};

export const loadGames = (): Game[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GAMES);
  if (!data) return [];

  try {
    const games = JSON.parse(data) as Game[];
    // Convert date strings back to Date objects
    return games.map((game) => ({
      ...game,
      startedAt: new Date(game.startedAt),
      completedAt: game.completedAt ? new Date(game.completedAt) : undefined,
    }));
  } catch {
    return [];
  }
};

// Leaderboard calculation
export const calculateLeaderboard = (players: Player[], _games: Game[]): LeaderboardEntry[] => {
  const eligiblePlayers = players.filter((player) => player.gamesPlayed > 0);

  const leaderboard = eligiblePlayers
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      averageGuesses: player.averageGuesses,
      gamesPlayed: player.gamesPlayed,
      rank: 0,
    }))
    .sort((a, b) => a.averageGuesses - b.averageGuesses);

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard.slice(0, 10); // Top 10 only
};
