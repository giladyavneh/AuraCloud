import mongoose from 'mongoose';
import { CustomerModel, UserResourceWatchlistModel, type RedisClientType, type UserResourceWatchlist } from 'utils';

// UserResourceWatchlist enriched with the customer's linked AWS SSO user ID.
// The watchlist stores customer._id as userId; we need the AWS identity ID
// to look up the SSO user in Redis and write UserPermission docs correctly.
export interface EnrichedWatchlist extends UserResourceWatchlist {
  linkedAwsUserId: string;
}

// Returns true only when the string is a 24-char hex MongoDB ObjectId.
function isObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
}

export async function getUsersFromMongo(): Promise<EnrichedWatchlist[]> {
  const watchlists = await UserResourceWatchlistModel.find().lean<UserResourceWatchlist[]>().exec();

  const enriched: EnrichedWatchlist[] = [];
  for (const watchlist of watchlists) {
    const rawUserId = String(watchlist.userId);

    // Legacy watchlists (created before the manager/employee rework) stored the
    // AWS SSO user ID directly as userId rather than the MongoDB customer._id.
    // Detect these by checking whether the value is a valid ObjectId.
    if (!isObjectId(rawUserId)) {
      enriched.push({ ...watchlist, linkedAwsUserId: rawUserId });
      continue;
    }

    const customer = await CustomerModel.findById(rawUserId).lean();
    if (!customer?.linkedAwsUserId) {
      console.warn(`[dataAccess] Customer ${rawUserId} has no linkedAwsUserId — skipping watchlist`);
      continue;
    }
    enriched.push({ ...watchlist, linkedAwsUserId: customer.linkedAwsUserId });
  }
  return enriched;
}

export async function getSsoUser(redis: RedisClientType, userId: string) {
  const rawUser = await redis.hGet('aura:sso:users', userId);

  if (!rawUser) {
    console.error(`User ${userId} not found in 'aura:sso:users'`);
    return null;
  }

  const userData = JSON.parse(rawUser);

  if (userData.GroupMemberships?.length) {
    const groupPromises = userData.GroupMemberships.map((groupId: string) =>
      redis.hGet('aura:sso:groups', groupId),
    );
    const rawGroups = await Promise.all(groupPromises);
    userData.resolvedGroups = rawGroups.filter(Boolean).map((g) => JSON.parse(g!));
  }

  const psArns = new Set<string>();
  for (const ps of userData.PermissionSets ?? []) {
    const arn = ps?.PermissionSetArn;
    if (typeof arn === 'string' && arn) psArns.add(arn);
  }
  for (const group of userData.resolvedGroups ?? []) {
    for (const ps of group.PermissionSets ?? []) {
      const arn = ps?.PermissionSetArn;
      if (typeof arn === 'string' && arn) psArns.add(arn);
    }
  }

  if (psArns.size > 0) {
    const rawPS = await Promise.all([...psArns].map((arn) => redis.hGet('aura:sso:permission-sets', arn)));
    userData.resolvedPermissionSets = rawPS.filter(Boolean).map((p) => JSON.parse(p!));
  } else {
    userData.resolvedPermissionSets = [];
  }

  return userData;
}

export function getResourceField(
  redis: RedisClientType,
  resourceType: string,
  arn: string,
): Promise<string | null> {
  return redis.hGet(`aura:resource:${resourceType}`, arn);
}
