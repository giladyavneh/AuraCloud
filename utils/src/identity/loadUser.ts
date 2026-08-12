import type { RedisClientType } from 'redis';

export async function getSsoUser(redis: RedisClientType, userId: string): Promise<Record<string, unknown> | null> {
  const rawUser = await redis.hGet('aura:sso:users', userId);
  if (!rawUser) return null;

  const userData = JSON.parse(rawUser) as Record<string, unknown>;

  const groupMemberships = userData.GroupMemberships;
  if (Array.isArray(groupMemberships) && groupMemberships.length > 0) {
    const rawGroups = await Promise.all(
      groupMemberships.map((groupId) =>
        typeof groupId === 'string' ? redis.hGet('aura:sso:groups', groupId) : Promise.resolve(null),
      ),
    );
    userData.resolvedGroups = rawGroups
      .filter((group): group is string => typeof group === 'string')
      .map((group) => JSON.parse(group));
  }

  const psArns = new Set<string>();
  const collectPermissionSetArns = (assignments: unknown) => {
    if (!Array.isArray(assignments)) return;
    for (const assignment of assignments) {
      if (!assignment || typeof assignment !== 'object') continue;
      const arn = (assignment as { PermissionSetArn?: unknown }).PermissionSetArn;
      if (typeof arn === 'string' && arn) psArns.add(arn);
    }
  };
  collectPermissionSetArns(userData.PermissionSets);
  if (Array.isArray(userData.resolvedGroups)) {
    for (const group of userData.resolvedGroups) {
      if (group && typeof group === 'object') {
        collectPermissionSetArns((group as { PermissionSets?: unknown }).PermissionSets);
      }
    }
  }

  if (psArns.size > 0) {
    const rawPermissionSets = await Promise.all(
      [...psArns].map((arn) => redis.hGet('aura:sso:permission-sets', arn)),
    );
    userData.resolvedPermissionSets = rawPermissionSets
      .filter((permissionSet): permissionSet is string => typeof permissionSet === 'string')
      .map((permissionSet) => JSON.parse(permissionSet));
  } else {
    userData.resolvedPermissionSets = [];
  }

  return userData;
}

export async function getIAMUser(redis: RedisClientType, userId: string): Promise<Record<string, unknown> | null> {
  const rawUser = await redis.hGet('aura:iam:users', userId);
  if (!rawUser) return null;

  const userData = JSON.parse(rawUser) as Record<string, unknown>;
  const groupNames = userData.Groups;

  if (Array.isArray(groupNames) && groupNames.length > 0) {
    // Known limitation (Tenancy Hardening): `aura:iam:groups` is keyed by bare GroupName, which is only unique
    // per AWS account and shared across tenants. In multi-tenant environments, group names (e.g. 'Developers')
    // could collide across accounts. Future fix: key by group ARN or prefix by company/account ID.
    const rawGroups = await Promise.all(
      groupNames.map((groupName) =>
        typeof groupName === 'string' ? redis.hGet('aura:iam:groups', groupName) : Promise.resolve(null),
      ),
    );
    userData.resolvedGroups = rawGroups
      .filter((group): group is string => typeof group === 'string')
      .map((group) => JSON.parse(group));
  } else {
    userData.resolvedGroups = [];
  }

  return userData;
}
