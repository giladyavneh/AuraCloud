import { attemptDeepParse, print, UserResourceWatchlistModel, type RedisClientType, type UserResourceWatchlist } from 'utils';
import { RESOURCES } from 'utils/src/consts.js';
import { evaluate } from './genericEvaluator.js';

export function getUsersFromMongo(): Promise<UserResourceWatchlist[]> {
  return UserResourceWatchlistModel.find().lean<UserResourceWatchlist[]>().exec();
}

/** AWS account IDs where the principal has IAM Identity Center assignments (PermissionSet + AccountId). */
export function collectAccessibleAwsAccountIds(userData: {
  PermissionSets?: Array<{ AccountId?: string }>;
  resolvedGroups?: Array<{ PermissionSets?: Array<{ AccountId?: string }> }>;
}): string[] {
  const ids = new Set<string>();
  for (const a of userData.PermissionSets ?? []) {
    if (typeof a?.AccountId === 'string' && a.AccountId) ids.add(a.AccountId);
  }
  for (const g of userData.resolvedGroups ?? []) {
    for (const a of g.PermissionSets ?? []) {
      if (typeof a?.AccountId === 'string' && a.AccountId) ids.add(a.AccountId);
    }
  }
  return [...ids];
}

/** IAM policy-document shapes used by evaluate() / checkIdentityPolicy (Version + Statement). */
export function policiesFromResolvedPermissionSets(resolved: Record<string, unknown>[]): unknown[] {
    const policies: unknown[] = [];
    for (const permissionSet of resolved) {
        if (!permissionSet) continue;
        const inline = permissionSet.inlinePolicyDocument;
        if (inline && typeof inline === 'object') policies.push(inline);
        const attached = permissionSet.attachedIamPolicyDocuments;
        if (!Array.isArray(attached)) continue;
        for (const doc of attached) {
            if (doc && typeof doc === 'object') policies.push(doc);
        }
    }
    return policies;
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

export async function evaluateUser(user: UserResourceWatchlist, redis: RedisClientType) {
  const userData = await getSsoUser(redis, user.userId);
  if (!userData) {
    console.error(`Cannot evaluate user ${user.userId} - user data not found`);
    return { userId: user.userId, resources: [] };
  }

  const psPolicies = policiesFromResolvedPermissionSets(userData.resolvedPermissionSets ?? []);
  const accessibleAwsAccountIds = collectAccessibleAwsAccountIds(userData);

  const primaryEvaluationAccountId = accessibleAwsAccountIds[0] ?? '';

  const accountFromResourceArn = user.resources.map((r) => r.arn.split(':')[4]).find(Boolean) ?? '';
  const fallbackAccount =
    (userData as { accountId?: string }).accountId?.trim() ||
    primaryEvaluationAccountId || accountFromResourceArn || '';

  const evalUser = {
    ...userData, policies: psPolicies, accessibleAwsAccountIds,
    accountId: fallbackAccount,
    arn:
      (userData as { arn?: string }).arn ??
      userData.UserName ??
      `auracloud:sso:${user.userId}`,
  };

  const resources = user.resources.map(async (resource) => {
    const resourceType = getResourceTypeFromArn(resource.arn);
    const resourceData = await redis.hGet(`aura:resource:${resourceType}`, resource.arn);
    const parsedData = resourceData ? attemptDeepParse(resourceData) : null;
    const actionResults = resource.actions.map((action) => ({
        [action]: evaluate(parsedData ?? {}, action, evalUser),
    }));
    return { [resource.arn]: actionResults };
  });
  return { userId: user.userId, resources: await Promise.all(resources) };
}

export function getResourceTypeFromArn(arn: string): RESOURCES | 'unknown' {
  const arnParts = arn.split(':');
  if (arnParts[2] === 's3') return RESOURCES.S3_BUCKETS;
  return 'unknown';
}
