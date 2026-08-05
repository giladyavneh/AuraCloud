// Evaluation-subject assembly shared by the logic service (continuous watchlist
// evaluation) and the mcp-server (on-demand theoretical checks): reads crawled
// identity/resource state from Redis and shapes it for the evaluator.
import type { RedisClientType } from 'redis';
import { RESOURCES } from './consts.js';
import { evaluate, type EvaluationResult } from './evaluator.js';
import { attemptDeepParse } from './utils.js';

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

function collectAccessibleAwsAccountIds(userData: {
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

function policiesFromResolvedPermissionSets(resolved: Record<string, unknown>[]): unknown[] {
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

async function getAssumedRoleIdForPermissionSets(permissionSets: { Name?: string }[], redis: RedisClientType): Promise<string | undefined> {
  const psName = permissionSets[0]?.Name;
  if (psName) {
    const allRoles = await redis.hGetAll('aura:iam:roles');
    for (const [roleName, roleDataStr] of Object.entries(allRoles)) {
      if (roleName.startsWith(`AWSReservedSSO_${psName}_`)) {
        try {
          const roleObj = JSON.parse(roleDataStr);
          if (roleObj.RoleId) {
            return roleObj.RoleId;
          }
        } catch {}
      }
    }
  }
}

/**
 * Assemble the evaluation subject for an AWS user from crawled Redis state:
 * policies from resolved permission sets, the accessible-account pool, the
 * account-id fallback chain, and the reconstructed assumed-role id.
 * `fallbackAccountId` is the caller's last-resort account (logic derives it
 * from the watched resource ARNs; theoretical checks from the target ARN).
 * Returns null when the user has no crawled identity data yet.
 */
export async function buildEvaluationSubject(
  redis: RedisClientType,
  awsUserId: string,
  fallbackAccountId = '',
) {
  const userData = await getSsoUser(redis, awsUserId);
  if (!userData) return null;

  const psPolicies = policiesFromResolvedPermissionSets(userData.resolvedPermissionSets ?? []);
  const accessibleAwsAccountIds = collectAccessibleAwsAccountIds(userData);

  const primaryEvaluationAccountId = accessibleAwsAccountIds[0] ?? '';
  const fallbackAccount = userData.accountId?.trim() || primaryEvaluationAccountId || fallbackAccountId || '';

  // Reconstruct real assumed role unique ID if possible
  const assumedRoleId = await getAssumedRoleIdForPermissionSets(userData.resolvedPermissionSets ?? [], redis);

  return {
    ...userData,
    policies: psPolicies,
    accessibleAwsAccountIds,
    accountId: fallbackAccount,
    awsUserId: assumedRoleId && userData.UserName ? `${assumedRoleId}:${userData.UserName}` : undefined,
    arn:
      (userData as { arn?: string }).arn ??
      userData.UserName ??
      `auracloud:sso:${awsUserId}`,
  };
}

export function getResourceTypeFromArn(arn: string): RESOURCES | 'unknown' {
  const arnParts = arn.split(':');
  if (arnParts[2] === 's3') return RESOURCES.S3_BUCKETS;
  return 'unknown';
}

/**
 * Fetch one resource's crawled data and evaluate a set of actions against an
 * assembled subject. This is the single shared step behind both the logic
 * service's stored verdicts and mcp-server's theoretical checks — keeping the
 * fetch/parse/evaluate contract in one place so the two can never diverge.
 */
export async function evaluateResourceActions(
  redis: RedisClientType,
  arn: string,
  actions: string[],
  subject: Record<string, unknown>,
): Promise<Record<string, EvaluationResult>> {
  const resourceType = getResourceTypeFromArn(arn);
  const resourceData = await getResourceField(redis, resourceType, arn);
  const parsedData = resourceData ? attemptDeepParse(resourceData) : null;
  return Object.fromEntries(
    actions.map((action) => [action, evaluate(parsedData ?? {}, action, subject)]),
  );
}
