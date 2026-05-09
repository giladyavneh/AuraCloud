import { connectMongo, getRedisClient } from "utils";
import { runChecks, type AccessCheck, type CheckResult, type IdentityContext } from "./checks.js";
import { loadIamIdentity, loadSsoIdentity } from "./identity.js";
import { loadS3BucketResource, S3_BUCKET_CHECKS } from "./resources/s3Bucket.js";
import { UserResourceWatchlistModel, type Watchlist } from "./watchlistModel.js";

export type ActionStatus = {
    action: string;
    status: "Allow" | "Deny" | "Unknown";
    reasons: string[];
    checks: CheckResult[];
};

export type ResourceAccessReport = {
    arn: string;
    type: string;
    cached: boolean;
    actions: ActionStatus[];
    notes: string[];
};

export type UserAccessReport = {
    userId: string;
    name: string;
    kind: "iam" | "sso";
    principalFound: boolean;
    principalArn?: string;
    resources: ResourceAccessReport[];
    notes: string[];
};

async function loadWatchlist(userId: string): Promise<Watchlist> {
    await connectMongo();
    const doc = await UserResourceWatchlistModel.findOne({ userId }).lean();
    if (!doc) throw new Error(`No UserResourceWatchlist found for userId=${userId}`);
    return doc as unknown as Watchlist;
}

async function evaluateWatchlist(
    identity: IdentityContext,
    watchlist: Watchlist,
    checks: AccessCheck[],
): Promise<ResourceAccessReport[]> {
    const redis = await getRedisClient();
    const reports: ResourceAccessReport[] = [];

    for (const resource of watchlist.resources) {
        const ctx = await loadS3BucketResource(redis, resource.arn);
        const actions: ActionStatus[] = resource.actions.map((action) => {
            const decision = runChecks(checks, { identity, resource: ctx, action });
            return {
                action,
                status: decision.status,
                reasons: decision.reasons,
                checks: decision.checks,
            };
        });
        reports.push({
            arn: resource.arn,
            type: ctx.type,
            cached: ctx.cached,
            actions,
            notes: ctx.notes,
        });
    }

    return reports;
}

function buildReport(userId: string, identity: IdentityContext, resources: ResourceAccessReport[]): UserAccessReport {
    const report: UserAccessReport = {
        userId,
        name: identity.name,
        kind: identity.kind,
        principalFound: identity.found,
        resources,
        notes: identity.notes,
    };
    if (identity.principalArn) report.principalArn = identity.principalArn;
    return report;
}

export async function checkS3AccessForIamUser(userId: string): Promise<UserAccessReport> {
    const watchlist = await loadWatchlist(userId);
    const redis = await getRedisClient();
    const identity = await loadIamIdentity(redis, watchlist.name);
    const resources = await evaluateWatchlist(identity, watchlist, S3_BUCKET_CHECKS);
    return buildReport(userId, identity, resources);
}

export async function checkS3AccessForSsoUser(userId: string): Promise<UserAccessReport> {
    const watchlist = await loadWatchlist(userId);
    const redis = await getRedisClient();
    const identity = await loadSsoIdentity(redis, watchlist.name);
    const resources = await evaluateWatchlist(identity, watchlist, S3_BUCKET_CHECKS);
    return buildReport(userId, identity, resources);
}
