export type ResourceStatus = "healthy" | "blocked" | "stale" | "unscanned";

export const STALE_AFTER_MS = 60_000;

export interface ActionResult {
  status?: string;
  timestamp?: string;
}

/** Either a single top-level verdict or one entry per monitored action. */
export type ArnPermissionEntry = ActionResult | Record<string, ActionResult>;

const isSingleVerdict = (entry: ArnPermissionEntry): entry is ActionResult =>
  typeof (entry as ActionResult).status === "string";

const toActionResults = (entry: ArnPermissionEntry): ActionResult[] =>
  isSingleVerdict(entry) ? [entry] : Object.values(entry);

const isFresh = (result: ActionResult, now: number): boolean => {
  const evaluatedAt = result.timestamp ? Date.parse(result.timestamp) : NaN;
  // An unparseable timestamp cannot prove freshness, so it counts as stale.
  return Number.isFinite(evaluatedAt) && now - evaluatedAt <= STALE_AFTER_MS;
};

export const resolveResourceStatus = (
  entry: ArnPermissionEntry | undefined,
  now: number = Date.now(),
): ResourceStatus => {
  if (!entry) return "unscanned";

  const actionResults = toActionResults(entry);
  if (actionResults.length === 0) return "unscanned";

  // Stale outranks blocked: a verdict this old cannot be trusted either way.
  if (!actionResults.every((result) => isFresh(result, now))) return "stale";

  if (actionResults.some((result) => result.status === "error")) return "blocked";

  return "healthy";
};
