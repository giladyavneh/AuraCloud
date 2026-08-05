import { MAX_PATH_DISPLAY_LENGTH } from '@/pages/oauthConsent/constants';
import type {
  ConsentParams,
  HostLabels,
  RedirectClass,
} from '@/pages/oauthConsent/types/oauthConsent.types';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;
const PORT_SUFFIX = /:\d+$/;
const TRAILING_DOT = /\.$/;
const DENIAL_ERROR = 'access_denied';
const DENIAL_DESCRIPTION = 'The user denied the request';

/** Messages the api-server returns when the request no longer matches a registration. */
const STALE_REQUEST_MESSAGES = ['Unregistered redirect_uri', 'Unknown client'];

export const parseRedirectUri = (redirectUri: string): URL | null => {
  try {
    return new URL(redirectUri);
  } catch {
    return null;
  }
};

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

/**
 * `URL` keeps the trailing DNS root dot, so it has to come off before any comparison —
 * `localhost.` is the same machine as `localhost`, and leaving the dot on shifts the
 * label window in splitHostLabels by one.
 */
const toComparableHostname = (host: string): string =>
  host.replace(PORT_SUFFIX, '').replace(TRAILING_DOT, '');

export const classifyRedirectUri = (redirectUri: string, isRegistered: boolean): RedirectClass => {
  if (!isRegistered) return 'blocked';

  const url = parseRedirectUri(redirectUri);
  if (!url) return 'blocked';
  // A custom scheme like `com.example.app:/cb` parses and can be registered, but has no
  // host to show. The whole screen is built on displaying one, so there is nothing to
  // consent to — send it to the dead end rather than render a blank destination.
  if (!url.host) return 'blocked';

  return LOCAL_HOSTNAMES.includes(toComparableHostname(url.hostname)) ? 'local' : 'remote';
};

/**
 * Splits `host` so only the registrable part reads as the destination:
 * `login.auracloud.com.evil.io` becomes a dim `login.auracloud.com.` and a bright
 * `evil.io`. Subdomain spoofing is the cheapest consent-phishing trick there is, and
 * dimming the prefix is what defeats it. IPs and localhost are never split — labelling
 * an address is meaningless.
 *
 * ponytail: last-two-labels is a naive eTLD heuristic and emphasises `co.uk` for a
 * `.co.uk` host. Getting it right needs the Public Suffix List, a dependency for a
 * cosmetic edge case on a screen whose safe path is localhost. Add it if hosted
 * clients ever become the common case.
 */
export const splitHostLabels = (host: string): HostLabels => {
  const hostname = toComparableHostname(host);
  const isAddress =
    LOCAL_HOSTNAMES.includes(hostname) || IPV4_PATTERN.test(hostname) || hostname.startsWith('[');

  const labels = hostname.split('.');
  if (isAddress || labels.length <= 2) return { dim: '', emphasised: host };

  const dim = `${labels.slice(0, labels.length - 2).join('.')}.`;

  return { dim, emphasised: host.slice(dim.length) };
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
