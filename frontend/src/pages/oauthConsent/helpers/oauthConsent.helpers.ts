import { MAX_PATH_DISPLAY_LENGTH } from '@/pages/oauthConsent/constants';
import type { ConsentParams } from '@/pages/oauthConsent/types/oauthConsent.types';

const DENIAL_ERROR = 'access_denied';
const DENIAL_DESCRIPTION = 'The user denied the request';

/** Messages the api-server returns when the request no longer matches a registration. */
const STALE_REQUEST_MESSAGES = ['Unregistered redirect_uri', 'Unknown client'];

/** Returns null when a parameter the authorization request cannot proceed without is absent. */
export const parseConsentParams = (search: URLSearchParams): ConsentParams | null => {
  const clientId = search.get('client_id');
  const redirectUri = search.get('redirect_uri');
  const codeChallenge = search.get('code_challenge');
  if (!clientId || !redirectUri || !codeChallenge) return null;

  const scope = search.get('scope');
  const state = search.get('state');

  return {
    clientId,
    redirectUri,
    codeChallenge,
    scopes: scope ? scope.split(' ').filter(Boolean) : [],
    state: state ?? undefined,
  };
};

/** Path plus query, ellipsised — the full string stays available in the copy field. */
export const formatRedirectPath = (url: URL): string => {
  const path = `${url.pathname}${url.search}`;
  if (path.length <= MAX_PATH_DISPLAY_LENGTH) return path;

  return `${path.slice(0, MAX_PATH_DISPLAY_LENGTH)}…`;
};

export const buildDenyUrl = (redirectUri: string, state?: string): string => {
  const url = new URL(redirectUri);
  // A registered redirect_uri may carry its own query. A `code` left in it would let a
  // client that reads the code before the error mistake a denial for an approval.
  url.searchParams.delete('code');
  url.searchParams.set('error', DENIAL_ERROR);
  url.searchParams.set('error_description', DENIAL_DESCRIPTION);
  if (state) url.searchParams.set('state', state);

  return url.href;
};

/**
 * True when approval failed because the request itself stopped being valid, which is a
 * dead end rather than something a retry can win.
 */
export const isStaleRequestError = (message: string): boolean =>
  STALE_REQUEST_MESSAGES.some((stale) => message.includes(stale));

/** Services prefix the HTTP status onto the message — see oauth.service.ts. */
export const isNotFoundError = (message: string): boolean => message.startsWith('404');
