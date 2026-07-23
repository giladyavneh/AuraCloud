import { CustomerModel, WatchlistPresetModel, UserResourceWatchlistModel } from "./db.js";

export interface WatchlistResource {
  arn: string;
  actions: string[];
}

/**
 * Additively merges `incoming` resource entries into `existing`, unioning
 * `actions` per `arn` (if the arn already exists) or appending the entry
 * (if it doesn't). Never mutates its inputs.
 */
export function mergeResourceLists(
  existing: WatchlistResource[],
  incoming: WatchlistResource[],
): WatchlistResource[] {
  const merged = existing.map((r) => ({ arn: r.arn, actions: [...r.actions] }));
  for (const { arn, actions } of incoming) {
    const target = merged.find((r) => r.arn === arn);
    if (target) {
      for (const action of actions) {
        if (!target.actions.includes(action)) target.actions.push(action);
      }
    } else {
      merged.push({ arn, actions: [...actions] });
    }
  }
  return merged;
}

/**
 * Resolves the resources a member should inherit from presets: their individual
 * preset unioned with their team's preset (if any), merged additively. Read-only
 * — computes nothing about their existing watchlist. Returns [] when the customer
 * doesn't exist or has no applicable presets.
 */
export async function resolveMemberPresetResources(customerId: string): Promise<WatchlistResource[]> {
  const customer = await CustomerModel.findById(customerId).lean();
  if (!customer) return [];

  const scopeFilters: { scopeType: "team" | "individual"; scopeId: string }[] = [
    { scopeType: "individual", scopeId: customerId },
  ];
  if (customer.teamId) scopeFilters.push({ scopeType: "team", scopeId: customer.teamId });

  const presets = await WatchlistPresetModel.find({ $or: scopeFilters }).lean();
  return presets.reduce<WatchlistResource[]>(
    (acc, preset) =>
      mergeResourceLists(
        acc,
        preset.resources.map((r) => ({ arn: r.arn, actions: r.actions ?? [] })),
      ),
    [],
  );
}

/**
 * Copies a member's team preset and/or individual preset (if any) into
 * their real UserResourceWatchlist doc, additively (see SPEC §3). Called
 * from both the team-assign handler and the link-aws-user handler.
 *
 * No-op if the customer doesn't exist or has no applicable presets. Never
 * retracts existing resources — only unions new ones in.
 */
export async function applyPresetsToMember(customerId: string, awsUserId: string): Promise<void> {
  const customer = await CustomerModel.findById(customerId).lean();
  if (!customer) return;

  const presetResources = await resolveMemberPresetResources(customerId);
  if (presetResources.length === 0) return;

  const existing = await UserResourceWatchlistModel.findOne({ userId: awsUserId }).lean();
  const existingResources = existing?.resources.map((r) => ({ arn: r.arn, actions: r.actions ?? [] })) ?? [];
  const mergedResources = mergeResourceLists(existingResources, presetResources);

  if (existing) {
    await UserResourceWatchlistModel.updateOne({ _id: existing._id }, { resources: mergedResources });
  } else {
    await UserResourceWatchlistModel.create({
      userId: awsUserId,
      name: `${customer.firstName} ${customer.lastName}'s Watchlist`,
      resources: mergedResources,
    });
  }
}
