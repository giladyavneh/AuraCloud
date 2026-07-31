/** True when `err` is a MongoDB duplicate-key error (code 11000). */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  );
}

/** True when `resources` matches the shared UserResourceWatchlist/WatchlistPreset shape. */
export function isValidResourcesShape(
  resources: unknown,
): resources is { arn: string; actions: string[] }[] {
  if (!Array.isArray(resources)) return false;

  return resources.every((resource) => {
    if (typeof resource !== "object" || resource === null) return false;

    const { arn, actions } = resource as { arn?: unknown; actions?: unknown };
    if (typeof arn !== "string") return false;
    if (!Array.isArray(actions)) return false;

    return actions.every((action) => typeof action === "string");
  });
}
