import { attemptDeepParse, type RedisClientType, type UserResourceWatchlist } from 'utils';
import { RESOURCES } from 'utils/src/consts.js';
import { getResourceField, getSsoUser } from './dataAccess.js';
import { evaluate } from './evaluator.js';

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

export async function evaluateUser(user: UserResourceWatchlist, redis: RedisClientType) {
  const userData = await getSsoUser(redis, user.userId);
  if (!userData) {
    console.warn(`User data not found in Redis for user ${user.userId}. Actions will be marked as 'stale'.`);
    const resources = user.resources.map(async (resource) => {
      const actionResults = resource.actions.map((action) => ({
        [action]: 'stale',
      }));
      return { [resource.arn]: actionResults };
    });
    return { userId: user.userId, resources: await Promise.all(resources) };
  }

  const psPolicies = policiesFromResolvedPermissionSets(userData.resolvedPermissionSets ?? []);
  const accessibleAwsAccountIds = collectAccessibleAwsAccountIds(userData);

  const primaryEvaluationAccountId = accessibleAwsAccountIds[0] ?? '';

  const accountFromResourceArn = user.resources.map((r) => r.arn.split(':')[4]).find(Boolean) ?? '';
  const fallbackAccount =
    (userData as { accountId?: string }).accountId?.trim() ||
    primaryEvaluationAccountId ||
    accountFromResourceArn ||
    '';

  // Reconstruct real assumed role unique ID if possible
  let assumedRoleId = '';
  if (userData.resolvedPermissionSets?.length) {
    const psName = userData.resolvedPermissionSets[0]?.Name;
    if (psName) {
      const allRoles = await redis.hGetAll('aura:iam:roles');
      for (const [roleName, roleDataStr] of Object.entries(allRoles)) {
        if (roleName.startsWith(`AWSReservedSSO_${psName}_`)) {
          try {
            const roleObj = JSON.parse(roleDataStr);
            if (roleObj.RoleId) {
              assumedRoleId = roleObj.RoleId;
              break;
            }
          } catch {}
        }
      }
    }
  }

  const evalUser = {
    ...userData,
    policies: psPolicies,
    accessibleAwsAccountIds,
    accountId: fallbackAccount,
    awsUserId: assumedRoleId && userData.UserName ? `${assumedRoleId}:${userData.UserName}` : undefined,
    arn:
      (userData as { arn?: string }).arn ??
      userData.UserName ??
      `auracloud:sso:${user.userId}`,
  };

  const resources = user.resources.map(async (resource) => {
    const resourceType = getResourceTypeFromArn(resource.arn);
    const resourceData = await getResourceField(redis, resourceType, resource.arn);
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
