import mitt from 'mitt';

type GameEventTypes = 'GAME_STARTED' | 'GAME_WON' | 'GAME_LOST';

export interface GameEvents extends Record<GameEventTypes, unknown> {
  GAME_STARTED: { playerId: string };
  GAME_WON: { playerId: string; guessCount: number };
  GAME_LOST: { playerId: string };
}

export const emitter = mitt<GameEvents>();
