import mitt from 'mitt';

export type GameEvents = {
  GAME_STARTED: { playerId: string };
  GAME_WON: { playerId: string; guessCount: number };
  GAME_LOST: { playerId: string };
};

export const emitter = mitt<GameEvents>();