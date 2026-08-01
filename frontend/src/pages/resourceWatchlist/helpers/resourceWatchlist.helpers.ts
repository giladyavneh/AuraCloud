import type { WatchlistResource } from '@/pages/resourceWatchlist/types/resourceWatchlist.types';

/**
 * Tries to parse a JSON string into a WatchlistResource array.
 * Returns the parsed array if valid, or null if parsing fails.
 */
export const parseWatchlistJson = (json: string): WatchlistResource[] | null => {
  try {
    const parsed: unknown = JSON.parse(json);

    if (!Array.isArray(parsed)) return null;

    const isValid = parsed.every((item) => {
      if (typeof item !== 'object' || item === null) return false;

      const { arn, actions } = item as Record<string, unknown>;
      if (typeof arn !== 'string') return false;
      if (!Array.isArray(actions)) return false;

      return actions.every((action) => typeof action === 'string');
    });

    if (!isValid) return null;

    return parsed as WatchlistResource[];
  } catch {
    return null;
  }
};

/**
 * Normalises a resource list into a stable, comparable shape — sorted by ARN and
 * stripped of anything but arn/actions — so drafts can be diffed against saved data.
 */
export const toComparableResources = (
  resources: WatchlistResource[],
): { arn: string; actions: string[] }[] =>
  [...resources]
    .sort((first, second) => first.arn.localeCompare(second.arn))
    .map((resource) => ({ arn: resource.arn, actions: resource.actions }));

/**
 * Converts a WatchlistResource array to a pretty-printed JSON string.
 */
export const watchlistToJson = (resources: WatchlistResource[]): string => {
  const simplified = resources.map(({ arn, actions }) => ({ arn, actions }));
  return JSON.stringify(simplified, null, 2);
};
