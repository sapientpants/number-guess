import { z } from 'zod';

// Schemas
const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  gamesPlayed: z.number().nonnegative(),
  gamesWon: z.number().nonnegative(),
  totalGuesses: z.number().nonnegative(),
  bestGame: z.number().nonnegative(),
  averageGuesses: z.number().nonnegative(),
  lastPlayed: z.coerce.date(),
});

const GameSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  targetNumber: z.number().int().positive(),
  guesses: z.array(z.number().int().positive()),
  isComplete: z.boolean(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  status: z.enum(['idle', 'playing', 'won', 'lost']).default('idle'),
});

const LeaderboardEntrySchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  averageGuesses: z.number().nonnegative(),
  gamesPlayed: z.number().nonnegative(),
  rank: z.number().positive(),
});

const GuessResultSchema = z.object({
  guess: z.number().int().positive(),
  feedback: z.enum(['too-high', 'too-low', 'correct']),
  distance: z.enum(['hot', 'warm', 'cold']),
  difference: z.number().nonnegative().optional(),
});

// Types
export type Player = z.infer<typeof PlayerSchema>;
export type Game = z.infer<typeof GameSchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type GameStatus = z.infer<typeof GameSchema.shape.status>;
export type GuessResult = z.infer<typeof GuessResultSchema>;

// Parsers
export const parsePlayer = (data: unknown): Player => PlayerSchema.parse(data);
export const parseGame = (data: unknown): Game => GameSchema.parse(data);
export const parseLeaderboardEntry = (data: unknown): LeaderboardEntry => LeaderboardEntrySchema.parse(data);
export const parseGuessResult = (data: unknown): GuessResult => GuessResultSchema.parse(data);
