import type { Player, Game, LeaderboardEntry } from '../types';

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

// --- Validation helpers -----------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const asCount = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

const asCountArray = (value: unknown): number[] | undefined =>
  Array.isArray(value) && value.every((item) => asCount(item) !== undefined)
    ? (value as number[])
    : undefined;

/** Accepts a Date or its serialized form; rejects anything that doesn't parse to a valid date. */
const asDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

type Defined<T> = { [K in keyof T]: Exclude<T[K], undefined> };

const allDefined = <T extends object>(fields: T): fields is Defined<T> =>
  Object.values(fields).every((field) => field !== undefined);

// --- Parsers ----------------------------------------------------------------------------------

/**
 * Validates a stored player record. Returns `null` only when the player can't be identified
 * (missing id or name). Invalid or missing stats are reset to 0 rather than dropping the player:
 * the filtered list is written back on the next save, so rejecting a record would delete it.
 * This also covers records saved before win tracking was introduced, which have no `gamesWon`.
 */
export const parsePlayer = (value: unknown): Player | null => {
  if (!isRecord(value)) return null;

  const id = asText(value['id']);
  const name = asText(value['name']);
  if (id === undefined || name === undefined) return null;

  return {
    id,
    name,
    gamesPlayed: asCount(value['gamesPlayed']) ?? 0,
    gamesWon: asCount(value['gamesWon']) ?? 0,
    totalGuesses: asCount(value['totalGuesses']) ?? 0,
    bestGame: asCount(value['bestGame']) ?? 0,
    averageGuesses: asCount(value['averageGuesses']) ?? 0,
    lastPlayed: asDate(value['lastPlayed']) ?? new Date(0),
  };
};

/** Validates a stored game record. Returns `null` for anything malformed. */
export const parseGame = (value: unknown): Game | null => {
  if (!isRecord(value)) return null;

  const fields = {
    id: asText(value['id']),
    playerId: asText(value['playerId']),
    targetNumber: asCount(value['targetNumber']),
    guesses: asCountArray(value['guesses']),
    isComplete: asBoolean(value['isComplete']),
    startedAt: asDate(value['startedAt']),
  };
  if (!allDefined(fields)) return null;

  const completedAt = asDate(value['completedAt']);
  return completedAt ? { ...fields, completedAt } : fields;
};

const loadList = <T>(key: string, parse: (value: unknown) => T | null): T[] =>
  readJsonArray(key).flatMap((item) => {
    const parsed = parse(item);
    return parsed === null ? [] : [parsed];
  });

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
