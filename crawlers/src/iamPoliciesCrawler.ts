import { IAMClient, ListPoliciesCommand, type Policy } from '@aws-sdk/client-iam';
import { BaseCrawler } from './crawlerBase.js';
import { fetchPolicyDocument } from './policyDocument.js';

const REDIS_HASH = 'aura:iam:policies';
const IAM_ENTITY_HASHES = ['aura:iam:users', 'aura:iam:groups', 'aura:iam:roles'] as const;
const DEFAULT_POLICIES_PER_CRAWL = 10;

export type StoredIamPolicy = {
  PolicyArn: string;
  PolicyName?: string;
  Document: Record<string, unknown>;
  lastSyncedAt: string;
};

type PendingPolicy = { arn: string; name?: string };

function policiesPerCrawl(): number {
  const parsed = parseInt(process.env.IAM_POLICIES_PER_CRAWL ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POLICIES_PER_CRAWL;
}

function attachedArnsFromEntityJson(raw: string): string[] {
  try {
    const entity = JSON.parse(raw) as { AttachedPolicies?: Array<{ PolicyArn?: string }> };
    return (entity.AttachedPolicies ?? [])
      .map((p) => p.PolicyArn)
      .filter((arn): arn is string => typeof arn === 'string' && arn.length > 0);
  } catch {
    return [];
  }
}

export class IAMPoliciesCrawler extends BaseCrawler {
  public intervalMs = 5000;
  protected iamClient = new IAMClient({ region: this.region, credentials: this.credentials });

  private pendingPolicies: PendingPolicy[] = [];
  private seenArnsThisScan = new Set<string>();

  private async listPoliciesPage(): Promise<{ policies: Policy[]; hasMore: boolean }> {
    const response = await this.callAndHandleThrotteling(() =>
      this.iamClient.send(
        new ListPoliciesCommand({
          Scope: 'Local',
          OnlyAttached: false,
          Marker: this.lastMarker,
        }),
      ),
    );

    this.lastMarker = response.Marker;
    const hasMore = Boolean(response.IsTruncated && response.Marker);
    return { policies: response.Policies ?? [], hasMore };
  }

  private async refillPendingQueue(): Promise<boolean> {
    let hasMore = true;

    while (this.pendingPolicies.length < policiesPerCrawl() && hasMore) {
      if (this.lastMarker === undefined && this.pendingPolicies.length === 0 && this.seenArnsThisScan.size === 0) {
        this.seenArnsThisScan.clear();
      }

      const page = await this.listPoliciesPage();
      for (const policy of page.policies) {
        if (!policy.Arn) continue;
        this.pendingPolicies.push({ arn: policy.Arn, name: policy.PolicyName });
      }
      hasMore = page.hasMore;
      if (page.policies.length === 0) break;
    }

    return hasMore || this.pendingPolicies.length > 0;
  }

  private async enrichPolicy(pending: PendingPolicy): Promise<StoredIamPolicy | null> {
    const document = await fetchPolicyDocument(
      this.iamClient,
      pending.arn,
      (fn) => this.callAndHandleThrotteling(fn),
    );
    if (!document) return null;

    return {
      PolicyArn: pending.arn,
      PolicyName: pending.name,
      Document: document,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  private async collectAttachedArnsFromRedis(redis: unknown): Promise<string[]> {
    const client = redis as {
      hGetAll: (key: string) => Promise<Record<string, string>>;
    };
    const arns = new Set<string>();

    for (const hashKey of IAM_ENTITY_HASHES) {
      const entries = await client.hGetAll(hashKey);
      for (const raw of Object.values(entries)) {
        for (const arn of attachedArnsFromEntityJson(raw)) {
          arns.add(arn);
        }
      }
    }

    return [...arns];
  }

  private async fetchAttachedPolicies(
    arns: string[],
    existing: Set<string>,
  ): Promise<StoredIamPolicy[]> {
    const enriched: StoredIamPolicy[] = [];

    for (const arn of arns) {
      if (existing.has(arn)) continue;
      const stored = await this.enrichPolicy({ arn });
      if (stored) {
        enriched.push(stored);
        this.seenArnsThisScan.add(arn);
      }
    }

    return enriched;
  }

  async crawl(): Promise<{
    policies: StoredIamPolicy[];
    fullScanComplete: boolean;
    seenArns?: string[];
  }> {
    const hasMoreListing = await this.refillPendingQueue();
    const batch = this.pendingPolicies.splice(0, policiesPerCrawl());
    const policies: StoredIamPolicy[] = [];

    for (const pending of batch) {
      const stored = await this.enrichPolicy(pending);
      if (stored) {
        policies.push(stored);
        this.seenArnsThisScan.add(pending.arn);
      }
    }

    const listingComplete = !hasMoreListing && this.pendingPolicies.length === 0;
    if (!listingComplete) {
      return { policies, fullScanComplete: false };
    }

    this.resetPagination();
    return {
      policies,
      fullScanComplete: true,
      seenArns: [...this.seenArnsThisScan],
    };
  }

  async save(
    redis: unknown,
    data: { policies: StoredIamPolicy[]; fullScanComplete: boolean; seenArns?: string[] },
  ): Promise<void> {
    const client = redis as {
      hSet: (key: string, field: string, value: string) => Promise<number>;
      hKeys: (key: string) => Promise<string[]>;
      hDel: (key: string, field: string) => Promise<number>;
      hGetAll: (key: string) => Promise<Record<string, string>>;
    };

    for (const policy of data.policies) {
      await client.hSet(REDIS_HASH, policy.PolicyArn, JSON.stringify(policy));
    }

    if (!data.fullScanComplete || !data.seenArns) return;

    const attachedArns = await this.collectAttachedArnsFromRedis(redis);
    const seenSet = new Set(data.seenArns);
    const attachedPolicies = await this.fetchAttachedPolicies(attachedArns, seenSet);
    for (const policy of attachedPolicies) {
      await client.hSet(REDIS_HASH, policy.PolicyArn, JSON.stringify(policy));
      seenSet.add(policy.PolicyArn);
    }

    const staleKeys = (await client.hKeys(REDIS_HASH)).filter((key) => !seenSet.has(key));
    if (staleKeys.length > 0) {
      await Promise.all(staleKeys.map((key) => client.hDel(REDIS_HASH, key)));
      console.log(`[IAMPoliciesCrawler] removed ${staleKeys.length} stale policies from ${REDIS_HASH}`);
    }

    this.seenArnsThisScan.clear();
  }
}
