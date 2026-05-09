import { UserResourceWatchlistModel, type RedisClientType, type UserResourceWatchlist } from 'utils';

export function getUsersFromMongo(): Promise<UserResourceWatchlist[]> {
  return UserResourceWatchlistModel.find().lean<UserResourceWatchlist[]>().exec();
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
