export enum RESOURCES {
    S3_BUCKETS = "s3buckets",
}

// Internal Aura infrastructure identities — never exposed as linkable AWS users
// or monitorable resources. Shared by api-server and mcp-server.
export const INTERNAL_AWS_USER_ARNS = [
    "arn:aws:iam::589523296424:user/Aura-Crawlers-Sevice",
    "arn:aws:iam::589523296424:user/Aura-SaaS-Crawler",
];