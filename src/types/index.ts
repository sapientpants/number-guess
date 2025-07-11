export interface Player {
  id: string;
  name: string;
  gamesPlayed: number;
  gamesWon: number;
  totalGuesses: number;
  bestGame: number;
  averageGuesses: number;
  lastPlayed: Date;
}

export interface Game {
  id: string;
  playerId: string;
  targetNumber: number;
  guesses: number[];
  isComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  averageGuesses: number;
  gamesPlayed: number;
  rank: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface GuessResult {
  guess: number;
  feedback: 'too-high' | 'too-low' | 'correct';
  distance: 'hot' | 'warm' | 'cold';
  difference?: number;
}
