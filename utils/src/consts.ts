export enum RESOURCES {
    S3_BUCKETS = "s3buckets",
    EC2_INSTANCES = "ec2instances",
}

export enum AwsResourceType {
    S3Bucket = 'S3Bucket',
    EC2Instance = 'EC2Instance',
}

// Audience claim carried by MCP access tokens. Shared so that api-server and
// mcp-server agree on the exact string that separates MCP tokens from login tokens.
export const MCP_TOKEN_AUDIENCE = "auracloud-mcp";

// Internal Aura infrastructure identities — never exposed as linkable AWS users
// or monitorable resources. Shared by api-server and mcp-server.
export const INTERNAL_AWS_USER_ARNS = [
    "arn:aws:iam::589523296424:user/Aura-Crawlers-Sevice",
    "arn:aws:iam::589523296424:user/Aura-SaaS-Crawler",
];

/**
 * Excludes Aura's own identities from any arn-keyed query — they are neither
 * monitorable resources nor linkable AWS users. The arn clause is applied last so
 * a caller's own filter can never accidentally drop the exclusion.
 */
export const excludingInternalArns = (
    extraFilter: Record<string, unknown> = {},
): Record<string, unknown> => ({
    ...extraFilter,
    arn: { $nin: INTERNAL_AWS_USER_ARNS },
});
