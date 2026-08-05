/** The only destination a `next` param may name — see resolveNextPath. */
const ALLOWED_NEXT_PREFIX = '/oauth/authorize';

/**
 * Restricts `?next=` to the consent screen. Anything else — an absolute URL, a
 * protocol-relative `//evil.io`, another app path — is dropped, because an
 * unrestricted `next` turns the login page into an open redirect.
 */
export const resolveNextPath = (next: string | null): string | null => {
  if (!next) return null;
  if (next !== ALLOWED_NEXT_PREFIX && !next.startsWith(`${ALLOWED_NEXT_PREFIX}?`)) return null;

  return next;
};
