import { describe, it, expect } from 'vitest';
import { createId } from './id';

describe('createId', () => {
  it('prefixes a timestamp and random suffix', () => {
    expect(createId('player')).toMatch(/^player-\d+-[0-9a-f]{16}$/);
  });

  it('is unique even when called within the same millisecond', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId('game')));
    expect(ids.size).toBe(1000);
  });
});
