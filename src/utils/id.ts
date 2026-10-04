/**
 * Creates a unique, time-ordered id such as `player-1767225600000-3f9a0c1b2d4e5f60`.
 * A random suffix prevents collisions between records created in the same millisecond.
 * (`crypto.getRandomValues` is used rather than `randomUUID` because it also works on
 * non-secure origins.)
 */
export const createId = (prefix: string): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${Date.now()}-${suffix}`;
};
