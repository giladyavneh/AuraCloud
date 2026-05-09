export type EvalResult = 'ALLOW' | 'DENY' | 'IMPLICIT_DENY';

function resolveResourceAwsAccountId(resource: Record<string, unknown> | null | undefined): string | undefined {
    if (!resource || typeof resource !== 'object') return undefined;
    const id = resource.accountId;
    if (typeof id === 'string' && id.length > 0) return id;

    const arn = (resource.Arn ?? resource.BucketArn ?? resource.arn) as string | undefined;
    if (typeof arn === 'string') {
        const parts = arn.split(':');
        if (parts.length >= 5 && parts[4]) return parts[4];
    }
    return undefined;
}

function resolveIdentityAwsAccountPool(user: Record<string, unknown>): string[] {
    const fromAssignments = user.accessibleAwsAccountIds;
    if (Array.isArray(fromAssignments)) {
        const filtered = fromAssignments.filter((id): id is string => typeof id === 'string' && id.length > 0);
        if (filtered.length > 0) return filtered;
    }
    const legacy = user.accountId;
    if (typeof legacy === 'string' && legacy.length > 0) return [legacy];
    return [];
}

export function evaluate(resource: unknown, action: string, user: Record<string, unknown>) {
    const res = (resource && typeof resource === 'object' ? resource : {}) as Record<string, unknown>;
    const resourceAccountId = resolveResourceAwsAccountId(res); 
    const identityAccountPool = resolveIdentityAwsAccountPool(user);
    const hasResourceAccount = Boolean(resourceAccountId);
    const isSameAccount = hasResourceAccount && identityAccountPool.some((id) => id === resourceAccountId);
    const singleIdentityContext = !hasResourceAccount && identityAccountPool.length === 1;
    const treatAsSameAccount = isSameAccount || singleIdentityContext;  
    let identityAllowed = false;
    let resourceAllowed = false;    
    
    const scpStatus = evaluateScp([], action, res);
    if (scpStatus === 'DENY') return false;

    const policies = user.policies as unknown[] | undefined;
    const idStatus = checkIdentityPolicy(policies, action);
    if (idStatus === 'DENY') return false;
    if (idStatus === 'ALLOW') identityAllowed = true;   
    
    const userArn = typeof user.arn === 'string' ? user.arn : '';
    const resStatus = checkResourcePolicy(res.bucketPolicies, action, userArn);
    if (resStatus === 'DENY') return false;
    if (resStatus === 'ALLOW') resourceAllowed = true;  
    if (!treatAsSameAccount) {
        return identityAllowed && resourceAllowed;
    }
    return identityAllowed || resourceAllowed;
}

function evaluateScp(_scps: unknown[], _action: string, _resource: unknown): EvalResult {
  return 'ALLOW';
}

function isMatch(pattern: string, actual: string): boolean {
  const regex = new RegExp(
    '^' + pattern.split('*').map((s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&')).join('.*') + '$',
  );
  return regex.test(actual);
}

function matchesAny(patterns: string | string[], actual: string): boolean {
  const arr = Array.isArray(patterns) ? patterns : [patterns];
  return arr.some((p) => isMatch(p, actual));
}

export function checkIdentityPolicy(policies: unknown[] | undefined, action: string): EvalResult {
    let hasAllow = false;
    if (!policies?.length) return 'IMPLICIT_DENY';

    for (const policy of policies) {
        if (!policy || typeof policy !== 'object') continue;
        const p = policy as { Statement?: unknown };
        const statements = Array.isArray(p.Statement) ? p.Statement : [p.Statement];
        for (const stmt of statements) {
            if (!stmt || typeof stmt !== 'object') continue;
            const s = stmt as { Action?: unknown; Effect?: unknown };
            if (matchesAny((s.Action as string | string[]) ?? '', action)) {
                if (s.Effect === 'Deny') return 'DENY';
                if (s.Effect === 'Allow') hasAllow = true;
            }
        }
    }

    return hasAllow ? 'ALLOW' : 'IMPLICIT_DENY';
}

export function checkResourcePolicy(policy: unknown, action: string, userArn: string): EvalResult {
  if (!policy) return 'IMPLICIT_DENY';

  let hasAllow = false;
  try {
    const parsed = typeof policy === 'string' ? JSON.parse(policy) : policy;
    if (!parsed || typeof parsed !== 'object') return 'IMPLICIT_DENY';
    const pObj = parsed as { Statement?: unknown };
    const statements = Array.isArray(pObj.Statement) ? pObj.Statement : [pObj.Statement];

    for (const stmt of statements) {
      if (!stmt || typeof stmt !== 'object') continue;
      const s = stmt as { Principal?: unknown; Action?: unknown; Effect?: unknown };
      if (!principalMatches(s.Principal, userArn)) continue;
      if (matchesAny((s.Action as string | string[]) ?? '', action)) {
        if (s.Effect === 'Deny') return 'DENY';
        if (s.Effect === 'Allow') hasAllow = true;
      }
    }
  } catch {
    return 'IMPLICIT_DENY';
  }

  return hasAllow ? 'ALLOW' : 'IMPLICIT_DENY';
}

function principalMatches(principal: unknown, userArn: string): boolean {
  if (!principal) return false;
  if (principal === '*') return true;

  const pObj = principal as { AWS?: unknown; Service?: unknown };
  const awsPrincipal = pObj.AWS ?? pObj.Service ?? principal;
  const principals = Array.isArray(awsPrincipal) ? awsPrincipal : [awsPrincipal];

  return principals.some((p: unknown) => p === '*' || p === userArn);
}
