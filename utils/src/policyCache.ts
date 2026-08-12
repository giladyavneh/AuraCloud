import { LRUCache } from 'lru-cache';
import type { RedisClientType } from 'redis';

export const IAM_POLICIES_HASH = 'aura:iam:policies';

const DEFAULT_MAX_ENTRIES = 500;
const DEFAULT_TTL_MS = 5 * 60 * 1000;

const policyDocumentCache = new LRUCache<string, Record<string, unknown>>({
  max: parseInt(process.env.POLICY_CACHE_MAX ?? '', 10) || DEFAULT_MAX_ENTRIES,
  ttl: parseInt(process.env.POLICY_CACHE_TTL_MS ?? '', 10) || DEFAULT_TTL_MS,
});

export async function getPolicyDocument(
  redis: RedisClientType,
  policyArn: string,
): Promise<Record<string, unknown> | undefined> {
  const cached = policyDocumentCache.get(policyArn);
  if (cached) return cached;

  const raw = await redis.hGet(IAM_POLICIES_HASH, policyArn);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as { Document?: unknown };
    if (!parsed.Document || typeof parsed.Document !== 'object') return undefined;
    const document = parsed.Document as Record<string, unknown>;
    policyDocumentCache.set(policyArn, document);
    return document;
  } catch {
    return undefined;
  }
}

export async function getPolicyDocuments(
  redis: RedisClientType,
  policyArns: string[],
): Promise<Record<string, unknown>[]> {
  const uniqueArns = [...new Set(policyArns.filter((arn) => typeof arn === 'string' && arn.length > 0))];
  const documents: Record<string, unknown>[] = [];

  for (const arn of uniqueArns) {
    const document = await getPolicyDocument(redis, arn);
    if (document) documents.push(document);
  }

  return documents;
}

export function clearPolicyCache(): void {
  policyDocumentCache.clear();
}
