import { UserResourceWatchlistModel } from "utils";
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
): Promise<WatchlistView> => {
  const userId = ctx.linkedAwsUserId;
  const existing = await UserResourceWatchlistModel.findOne({ userId }).lean().exec();

  if (!existing) {
    const created = await UserResourceWatchlistModel.create({
      userId,
      name: `${ctx.firstName} ${ctx.lastName}'s Watchlist`,
      resources: [{ arn, actions }],
    });
    return toView(created.toObject());
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
  return toView(updated);
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
): Promise<WatchlistView> => {
  const updated = await UserResourceWatchlistModel.findOneAndUpdate(
    { userId: ctx.linkedAwsUserId, "resources.arn": arn },
    { $set: { "resources.$.actions": actions } },
    { returnDocument: "after" },
  )
    .lean()
    .exec();
  if (!updated) throw new DomainError(`${arn} is not on the watchlist`);
  return toView(updated);
};
