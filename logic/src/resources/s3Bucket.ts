import { readJsonHash, type RedisClient } from "../redisHelpers.js";
import { type PolicyDocument, type PolicySource } from "../policyEvaluator.js";
import {
    hasAllowCheck,
    identityFoundCheck,
    noExplicitDenyCheck,
    resourceCachedCheck,
    type AccessCheck,
    type ResourceContext,
} from "../checks.js";

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
    if (!grants?.length) return null;
    const statements: any[] = [];
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

export async function loadS3BucketResource(redis: RedisClient, arn: string): Promise<ResourceContext> {
    const notes: string[] = [];
    const bucketName = arn.replace(/^arn:aws:s3:::/, "");
    const bucket = await readJsonHash<any>(redis, "aura:resource:s3buckets", bucketName);
    if (!bucket) {
        return {
            arn,
            type: "s3:bucket",
            cached: false,
            policySources: [],
            meta: { bucketName },
            notes: [`bucket "${bucketName}" not found in aura:resource:s3buckets`],
        };
    }

    const policySources: PolicySource[] = [];
    const policy = asPolicyDoc(bucket.bucketPolicies);
    if (policy) {
        policySources.push({ document: policy, origin: `bucket policy:${bucketName}`, type: "resource" });
    }
    const acl = aclGrantsToSource(bucket.bucketAcl, `bucket ACL:${bucketName}`);
    if (acl) policySources.push(acl);

    return {
        arn,
        type: "s3:bucket",
        cached: true,
        policySources,
        meta: {
            bucketName,
            location: bucket.bucketLocation ?? null,
            hasBucketPolicy: !!policy,
            aclGrantCount: bucket.bucketAcl?.length ?? 0,
        },
        notes,
    };
}

export const S3_BUCKET_CHECKS: AccessCheck[] = [
    identityFoundCheck,
    resourceCachedCheck,
    noExplicitDenyCheck,
    hasAllowCheck,
];
