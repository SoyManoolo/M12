import { describe, expect, it } from 'vitest';
import { isTokenExpired } from './token';

function tokenWithExpiry(exp: number): string {
  return `header.${btoa(JSON.stringify({ user_id: 'user-1', username: 'ana', exp }))}.signature`;
}

describe('isTokenExpired', () => {
  it('identifies expired tokens', () => {
    expect(isTokenExpired(tokenWithExpiry(Math.floor(Date.now() / 1000) - 60))).toBe(true);
  });

  it('keeps valid tokens active', () => {
    expect(isTokenExpired(tokenWithExpiry(Math.floor(Date.now() / 1000) + 60))).toBe(false);
  });
});
