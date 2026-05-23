import { GetBucketAclCommand, GetBucketCorsCommand, GetBucketLocationCommand, GetBucketPolicyCommand, ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { BaseCrawler } from "./crawlerBase.js";
import extend from "extend";

const GLOBAL_S3_REGION = "us-east-1";

export class S3Crawler extends BaseCrawler {
    protected s3Client = new S3Client({ region: this.region, credentials: this.credentials });
    protected stsClient = new STSClient({ region: this.region, credentials: this.credentials });
    protected intervalMs = 1000;
    private regionalClientsCache = new Map<string, S3Client>();

    private getRegionalClient(region: string): S3Client {
        if (region === this.region) {
            return this.s3Client;
        }
        let client = this.regionalClientsCache.get(region);
        if (!client) {
            client = new S3Client({ region });
            this.regionalClientsCache.set(region, client);
        }
        return client;
    }

    private async callAwsAndExtract<T, K extends keyof T>(fn: () => Promise<T>, key: K): Promise<T[K]|null> {
        const response = await this.callAndHandleThrotteling(fn).catch((err) => {
            console.error(`[S3 CRAWLER] AWS SDK Error:`, err.message || err);
            return null;
        });
        return response ? response[key] : null;
    }

    private async enrichBucket(bucket: any) {
        const locationClient = this.getRegionalClient(GLOBAL_S3_REGION);
        const bucketLocation = await this.callAwsAndExtract(
            () => locationClient.send(new GetBucketLocationCommand({ Bucket: bucket.Name! })), "LocationConstraint"
        ).catch((err) => { console.error(`[S3 CRAWLER] GetBucketLocation error for ${bucket.Name}:`, err.message || err); });

        const region = bucketLocation || GLOBAL_S3_REGION;
        const regionalClient = this.getRegionalClient(region);

        const [
            bucketPolicies,
            bucketAcl,
            bucketCors
        ] = await Promise.all([
            this.callAwsAndExtract(() => regionalClient.send(new GetBucketPolicyCommand({ Bucket: bucket.Name! })), "Policy").catch((err) => {
                console.error(`[S3 CRAWLER] GetBucketPolicy error for ${bucket.Name} in region ${region}:`, err.message || err);
                return null;
            }),
            this.callAwsAndExtract(() => regionalClient.send(new GetBucketAclCommand({ Bucket: bucket.Name! })), "Grants").catch(() => null),
            this.callAwsAndExtract(() => regionalClient.send(new GetBucketCorsCommand({ Bucket: bucket.Name! })), "CORSRules").catch(() => null)
        ]);

        extend(bucket, { bucketPolicies, bucketLocation: region, bucketAcl, bucketCors });
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