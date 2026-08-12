import type { HostLabels, RedirectClass } from '@/types/redirectUri.types';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;
const PORT_SUFFIX = /:\d+$/;
const TRAILING_DOT = /\.$/;

export const parseRedirectUri = (redirectUri: string): URL | null => {
  try {
    return new URL(redirectUri);
  } catch {
    return null;
  }
};

/**
 * Host and port — what a person recognises a client by. Falls back to the raw string,
 * which a custom scheme like `com.example.app:/cb` needs too: it parses, but its host is
 * an empty string, and an empty identity is the substitution the split display prevents.
 */
export const redirectUriHost = (redirectUri: string): string => {
  const host = parseRedirectUri(redirectUri)?.host;

  return host || redirectUri;
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
