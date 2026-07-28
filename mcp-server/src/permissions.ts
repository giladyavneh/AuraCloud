import { UserPermissionModel } from "utils";
import type { UserContext } from "./identity.js";
import { getWatchlist } from "./watchlist.js";

interface StoredActionResult {
  status?: string;
  reason?: string | null;
  timestamp?: string;
  details?: unknown;
}

export interface PermissionStatusFilters {
  arn?: string;
  action?: string;
  status?: "valid" | "error";
  includeDetails?: boolean;
}

export interface ActionStatusView {
  action: string;
  status: string;
  reason: string | null;
  evaluatedAt?: string;
  details?: unknown;
}

export interface ResourceStatusView {
  arn: string;
  actions: ActionStatusView[];
}

export interface PermissionStatusResult {
  exists: boolean;
  userId: string;
  name?: string;
  lastEvaluatedAt?: string;
  /** Always reflects the full watchlist evaluation, regardless of filters. */
  summary?: { resources: number; actions: number; valid: number; blocked: number };
  resources?: ResourceStatusView[];
  message?: string;
}

// logic/src/index.ts stores each action under its canonical name (e.g. "s3:GetObject")
// AND a camelCase alias ("getObject") kept for frontend compatibility. Reproduce the
// alias formula so the duplicates can be dropped and only canonical entries returned.
// Known trade-off: a watched action whose literal name equals another action's alias
// (e.g. "getObject" watched next to "s3:GetObject") is indistinguishable from that
// alias — the writer already collides on the key — so it is dropped here too. The
// root fix is removing the alias write in logic/src/index.ts.
const camelCaseAliasOf = (actionName: string): string => {
  const tail = actionName.split(":").pop() ?? actionName;
  return tail.charAt(0).toLowerCase() + tail.slice(1);
};

const canonicalActionNames = (actionMap: Record<string, unknown>): string[] => {
  const keys = Object.keys(actionMap);
  const aliases = new Set<string>();
  for (const key of keys) {
    const alias = camelCaseAliasOf(key);
    if (alias !== key) aliases.add(alias);
  }
  return keys.filter((key) => !aliases.has(key));
};

// Forgiving action match in both directions: filter "GetObject" hits stored
// "s3:GetObject", and filter "s3:GetObject" hits a stored bare "GetObject".
// Two different service prefixes never match each other.
const actionMatches = (actionName: string, filter: string): boolean => {
  const name = actionName.toLowerCase();
  const wanted = filter.toLowerCase();
  return (
    name === wanted ||
    name.split(":").pop() === wanted ||
    name === wanted.split(":").pop()
  );
};

const noResultsMessage = async (ctx: UserContext): Promise<string> => {
  const watchlist = await getWatchlist(ctx);
  const watchedCount = watchlist?.resources.length ?? 0;
  if (watchedCount === 0) {
    return "No evaluation results: the watchlist is empty. Add resources with add_watchlist_resource first.";
  }
  return `No evaluation results yet for the ${watchedCount} watched resource(s) — the AuraCloud logic service may not be running or hasn't completed an evaluation cycle.`;
};

export const getPermissionStatus = async (
  ctx: UserContext,
  filters: PermissionStatusFilters,
): Promise<PermissionStatusResult> => {
  const doc = await UserPermissionModel.findOne({ userId: ctx.linkedAwsUserId }).lean().exec();

  if (!doc || !doc.permissionsData || Object.keys(doc.permissionsData).length === 0) {
    return {
      exists: false,
      userId: ctx.linkedAwsUserId,
      message: await noResultsMessage(ctx),
    };
  }

  const permissionsData = doc.permissionsData as Record<string, Record<string, StoredActionResult>>;

  const summary = { resources: 0, actions: 0, valid: 0, blocked: 0 };
  const resources: ResourceStatusView[] = [];

  for (const [arn, actionMap] of Object.entries(permissionsData)) {
    if (!actionMap || typeof actionMap !== "object") continue;
    summary.resources++;
    // ARNs are case-sensitive — exact match only (get_watchlist returns exact ARNs).
    const arnMatch = !filters.arn || arn === filters.arn;

    const views: ActionStatusView[] = [];
    for (const actionName of canonicalActionNames(actionMap)) {
      const result = actionMap[actionName];
      const status = result.status ?? "unknown";
      // The summary always covers the full watchlist, so count before filtering.
      summary.actions++;
      if (status === "valid") summary.valid++;
      if (status === "error") summary.blocked++;

      if (!arnMatch) continue;
      if (filters.status && status !== filters.status) continue;
      if (filters.action && !actionMatches(actionName, filters.action)) continue;

      views.push({
        action: actionName,
        status,
        reason: result.reason ?? null,
        ...(filters.includeDetails
          ? { evaluatedAt: result.timestamp, details: result.details }
          : {}),
      });
    }

    if (!arnMatch) continue;
    // Keep a resource with zero matching actions only when nothing filtered it out
    // (a watched resource with no monitored actions is itself useful information).
    if (views.length > 0 || (!filters.action && !filters.status)) {
      resources.push({ arn, actions: views });
    }
  }

  const filtered = Boolean(filters.arn || filters.action || filters.status);
  return {
    exists: true,
    userId: doc.userId,
    name: doc.name,
    lastEvaluatedAt: (doc as { updatedAt?: Date }).updatedAt?.toISOString(),
    summary,
    resources,
    ...(resources.length === 0 && filtered
      ? { message: "No watched actions match the given filters." }
      : {}),
  };
};
