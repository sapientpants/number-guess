import { parsePlayer, parseGame, type Player, type Game, type LeaderboardEntry } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'number-guess-players',
  GAMES: 'number-guess-games',
  CURRENT_PLAYER: 'number-guess-current-player',
} as const;

const LEADERBOARD_SIZE = 10;

// localStorage is a trust boundary: it can be edited by the user, corrupted, full, or
// unavailable entirely (e.g. some private-browsing modes). Reads and writes never throw, and
// every loaded record is validated before it reaches the stores.

const readItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is full or unavailable: keep playing with in-memory state only.
  }
};

const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore: nothing to clean up if storage is unavailable.
  }
};

const readJsonArray = (key: string): unknown[] => {
  const data = readItem(key);
  if (!data) return [];

  try {
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadList = <T>(key: string, parse: (value: unknown) => T): T[] =>
  readJsonArray(key).flatMap((item) => {
    try {
      return [parse(item)];
    } catch {
      return [];
    }
  });

// Re-export parsers for testing and external use
export { parsePlayer, parseGame } from '../types';

// --- Player storage ---------------------------------------------------------------------------

export const savePlayers = (players: Player[]): void => {
  writeItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
};

export const loadPlayers = (): Player[] => loadList(STORAGE_KEYS.PLAYERS, parsePlayer);

export const saveCurrentPlayerId = (playerId: string): void => {
  writeItem(STORAGE_KEYS.CURRENT_PLAYER, playerId);
};

export const clearCurrentPlayerId = (): void => {
  removeItem(STORAGE_KEYS.CURRENT_PLAYER);
};

export const loadCurrentPlayerId = (): string | null => {
  const playerId = readItem(STORAGE_KEYS.CURRENT_PLAYER);
  // Older versions stored '' to mean "no player selected".
  return playerId === '' ? null : playerId;
};

// --- Game storage -----------------------------------------------------------------------------

export const saveGames = (games: Game[]): void => {
  writeItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
};

export const loadGames = (): Game[] => loadList(STORAGE_KEYS.GAMES, parseGame);

// --- Leaderboard ------------------------------------------------------------------------------

/** Top players by average guesses (lower is better); only players who have played are ranked. */
export const calculateLeaderboard = (players: Player[]): LeaderboardEntry[] =>
  players
    .filter((player) => player.gamesPlayed > 0)
    .sort((a, b) => a.averageGuesses - b.averageGuesses)
    .slice(0, LEADERBOARD_SIZE)
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      averageGuesses: player.averageGuesses,
      gamesPlayed: player.gamesPlayed,
      rank: index + 1,
    }));
