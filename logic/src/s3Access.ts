import { connectMongo, getRedisClient } from "utils";
import {
    evaluate,
    type EvalStatus,
    type PolicyDocument,
    type PolicySource,
} from "./policyEvaluator.js";
import { UserResourceWatchlistModel, type Watchlist, type WatchlistResource } from "./watchlistModel.js";

type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

export type ActionStatus = {
    action: string;
    status: EvalStatus;
    reasons: string[];
};
export type ResourceAccessReport = {
    arn: string;
    bucketCached: boolean;
    actions: ActionStatus[];
};
export type UserAccessReport = {
    userId: string;
    name: string;
    principalFound: boolean;
    principalArn?: string;
    resources: ResourceAccessReport[];
    notes: string[];
};

const ACL_PERMISSION_TO_ACTIONS: Record<string, string[]> = {
    READ: ["s3:GetObject", "s3:ListBucket"],
    WRITE: ["s3:PutObject", "s3:DeleteObject"],
    READ_ACP: ["s3:GetBucketAcl", "s3:GetObjectAcl"],
    WRITE_ACP: ["s3:PutBucketAcl", "s3:PutObjectAcl"],
    FULL_CONTROL: ["s3:*"],
};

const PUBLIC_GRANTEE_URIS = new Set([
    "http://acs.amazonaws.com/groups/global/AllUsers",
    "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
]);

async function loadWatchlist(userId: string): Promise<Watchlist> {
    await connectMongo();
    const doc = await UserResourceWatchlistModel.findOne({ userId }).lean();
    if (!doc) throw new Error(`No UserResourceWatchlist found for userId=${userId}`);
    return doc as unknown as Watchlist;
}

async function readJsonHash<T = any>(redis: RedisClient, hashKey: string, field: string): Promise<T | null> {
    const raw = await redis.hGet(hashKey, field);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

async function readJsonHashAll<T = any>(redis: RedisClient, hashKey: string): Promise<Record<string, T>> {
    const raw = await redis.hGetAll(hashKey);
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(raw)) {
        try {
            out[k] = JSON.parse(v as string) as T;
        } catch {
            // skip malformed
        }
    }
    return out;
}

function asPolicyDoc(value: any): PolicyDocument | null {
    if (!value) return null;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    if (typeof value === "object" && value.Statement) return value as PolicyDocument;
    return null;
}

function aclGrantsToSource(grants: any[] | undefined | null, origin: string): PolicySource | null {
    if (!grants || !grants.length) return null;
    const statements = [] as any[];
    for (const grant of grants) {
        const grantee = grant?.Grantee;
        const permission: string | undefined = grant?.Permission;
        if (!grantee || !permission) continue;
        const actions = ACL_PERMISSION_TO_ACTIONS[permission];
        if (!actions) continue;

        if (grantee.Type === "Group" && grantee.URI && PUBLIC_GRANTEE_URIS.has(grantee.URI)) {
            statements.push({
                Sid: `ACL:${permission}:${grantee.URI.split("/").pop()}`,
                Effect: "Allow",
                Action: actions,
                Resource: ["*"],
                Principal: "*",
            });
        }
        // Specific CanonicalUser grants are intentionally skipped (no reliable ARN mapping).
    }
    if (!statements.length) return null;
    return { document: { Statement: statements }, origin, type: "resource" };
}

async function buildResourceSourcesForBucket(
    redis: RedisClient,
    bucketArn: string,
): Promise<{ sources: PolicySource[]; bucketCached: boolean }> {
    const bucketName = bucketArn.replace(/^arn:aws:s3:::/, "");
    const bucket = await readJsonHash<any>(redis, "aura:resource:s3buckets", bucketName);
    if (!bucket) return { sources: [], bucketCached: false };

    const sources: PolicySource[] = [];
    const policy = asPolicyDoc(bucket.bucketPolicies);
    if (policy) {
        sources.push({ document: policy, origin: `bucket policy:${bucketName}`, type: "resource" });
    }
    const acl = aclGrantsToSource(bucket.bucketAcl, `bucket ACL:${bucketName}`);
    if (acl) sources.push(acl);

    return { sources, bucketCached: true };
}

function collectIdentitySourcesFromAttachments(
    attachedPolicies: any[] | undefined,
    inlinePolicies: any[] | undefined,
    managedPolicies: Record<string, { document: any }>,
    ownerLabel: string,
    notes: string[],
): PolicySource[] {
    const sources: PolicySource[] = [];

    for (const ap of attachedPolicies || []) {
        const arn: string | undefined = ap?.PolicyArn;
        if (!arn) continue;
        const entry = managedPolicies[arn];
        if (!entry || !entry.document) {
            notes.push(`missing managed policy body for ${arn} (attached to ${ownerLabel})`);
            continue;
        }
        sources.push({
            document: entry.document,
            origin: `identity:${ownerLabel}:${ap.PolicyName ?? arn}`,
            type: "identity",
        });
    }

    for (const inline of inlinePolicies || []) {
        if (!inline?.document) continue;
        sources.push({
            document: inline.document,
            origin: `identity:${ownerLabel}:inline:${inline.name}`,
            type: "identity",
        });
    }

    return sources;
}

async function evaluateResources(args: {
    redis: RedisClient;
    watchlist: Watchlist;
    identitySources: PolicySource[];
    principalArn: string | undefined;
    extraNotes: string[];
}): Promise<ResourceAccessReport[]> {
    const reports: ResourceAccessReport[] = [];
    for (const resource of args.watchlist.resources) {
        const { sources: resourceSources, bucketCached } = await buildResourceSourcesForBucket(
            args.redis,
            resource.arn,
        );
        const actions: ActionStatus[] = [];
        if (!bucketCached) {
            for (const action of resource.actions) {
                actions.push({ action, status: "Unknown", reasons: ["bucket not in cache"] });
            }
        } else {
            const sources = [...args.identitySources, ...resourceSources];
            for (const action of resource.actions) {
                const result = evaluate({
                    action,
                    resourceArn: resource.arn,
                    ...(args.principalArn ? { principalArn: args.principalArn } : {}),
                    sources,
                });
                actions.push({ action, status: result.status, reasons: [...result.reasons, ...args.extraNotes] });
            }
        }
        reports.push({ arn: resource.arn, bucketCached, actions });
    }
    return reports;
}

export async function checkS3AccessForIamUser(userId: string): Promise<UserAccessReport> {
    const watchlist = await loadWatchlist(userId);
    const redis = await getRedisClient();
    const notes: string[] = [];

    const iamUser = await readJsonHash<any>(redis, "aura:iam:users", watchlist.name);
    if (!iamUser) {
        return {
            userId,
            name: watchlist.name,
            principalFound: false,
            resources: watchlist.resources.map((r: WatchlistResource) => ({
                arn: r.arn,
                bucketCached: false,
                actions: r.actions.map((a) => ({
                    action: a,
                    status: "Unknown" as const,
                    reasons: [`IAM user "${watchlist.name}" not found in cache`],
                })),
            })),
            notes: [`IAM user "${watchlist.name}" not found in aura:iam:users`],
        };
    }

    const managedPolicies = await readJsonHashAll<{ document: any }>(redis, "aura:iam:managed-policies");
    const identitySources: PolicySource[] = [];

    identitySources.push(
        ...collectIdentitySourcesFromAttachments(
            iamUser.AttachedPolicies,
            iamUser.InlinePolicies,
            managedPolicies,
            `user:${iamUser.UserName}`,
            notes,
        ),
    );

    for (const groupName of iamUser.Groups || []) {
        const group = await readJsonHash<any>(redis, "aura:iam:groups", groupName);
        if (!group) {
            notes.push(`group "${groupName}" not found in cache`);
            continue;
        }
        identitySources.push(
            ...collectIdentitySourcesFromAttachments(
                group.AttachedPolicies,
                group.InlinePolicies,
                managedPolicies,
                `group:${groupName}`,
                notes,
            ),
        );
    }

    const resources = await evaluateResources({
        redis,
        watchlist,
        identitySources,
        principalArn: iamUser.Arn,
        extraNotes: [],
    });

    const report: UserAccessReport = {
        userId,
        name: watchlist.name,
        principalFound: true,
        resources,
        notes,
    };
    if (iamUser.Arn) report.principalArn = iamUser.Arn;
    return report;
}

export async function checkS3AccessForSsoUser(userId: string): Promise<UserAccessReport> {
    const watchlist = await loadWatchlist(userId);
    const redis = await getRedisClient();
    const notes: string[] = [];

    const ssoUsers = await readJsonHashAll<any>(redis, "aura:sso:users");
    const targetName = watchlist.name.toLowerCase();
    const ssoUser = Object.values(ssoUsers).find(
        (u) =>
            u?.UserName?.toLowerCase() === targetName ||
            u?.DisplayName?.toLowerCase() === targetName,
    );

    if (!ssoUser) {
        return {
            userId,
            name: watchlist.name,
            principalFound: false,
            resources: watchlist.resources.map((r: WatchlistResource) => ({
                arn: r.arn,
                bucketCached: false,
                actions: r.actions.map((a) => ({
                    action: a,
                    status: "Unknown" as const,
                    reasons: [`SSO user "${watchlist.name}" not found in cache`],
                })),
            })),
            notes: [`SSO user "${watchlist.name}" not found in aura:sso:users`],
        };
    }

    const ssoGroups = await readJsonHashAll<any>(redis, "aura:sso:groups");
    const permissionSets = await readJsonHashAll<any>(redis, "aura:sso:permission-sets");
    const managedPolicies = await readJsonHashAll<{ document: any }>(redis, "aura:iam:managed-policies");

    const permissionSetArns = new Set<string>();
    for (const assignment of ssoUser.PermissionSets || []) {
        if (assignment?.PermissionSetArn) permissionSetArns.add(assignment.PermissionSetArn);
    }

    for (const groupId of ssoUser.GroupMemberships || []) {
        const group = ssoGroups[groupId];
        if (!group) {
            notes.push(`SSO group "${groupId}" not found in cache`);
            continue;
        }
        for (const assignment of group.PermissionSets || []) {
            if (assignment?.PermissionSetArn) permissionSetArns.add(assignment.PermissionSetArn);
        }
    }

    const identitySources: PolicySource[] = [];
    let hasCustomerManagedRefs = false;

    for (const psArn of permissionSetArns) {
        const ps = permissionSets[psArn];
        if (!ps) {
            notes.push(`permission set "${psArn}" not found in cache`);
            continue;
        }
        const psName = ps.Name || psArn;
        if (ps.InlinePolicy && (ps.InlinePolicy as any).Statement) {
            identitySources.push({
                document: ps.InlinePolicy,
                origin: `identity:permission-set:${psName}:inline`,
                type: "identity",
            });
        }
        for (const arn of ps.ManagedPolicyArns || []) {
            const entry = managedPolicies[arn];
            if (!entry || !entry.document) {
                notes.push(`missing managed policy body for ${arn} (attached to permission set ${psName})`);
                continue;
            }
            identitySources.push({
                document: entry.document,
                origin: `identity:permission-set:${psName}:${arn}`,
                type: "identity",
            });
        }
        if ((ps.CustomerManagedPolicyReferences || []).length) {
            hasCustomerManagedRefs = true;
            for (const ref of ps.CustomerManagedPolicyReferences) {
                notes.push(`customer-managed policy "${ref.name}" on permission set ${psName} (body not in cache)`);
            }
        }
    }

    const extraNotes = hasCustomerManagedRefs
        ? ["evaluation incomplete: customer-managed permission set policies not cached"]
        : [];

    const resources = await evaluateResources({
        redis,
        watchlist,
        identitySources,
        principalArn: undefined,
        extraNotes,
    });

    return {
        userId,
        name: watchlist.name,
        principalFound: true,
        resources,
        notes,
    };
}
