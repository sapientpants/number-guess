import mitt from 'mitt';

export type GameEvents = Record<
  'GAME_STARTED' | 'GAME_WON' | 'GAME_LOST',
  { playerId: string; guessCount?: number }
>;

export const emitter = mitt<GameEvents>();
