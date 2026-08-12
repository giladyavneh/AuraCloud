import { resolveNextPath } from '@/pages/login/helpers/login.helpers';
import { describe, expect, test } from 'vitest';

describe('resolveNextPath', () => {
  test('returns the consent screen with its query string intact', () => {
    const next = '/oauth/authorize?client_id=client-1&redirect_uri=http%3A%2F%2Flocalhost%2Fcb';

    expect(resolveNextPath(next)).toBe(next);
  });

  test('returns the bare consent path', () => {
    expect(resolveNextPath('/oauth/authorize')).toBe('/oauth/authorize');
  });

  test('falls back to the default destination when no next was given', () => {
    expect(resolveNextPath(null)).toBeNull();
    expect(resolveNextPath('')).toBeNull();
  });

  // Anything accepted here becomes a navigation target on our own login page.
  test('rejects every destination that is not the consent screen', () => {
    expect(resolveNextPath('https://evil.io')).toBeNull();
    expect(resolveNextPath('//evil.io')).toBeNull();
    expect(resolveNextPath('/settings')).toBeNull();
    expect(resolveNextPath('/oauth/authorizeevil')).toBeNull();
    expect(resolveNextPath('/oauth/authorize/../../settings')).toBeNull();
    expect(resolveNextPath(' /oauth/authorize')).toBeNull();
  });
});
