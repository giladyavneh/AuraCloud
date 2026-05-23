import { GetBucketAclCommand, GetBucketCorsCommand, GetBucketLocationCommand, GetBucketPolicyCommand, ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { BaseCrawler } from "./crawlerBase.js";
import extend from "extend";

export class S3Crawler extends BaseCrawler {
    protected s3Client = new S3Client({ region: this.region, credentials: this.credentials });
    protected stsClient = new STSClient({ region: this.region, credentials: this.credentials });
    protected intervalMs = 1000;

    private async callAwsAndExtract<T, K extends keyof T>(fn: () => Promise<T>, key: K): Promise<T[K]|null> {
        const response = await this.callAndHandleThrotteling(fn).catch(() => null);
        return response ? response[key] : null;
    }

    private async enrichBucket(bucket: any) {
        const [
            bucketPolicies,
            bucketLocation,
            bucketAcl,
            bucketCors
        ] = await Promise.all([
            this.callAwsAndExtract(() => this.s3Client.send(new GetBucketPolicyCommand({ Bucket: bucket.Name! })), "Policy").catch(() => null), // Not all buckets have policies, so we catch and return null
            this.callAwsAndExtract(() => this.s3Client.send(new GetBucketLocationCommand({ Bucket: bucket.Name! })), "LocationConstraint").catch(() => null), // Not all buckets have policies, so we catch and return null
            this.callAwsAndExtract(() => this.s3Client.send(new GetBucketAclCommand({ Bucket: bucket.Name! })), "Grants").catch(() => null), // Not all buckets have policies, so we catch and return null
            this.callAwsAndExtract(() => this.s3Client.send(new GetBucketCorsCommand({ Bucket: bucket.Name! })), "CORSRules").catch(() => null) // Not all buckets have policies, so we catch and return null
        ]);
        extend(bucket, { bucketPolicies, bucketLocation, bucketAcl, bucketCors });
    }

    async crawl() {
        const bucketsResponse = await this.callAndHandleThrotteling(() => this.s3Client.send(new ListBucketsCommand({})));
        const buckets = bucketsResponse.Buckets || [];
        const { Account } = await this.callAndHandleThrotteling(() =>
          this.stsClient.send(new GetCallerIdentityCommand({}))
        );
        for (const bucket of buckets) {
            await this.enrichBucket(bucket);
            extend(bucket, { accountId: Account ?? undefined });
        }
        return buckets
    }
    
    async save(redis: any, data: any) {
        for (const bucket of data) await redis.hSet("aura:resource:s3buckets", bucket.BucketArn, JSON.stringify(bucket));
        console.log(`💾 S3 Cache Updated: ${data.length} Buckets`);
    }
}