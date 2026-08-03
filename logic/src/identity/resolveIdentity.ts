import type { RedisClientType } from 'utils';
import { getIAMUser, getSsoUser } from '../dataAccess.js';
import { policyRefsFromIamEntities, policyRefsFromPermissionSets, resolvePolicies } from './policyBindings.js';
import type { ResolvedIdentity } from './types.js';

function accountIdFromResourceArns(resourceArns: string[]): string {
  return resourceArns.map((arn) => arn.split(':')[4]).find(Boolean) ?? '';
}

export function collectAccessibleAwsAccountIds(userData: {
  PermissionSets?: Array<{ AccountId?: string }>;
  resolvedGroups?: Array<{ PermissionSets?: Array<{ AccountId?: string }> }>;
}): string[] {
  const ids = new Set<string>();
  for (const assignment of userData.PermissionSets ?? []) {
    if (typeof assignment?.AccountId === 'string' && assignment.AccountId) {
      ids.add(assignment.AccountId);
    }
  }
  for (const group of userData.resolvedGroups ?? []) {
    for (const assignment of group.PermissionSets ?? []) {
      if (typeof assignment?.AccountId === 'string' && assignment.AccountId) {
        ids.add(assignment.AccountId);
      }
    }
  }
  return [...ids];
}

async function getAssumedRoleIdForPermissionSets(
  permissionSets: { Name?: string }[],
  redis: RedisClientType,
): Promise<string | undefined> {
  const psName = permissionSets[0]?.Name;
  if (!psName) return undefined;

  const allRoles = await redis.hGetAll('aura:iam:roles');
  for (const [roleName, roleDataStr] of Object.entries(allRoles)) {
    if (!roleName.startsWith(`AWSReservedSSO_${psName}_`)) continue;
    try {
      const roleObj = JSON.parse(roleDataStr);
      if (roleObj.RoleId) return roleObj.RoleId;
    } catch {
      /* skip malformed role entry */
    }
  }
  return undefined;
}

async function resolveSsoIdentity(
  redis: RedisClientType,
  userId: string,
  resourceArns: string[],
): Promise<ResolvedIdentity | null> {
  const ssoUserData = await getSsoUser(redis, userId);
  if (!ssoUserData) return null;

  const resolvedPermissionSets = (ssoUserData.resolvedPermissionSets ?? []) as Record<string, unknown>[];
  const policies = await resolvePolicies(redis, policyRefsFromPermissionSets(resolvedPermissionSets));
  const accessibleAwsAccountIds = collectAccessibleAwsAccountIds(ssoUserData);

  const primaryEvaluationAccountId = accessibleAwsAccountIds[0] ?? '';
  const accountFromResourceArn = accountIdFromResourceArns(resourceArns);
  const accountId =
    (ssoUserData.accountId as string | undefined)?.trim() ||
    primaryEvaluationAccountId ||
    accountFromResourceArn ||
    '';

  const assumedRoleId = await getAssumedRoleIdForPermissionSets(resolvedPermissionSets, redis);
  const userName = ssoUserData.UserName as string | undefined;

  const identity: ResolvedIdentity = {
    source: 'sso',
    raw: ssoUserData,
    policies,
    accessibleAwsAccountIds,
    accountId,
    arn:
      (ssoUserData as { arn?: string }).arn ??
      userName ??
      `auracloud:sso:${userId}`,
  };

  if (assumedRoleId && userName) {
    identity.awsUserId = `${assumedRoleId}:${userName}`;
  }

  return identity;
}

async function resolveIamIdentity(
  redis: RedisClientType,
  userId: string,
  resourceArns: string[],
): Promise<ResolvedIdentity | null> {
  const iamUserData = await getIAMUser(redis, userId);
  if (!iamUserData) return null;

  const resolvedGroups = (iamUserData.resolvedGroups ?? []) as Record<string, unknown>[];
  const policies = await resolvePolicies(redis, policyRefsFromIamEntities(iamUserData, resolvedGroups));

  const accountFromArn = (iamUserData.Arn as string | undefined)?.split(':')[4];
  const accountId = accountFromArn ?? accountIdFromResourceArns(resourceArns) ?? '';

  const identity: ResolvedIdentity = {
    source: 'iam',
    raw: iamUserData,
    policies,
    accessibleAwsAccountIds: accountId ? [accountId] : [],
    accountId,
    arn:
      (iamUserData.Arn as string | undefined) ??
      `arn:aws:iam::${accountId}:user/${iamUserData.UserName}`,
  };

  const iamUserId = iamUserData.UserId;
  if (typeof iamUserId === 'string' && iamUserId) {
    identity.awsUserId = iamUserId;
  }

  return identity;
}

export async function resolveIdentity(
  redis: RedisClientType,
  userId: string,
  resourceArns: string[],
): Promise<ResolvedIdentity | null> {
  const ssoIdentity = await resolveSsoIdentity(redis, userId, resourceArns);
  if (ssoIdentity) return ssoIdentity;

  return resolveIamIdentity(redis, userId, resourceArns);
}

export function toEvalUser(identity: ResolvedIdentity): Record<string, unknown> {
  return {
    ...identity.raw,
    identityType: identity.source === 'sso' ? 'SSO' : 'IAM',
    policies: identity.policies,
    accessibleAwsAccountIds: identity.accessibleAwsAccountIds,
    accountId: identity.accountId,
    arn: identity.arn,
    ...(identity.awsUserId !== undefined ? { awsUserId: identity.awsUserId } : {}),
  };
}
