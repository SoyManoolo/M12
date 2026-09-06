import { describe, expect, it } from 'vitest';
import { sanitizeUserText } from './sanitize';

describe('sanitizeUserText', () => {
  it('removes tags and event handlers from user content', () => {
    expect(sanitizeUserText('<img src=x onerror=alert(1)>Hola <strong>FriendsGo</strong>')).toBe('Hola FriendsGo');
  });

  it('keeps plain text intact', () => {
    expect(sanitizeUserText('Texto normal con emojis ✨')).toBe('Texto normal con emojis ✨');
  });
});
