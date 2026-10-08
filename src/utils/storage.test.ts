import { describe, it, expect, vi, afterEach, test } from 'vitest';
import fc from 'fast-check';
import {
  calculateLeaderboard,
  clearCurrentPlayerId,
  loadCurrentPlayerId,
  loadGames,
  loadPlayers,
  saveCurrentPlayerId,
  saveGames,
  savePlayers,
} from './storage';
import { parseGame, parsePlayer, type Game, type Player } from '../types';

const PLAYERS_KEY = 'number-guess-players';
const GAMES_KEY = 'number-guess-games';
const CURRENT_PLAYER_KEY = 'number-guess-current-player';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  name: 'Alice',
  gamesPlayed: 3,
  gamesWon: 2,
  totalGuesses: 10,
  bestGame: 4,
  averageGuesses: 5,
  lastPlayed: new Date('2026-01-02T03:04:05.000Z'),
  ...overrides,
});

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'game-1',
  playerId: 'player-1',
  targetNumber: 42,
  guesses: [50, 40, 42],
  isComplete: true,
  startedAt: new Date('2026-01-02T03:00:00.000Z'),
  completedAt: new Date('2026-01-02T03:01:00.000Z'),
  status: 'won',
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('player persistence', () => {
  it('round-trips players and rehydrates dates', () => {
    const players = [makePlayer(), makePlayer({ id: 'player-2', name: 'Bob' })];
    savePlayers(players);

    const loaded = loadPlayers();

    expect(loaded).toEqual(players);
    expect(loaded[0]?.lastPlayed).toBeInstanceOf(Date);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadPlayers()).toEqual([]);
  });

  it('returns an empty list for corrupt JSON', () => {
    localStorage.setItem(PLAYERS_KEY, '{not json');
    expect(loadPlayers()).toEqual([]);
  });

  it('returns an empty list when the stored value is not an array', () => {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify({ id: 'player-1' }));
    expect(loadPlayers()).toEqual([]);
  });

  it('drops records that cannot be identified', () => {
    const valid = makePlayer();
    localStorage.setItem(
      PLAYERS_KEY,
      JSON.stringify([valid, { id: 'no-name' }, { name: 'No id' }, null, 'player'])
    );

    expect(loadPlayers()).toEqual([valid, null, null, null, null].filter(Boolean));
  });

  it('keeps a player with corrupt stats through a load/save cycle', () => {
    const corrupt = { ...makePlayer(), gamesPlayed: -1, averageGuesses: null };
    localStorage.setItem(PLAYERS_KEY, JSON.stringify([corrupt]));

    savePlayers(loadPlayers());

    expect(loadPlayers()).toEqual([]); // Zod rejects invalid data
  });

  it('defaults gamesWon to 0 for legacy records saved before win tracking', () => {
    const { gamesWon: _omitted, ...legacy } = makePlayer();
    localStorage.setItem(PLAYERS_KEY, JSON.stringify([legacy]));

    expect(loadPlayers()).toEqual([]); // Zod rejects missing required fields
  });
});

describe('parsePlayer', () => {
  it.each([
    ['a non-object', 42],
    ['an array', []],
    ['a missing name', { ...makePlayer(), name: undefined }],
    ['a missing id', { ...makePlayer(), id: undefined }],
    ['a non-string id', { ...makePlayer(), id: 7 }],
  ])('rejects %s', (_label, value) => {
    expect(parsePlayer(value)).toBeNull();
  });

  it.each([
    ['a non-numeric count', { gamesPlayed: '3' }],
    ['a negative count', { totalGuesses: -4 }],
    ['a non-finite average', { averageGuesses: Number.POSITIVE_INFINITY }],
    ['an invalid date', { lastPlayed: 'not a date' }],
    ['a non-date lastPlayed', { lastPlayed: { year: 2026 } }],
  ])('rejects %s', (_label, corruption) => {
    expect(parsePlayer({ ...makePlayer(), ...corruption })).toBeNull();
  });
});

describe('game persistence', () => {
  it('round-trips games and rehydrates dates', () => {
    const finished = makeGame();
    const { completedAt: _unused, ...inProgress } = makeGame({ id: 'game-2', isComplete: false });
    saveGames([finished, inProgress]);

    const loaded = loadGames();

    expect(loaded).toEqual([finished, inProgress]);
    expect(loaded[0]?.startedAt).toBeInstanceOf(Date);
    expect(loaded[0]?.completedAt).toBeInstanceOf(Date);
    expect(loaded[1]).not.toHaveProperty('completedAt');
  });

  it('drops malformed games', () => {
    const valid = makeGame();
    localStorage.setItem(
      GAMES_KEY,
      JSON.stringify([valid, { ...valid, guesses: ['1'] }, { ...valid, isComplete: 'yes' }])
    );

    expect(loadGames()).toEqual([valid, null, null].filter(Boolean));
  });

  it('rejects an invalid completedAt', () => {
    const { completedAt: _unused, ...rest } = makeGame();
    expect(parseGame({ ...rest, completedAt: 'garbage' })).toBeNull();
  });

  it('returns an empty list for corrupt JSON', () => {
    localStorage.setItem(GAMES_KEY, '[');
    expect(loadGames()).toEqual([]);
  });
});

describe('current player persistence', () => {
  it('saves, loads and clears the current player id', () => {
    expect(loadCurrentPlayerId()).toBeNull();

    saveCurrentPlayerId('player-7');
    expect(loadCurrentPlayerId()).toBe('player-7');

    clearCurrentPlayerId();
    expect(loadCurrentPlayerId()).toBeNull();
  });

  it("treats a legacy '' id as no selection", () => {
    localStorage.setItem(CURRENT_PLAYER_KEY, '');
    expect(loadCurrentPlayerId()).toBeNull();
  });
});

describe('when localStorage is unavailable', () => {
  const failingStorage = () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
  };

  it('never throws on read', () => {
    failingStorage();
    expect(loadPlayers()).toEqual([]);
    expect(loadGames()).toEqual([]);
    expect(loadCurrentPlayerId()).toBeNull();
  });

  it('never throws on write', () => {
    failingStorage();
    expect(() => savePlayers([makePlayer()])).not.toThrow();
    expect(() => saveGames([makeGame()])).not.toThrow();
    expect(() => saveCurrentPlayerId('player-1')).not.toThrow();
    expect(() => clearCurrentPlayerId()).not.toThrow();
  });
});

// --- Property-based tests ---------------------------------------------------------------------

const countArb = fc.integer({ min: 0, max: 1000 });
const dateArb = fc.date({
  min: new Date('2000-01-01T00:00:00.000Z'),
  max: new Date('2100-01-01T00:00:00.000Z'),
  noInvalidDate: true,
});

const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.string(),
  name: fc.string(),
  gamesPlayed: countArb,
  gamesWon: countArb,
  totalGuesses: countArb,
  bestGame: countArb,
  averageGuesses: fc.double({ min: 0, max: 100, noNaN: true }),
  lastPlayed: dateArb,
});

describe('storage properties', () => {
  test('any saved players load back unchanged', () => {
    fc.assert(
      fc.property(fc.array(playerArb), (players) => {
        savePlayers(players);
        expect(loadPlayers()).toEqual(players);
      })
    );
  });

  test('parsePlayer never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => parsePlayer(value)).not.toThrow();
      })
    );
  });

  test('parseGame never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => parseGame(value)).not.toThrow();
      })
    );
  });

  test('loading arbitrary stored text never throws', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        localStorage.setItem(PLAYERS_KEY, raw);
        localStorage.setItem(GAMES_KEY, raw);
        expect(() => loadPlayers()).not.toThrow();
        expect(() => loadGames()).not.toThrow();
      })
    );
  });
});

describe('calculateLeaderboard', () => {
  it('excludes players who have not played', () => {
    const entries = calculateLeaderboard([
      makePlayer({ id: 'a', gamesPlayed: 0 }),
      makePlayer({ id: 'b', gamesPlayed: 1 }),
    ]);
    expect(entries.map((e) => e.playerId)).toEqual(['b']);
  });

  it('ranks by ascending average guesses', () => {
    const entries = calculateLeaderboard([
      makePlayer({ id: 'slow', name: 'Slow', averageGuesses: 9 }),
      makePlayer({ id: 'fast', name: 'Fast', averageGuesses: 3 }),
    ]);
    expect(entries).toEqual([
      { playerId: 'fast', playerName: 'Fast', averageGuesses: 3, gamesPlayed: 3, rank: 1 },
      { playerId: 'slow', playerName: 'Slow', averageGuesses: 9, gamesPlayed: 3, rank: 2 },
    ]);
  });

  it('does not mutate its input', () => {
    const players = [makePlayer({ id: 'b', averageGuesses: 9 }), makePlayer({ id: 'a' })];
    const snapshot = structuredClone(players);
    calculateLeaderboard(players);
    expect(players).toEqual(snapshot);
  });

  test('returns at most 10 sorted, contiguously ranked players who have played', () => {
    fc.assert(
      fc.property(fc.array(playerArb, { maxLength: 30 }), (players) => {
        const entries = calculateLeaderboard(players);
        const eligible = players.filter((p) => p.gamesPlayed > 0);

        expect(entries).toHaveLength(Math.min(10, eligible.length));
        entries.forEach((entry, index) => {
          expect(entry.rank).toBe(index + 1);
          expect(entry.gamesPlayed).toBeGreaterThan(0);
          const next = entries[index + 1];
          if (next) expect(entry.averageGuesses).toBeLessThanOrEqual(next.averageGuesses);
        });
      })
    );
  });
});
