import {
  buildDenyUrl,
  classifyRedirectUri,
  formatRedirectPath,
  isNotFoundError,
  isStaleRequestError,
  parseConsentParams,
  splitHostLabels,
} from '@/pages/oauthConsent/helpers/oauthConsent.helpers';
import { describe, expect, test } from 'vitest';

describe('parseConsentParams', () => {
  test('rejects a request missing a parameter it cannot proceed without', () => {
    const withoutChallenge = new URLSearchParams({
      client_id: 'client-1',
      redirect_uri: 'http://localhost:41234/callback',
    });

    expect(parseConsentParams(withoutChallenge)).toBeNull();
  });

  test('carries state and scopes through when they are present', () => {
    const search = new URLSearchParams({
      client_id: 'client-1',
      redirect_uri: 'http://localhost:41234/callback',
      code_challenge: 'challenge',
      state: 'state-123',
      scope: 'full',
    });

    expect(parseConsentParams(search)).toEqual({
      clientId: 'client-1',
      redirectUri: 'http://localhost:41234/callback',
      codeChallenge: 'challenge',
      scopes: ['full'],
      state: 'state-123',
    });
  });
});

describe('classifyRedirectUri', () => {
  test('calls a loopback destination local', () => {
    expect(classifyRedirectUri('http://localhost:41234/callback', true)).toBe('local');
    expect(classifyRedirectUri('http://127.0.0.1:41234/callback', true)).toBe('local');
    expect(classifyRedirectUri('http://[::1]:41234/callback', true)).toBe('local');
  });

  test('calls anything else remote', () => {
    expect(classifyRedirectUri('https://claude.ai/callback', true)).toBe('remote');
  });

  // Everything downstream keys off this: blocked renders no Approve and never redirects.
  test('blocks an unregistered redirect_uri however local it looks', () => {
    expect(classifyRedirectUri('http://localhost:41234/callback', false)).toBe('blocked');
  });

  test('blocks a redirect_uri that is not a URL at all', () => {
    expect(classifyRedirectUri('not a url', true)).toBe('blocked');
  });

  // A custom scheme parses, registers and matches, but has no host — the destination
  // panel and the acknowledgement would both render blank.
  test('blocks a registered redirect_uri with no host to show', () => {
    expect(classifyRedirectUri('com.example.app:/oauth2redirect', true)).toBe('blocked');
  });

  // DNS resolves a trailing-dot host normally, so this must not read as remote.
  test('treats a trailing-dot loopback host as local', () => {
    expect(classifyRedirectUri('http://localhost./cb', true)).toBe('local');
  });
});

describe('splitHostLabels', () => {
  // The whole point of the split: the bright text is the host that actually receives
  // the code, not the trusted-looking prefix an attacker prepended to it.
  test('dims everything before the last two labels', () => {
    expect(splitHostLabels('login.auracloud.com.evil.io')).toEqual({
      dim: 'login.auracloud.com.',
      emphasised: 'evil.io',
    });
  });

  test('keeps a port attached to the emphasised tail', () => {
    expect(splitHostLabels('a.b.evil.io:8443')).toEqual({
      dim: 'a.b.',
      emphasised: 'evil.io:8443',
    });
  });

  test('never splits an address — localhost, IPv4 and IPv6 render whole', () => {
    expect(splitHostLabels('localhost:5173')).toEqual({ dim: '', emphasised: 'localhost:5173' });
    expect(splitHostLabels('127.0.0.1:5173')).toEqual({ dim: '', emphasised: '127.0.0.1:5173' });
    expect(splitHostLabels('[::1]:5173')).toEqual({ dim: '', emphasised: '[::1]:5173' });
  });

  test('leaves a bare two-label host fully emphasised', () => {
    expect(splitHostLabels('claude.ai')).toEqual({ dim: '', emphasised: 'claude.ai' });
  });

  // URL keeps the DNS root dot. Counting it as a label would shift the window by one and
  // invert the control — dimming `evil.io` and emphasising a meaningless `io.`.
  test('a trailing dot does not shift which labels are emphasised', () => {
    expect(splitHostLabels('login.auracloud.com.evil.io.')).toEqual({
      dim: 'login.auracloud.com.',
      emphasised: 'evil.io.',
    });
    expect(splitHostLabels('localhost.')).toEqual({ dim: '', emphasised: 'localhost.' });
  });

  test('a host-less destination is never rendered, but does not throw if reached', () => {
    expect(splitHostLabels('')).toEqual({ dim: '', emphasised: '' });
  });

  // Pins the ceiling the ponytail comment names: this is wrong, and deliberately so.
  // If it ever starts emphasising `bbc.co.uk`, someone added the Public Suffix List.
  test('emphasises the public suffix for a .co.uk host — the known eTLD ceiling', () => {
    expect(splitHostLabels('bbc.co.uk')).toEqual({ dim: 'bbc.', emphasised: 'co.uk' });
  });
});

describe('formatRedirectPath', () => {
  test('ellipsises a query long enough to crowd out the origin', () => {
    const url = new URL(`https://evil.io/cb?data=${'x'.repeat(200)}`);

    const formatted = formatRedirectPath(url);

    expect(formatted.endsWith('…')).toBe(true);
    expect(formatted.length).toBeLessThan(url.pathname.length + url.search.length);
  });

  test('leaves a short path alone', () => {
    expect(formatRedirectPath(new URL('http://localhost:41234/callback'))).toBe('/callback');
  });
});

describe('buildDenyUrl', () => {
  test('answers the waiting client with access_denied and echoes state', () => {
    const denyUrl = new URL(buildDenyUrl('http://localhost:41234/callback', 'state-123'));

    expect(denyUrl.searchParams.get('error')).toBe('access_denied');
    expect(denyUrl.searchParams.get('state')).toBe('state-123');
  });

  test('omits state when the request carried none', () => {
    const denyUrl = new URL(buildDenyUrl('http://localhost:41234/callback'));

    expect(denyUrl.searchParams.has('state')).toBe(false);
  });

  // A registered redirect_uri may carry its own query. Our answer has to win, and a
  // pre-seeded `code` must not survive into a denial a client could read as success.
  test('overwrites an error and strips a code the redirect_uri already carried', () => {
    const denyUrl = new URL(
      buildDenyUrl('http://localhost:41234/callback?error=nope&code=planted&keep=me'),
    );

    expect(denyUrl.searchParams.getAll('error')).toEqual(['access_denied']);
    expect(denyUrl.searchParams.has('code')).toBe(false);
    expect(denyUrl.searchParams.get('keep')).toBe('me');
  });
});

describe('approval error classification', () => {
  // These literals must keep matching the OAuthError messages approveAuthorization
  // throws. A drift turns the dead end into a retry the user cannot win.
  test('recognises the errors that mean the request itself went stale', () => {
    expect(isStaleRequestError('400: Unregistered redirect_uri')).toBe(true);
    expect(isStaleRequestError('400: Unknown client')).toBe(true);
  });

  test('leaves a retryable failure retryable', () => {
    expect(isStaleRequestError('500: Server Error')).toBe(false);
    expect(isStaleRequestError('Failed to fetch')).toBe(false);
  });

  test('spots the 404 that means the client is not registered at all', () => {
    expect(isNotFoundError('404: Unknown client')).toBe(true);
    expect(isNotFoundError('500: Server Error')).toBe(false);
    expect(isNotFoundError('Failed to fetch')).toBe(false);
  });
});
