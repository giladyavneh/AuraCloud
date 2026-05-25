import type { WatchlistResource } from '@/pages/resourceWatchlist/types/resourceWatchlist.types';

/**
 * Tries to parse a JSON string into a WatchlistResource array.
 * Returns the parsed array if valid, or null if parsing fails.
 */
export const parseWatchlistJson = (json: string): WatchlistResource[] | null => {
  try {
    const parsed: unknown = JSON.parse(json);

    if (!Array.isArray(parsed)) return null;

    const isValid = parsed.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).arn === 'string' &&
        Array.isArray((item as Record<string, unknown>).actions) &&
        ((item as Record<string, unknown>).actions as unknown[]).every(
          (a) => typeof a === 'string'
        )
    );

    if (!isValid) return null;

    return parsed as WatchlistResource[];
  } catch {
    return null;
  }
};

/**
 * Converts a WatchlistResource array to a pretty-printed JSON string.
 */
export const watchlistToJson = (resources: WatchlistResource[]): string => {
  const simplified = resources.map(({ arn, actions }) => ({ arn, actions }));
  return JSON.stringify(simplified, null, 2);
};
