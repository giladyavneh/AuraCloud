import type { RedisClientType } from 'utils';
import { getPolicyDocuments } from '../policyCache.js';
import type { PolicyRefs } from './types.js';

function emptyPolicyRefs(): PolicyRefs {
  return { inlineDocuments: [], attachedArns: [] };
}

function collectPolicyRefs(entity: Record<string, unknown>, refs: PolicyRefs, shape: 'iam-entity' | 'permission-set'): void {
  if (shape === 'iam-entity') {
    for (const doc of (entity.InlinePolicies as unknown[]) ?? []) {
      if (doc && typeof doc === 'object') {
        refs.inlineDocuments.push(doc as Record<string, unknown>);
      }
    }
    for (const pol of (entity.AttachedPolicies as Array<{ PolicyArn?: string }>) ?? []) {
      if (typeof pol.PolicyArn === 'string' && pol.PolicyArn) {
        refs.attachedArns.push(pol.PolicyArn);
      }
    }
    return;
  }

  const inline = entity.inlinePolicyDocument;
  if (inline && typeof inline === 'object') {
    refs.inlineDocuments.push(inline as Record<string, unknown>);
  }
  for (const arn of (entity.attachedPolicyArns as unknown[]) ?? []) {
    if (typeof arn === 'string' && arn) {
      refs.attachedArns.push(arn);
    }
  }
}

export function policyRefsFromPermissionSets(resolved: Record<string, unknown>[]): PolicyRefs {
  const refs = emptyPolicyRefs();
  for (const permissionSet of resolved) {
    if (permissionSet) collectPolicyRefs(permissionSet, refs, 'permission-set');
  }
  return refs;
}

export function policyRefsFromIamEntities(
  userData: Record<string, unknown>,
  groups: Record<string, unknown>[],
): PolicyRefs {
  const refs = emptyPolicyRefs();
  collectPolicyRefs(userData, refs, 'iam-entity');
  for (const group of groups) {
    collectPolicyRefs(group, refs, 'iam-entity');
  }
  return refs;
}

export async function resolvePolicies(redis: RedisClientType, refs: PolicyRefs): Promise<unknown[]> {
  return [...refs.inlineDocuments, ...(await getPolicyDocuments(redis, refs.attachedArns))];
}
