import {
  AwsResourceModel,
  INTERNAL_AWS_USER_ARNS,
  ResourceActionModel,
  UserResourceWatchlistModel,
} from "utils";
import type { UserContext } from "./identity.js";

/** Expected, user-facing failure (e.g. duplicate ARN) — never a bug. */
export class DomainError extends Error {}

export interface WatchlistResource {
  arn: string;
  actions: string[];
}

export interface WatchlistView {
  name: string;
  userId: string;
  resources: WatchlistResource[];
}

/** Write results carry non-fatal validation warnings (e.g. unknown action names). */
export interface WatchlistWriteResult extends WatchlistView {
  warnings?: string[];
}

interface WatchlistDocLike {
  name: string;
  userId: string;
  resources: { arn: string; actions: string[] }[];
}

const toView = (doc: WatchlistDocLike): WatchlistView => ({
  name: doc.name,
  userId: doc.userId,
  resources: doc.resources.map((resource) => ({
    arn: resource.arn,
    actions: [...resource.actions],
  })),
});

// ── Write validation ───────────────────────────────────────────────────────────

// Basic ARN shape: arn:partition:service:region:account:resource — region and
// account may be empty (e.g. arn:aws:s3:::bucket-name).
const ARN_REGEX = /^arn:[^:]+:[^:]+:[^:]*:[^:]*:.+$/;

/** The resource-name part of an ARN (segment after the last colon). */
const arnTail = (arn: string): string => arn.split(":").pop() ?? arn;

// Plain Levenshtein distance — inputs are short resource-name tails.
const editDistance = (a: string, b: string): number => {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const insertOrDelete = Math.min(prev[j], prev[j - 1]) + 1;
      const substitute = diagonal + (a[i - 1] === b[j - 1] ? 0 : 1);
      diagonal = prev[j];
      prev[j] = Math.min(insertOrDelete, substitute);
    }
  }
  return prev[b.length];
};

/** Closest discovered ARN of the same service, or null when nothing is close. */
const suggestSimilarArn = async (arn: string): Promise<string | null> => {
  const service = arn.split(":")[2] ?? "";
  // Internal Aura identities are excluded — never suggest an ARN we refuse to watch.
  const docs = await AwsResourceModel.find({ arn: { $nin: INTERNAL_AWS_USER_ARNS } })
    .select("arn")
    .limit(500)
    .lean()
    .exec();
  let best: { arn: string; distance: number } | null = null;
  for (const doc of docs) {
    if ((doc.arn.split(":")[2] ?? "") !== service) continue;
    const distance = editDistance(arnTail(arn).toLowerCase(), arnTail(doc.arn).toLowerCase());
    if (!best || distance < best.distance) best = { arn: doc.arn, distance };
  }
  // Only suggest near-misses — a distance above 3 is a different name, not a typo.
  return best && best.distance <= 3 ? best.arn : null;
};

/**
 * Rejects ARNs that are malformed or not in the discovered-resource catalogue.
 * Watching an undiscovered ARN would poison the diagnostics: the logic engine
 * evaluates it against empty resource data and emits confident wrong verdicts.
 * Also guards theoretical checks — evaluating fiction produces fiction.
 */
export const assertWatchableArn = async (arn: string): Promise<void> => {
  if (!ARN_REGEX.test(arn)) {
    throw new DomainError(
      `"${arn}" is not a valid ARN (expected arn:partition:service:region:account:resource)`,
    );
  }
  if (INTERNAL_AWS_USER_ARNS.includes(arn)) {
    throw new DomainError(`${arn} is an internal Aura identity and cannot be watched`);
  }
  const exists = await AwsResourceModel.exists({ arn }).exec();
  if (!exists) {
    const suggestion = await suggestSimilarArn(arn);
    throw new DomainError(
      `${arn} is not among the discovered AWS resources` +
        (suggestion ? ` — did you mean ${suggestion}?` : ".") +
        ` Use list_aws_resources to find the exact ARN; if the resource was just created, wait for the next crawl cycle.`,
    );
  }
};

/** Non-fatal warnings for action names missing from the known-actions catalogue. */
export const unknownActionWarnings = async (arn: string, actions: string[]): Promise<string[]> => {
  const serviceKey = (arn.split(":")[2] ?? "").toLowerCase();
  const docs = await ResourceActionModel.find({ resourceType: serviceKey })
    .select("actionName")
    .lean()
    .exec();
  if (docs.length === 0) return []; // nothing seeded for this service — cannot judge
  const known = new Set<string>();
  for (const doc of docs) {
    const name = doc.actionName.toLowerCase();
    known.add(name);
    const tail = name.split(":").pop();
    if (tail) known.add(tail);
  }
  return actions
    .filter((action) => !action.includes("*")) // wildcard patterns are legitimate, not listable
    .filter((action) => {
      const a = action.toLowerCase();
      return !known.has(a) && !known.has(a.split(":").pop() ?? a);
    })
    .map(
      (action) =>
        `"${action}" is not a known ${serviceKey} action (see get_resource_actions) — it will be monitored as given, but may never match a real permission.`,
    );
};

const withWarnings = (view: WatchlistView, warnings: string[]): WatchlistWriteResult =>
  warnings.length > 0 ? { ...view, warnings } : view;

// ── Reads & writes ─────────────────────────────────────────────────────────────

export const getWatchlist = async (ctx: UserContext): Promise<WatchlistView | null> => {
  const doc = await UserResourceWatchlistModel.findOne({ userId: ctx.linkedAwsUserId })
    .lean()
    .exec();
  return doc ? toView(doc) : null;
};

export const addResource = async (
  ctx: UserContext,
  arn: string,
  actions: string[],
): Promise<WatchlistWriteResult> => {
  await assertWatchableArn(arn);
  const warnings = await unknownActionWarnings(arn, actions);

  const userId = ctx.linkedAwsUserId;
  const existing = await UserResourceWatchlistModel.findOne({ userId }).lean().exec();

  if (!existing) {
    const created = await UserResourceWatchlistModel.create({
      userId,
      name: `${ctx.firstName} ${ctx.lastName}'s Watchlist`,
      resources: [{ arn, actions }],
    });
    return withWarnings(toView(created.toObject()), warnings);
  }

  if (existing.resources.some((resource) => resource.arn === arn)) {
    throw new DomainError(
      `${arn} is already on the watchlist — use update_resource_actions to change its actions`,
    );
  }

  const updated = await UserResourceWatchlistModel.findOneAndUpdate(
    { userId },
    { $push: { resources: { arn, actions } } },
    { returnDocument: "after" },
  )
    .lean()
    .exec();
  if (!updated) throw new DomainError(`${arn} could not be added — watchlist not found`);
  return withWarnings(toView(updated), warnings);
};

export const removeResource = async (ctx: UserContext, arn: string): Promise<WatchlistView> => {
  const updated = await UserResourceWatchlistModel.findOneAndUpdate(
    { userId: ctx.linkedAwsUserId, "resources.arn": arn },
    { $pull: { resources: { arn } } },
    { returnDocument: "after" },
  )
    .lean()
    .exec();
  if (!updated) throw new DomainError(`${arn} is not on the watchlist`);
  return toView(updated);
};

export const updateResourceActions = async (
  ctx: UserContext,
  arn: string,
  actions: string[],
): Promise<WatchlistWriteResult> => {
  const warnings = await unknownActionWarnings(arn, actions);
  const updated = await UserResourceWatchlistModel.findOneAndUpdate(
    { userId: ctx.linkedAwsUserId, "resources.arn": arn },
    { $set: { "resources.$.actions": actions } },
    { returnDocument: "after" },
  )
    .lean()
    .exec();
  if (!updated) throw new DomainError(`${arn} is not on the watchlist`);
  return withWarnings(toView(updated), warnings);
};
