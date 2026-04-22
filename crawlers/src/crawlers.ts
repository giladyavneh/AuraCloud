import { IAMClient, ListRolesCommand, GetRolePolicyCommand, ListAttachedRolePoliciesCommand, GetPolicyVersionCommand, GetPolicyCommand } from "@aws-sdk/client-iam";
import { S3Client, ListBucketsCommand, GetBucketPolicyCommand, GetBucketLocationCommand,  } from "@aws-sdk/client-s3";
import { KMSClient, ListKeysCommand, GetKeyPolicyCommand } from "@aws-sdk/client-kms";
import { BaseCrawler } from "./crawlerBase.js";

// 1. Identity Crawler (IAM)
export class IdentityCrawler extends BaseCrawler {
  async crawl() {
    const client = new IAMClient({ region: "eu-central-1" });
    const { Roles } = await client.send(new ListRolesCommand({}));
    return Roles || [];
  }
}

// 2. Resource Crawler (S3)
export class ResourceCrawler extends BaseCrawler {
  async crawl() {
    // Initial client to list buckets (region doesn't matter much here)
    const globalClient = new S3Client({ region: this.region });
    const { Buckets } = await globalClient.send(new ListBucketsCommand({}));

    return Promise.all(Buckets?.map(async (bucket) => {
      try {
        const arn = bucket.BucketArn
        // 1. Ask where the bucket lives
        const locationResponse = await globalClient.send(
          new GetBucketLocationCommand({ Bucket: bucket.Name! })
        );
        
        // AWS quirk: us-east-1 returns an empty string or null for location
        const bucketRegion = locationResponse.LocationConstraint || "us-east-1";
        
        // 2. Create a regional client for this specific bucket
        const regionalClient = new S3Client({ region: bucketRegion });
        const { Policy } = await regionalClient.send(
          new GetBucketPolicyCommand({ Bucket: bucket.Name! })
        );

        return {
          arn,
          name: bucket.Name, 
          region: bucketRegion, 
          policy: JSON.parse(Policy || "{}") 
        };

      } catch (err: any) {
        // Handle buckets with no policy specifically
        if (err.name === "NoSuchBucketPolicy") {
          console.log(`✅ No explicit policy on: ${bucket.Name}`);
          return { name: bucket.Name, policy: null };
        }
        
        console.log(`⚠️ Failed to crawl ${bucket.Name}: ${err.message}`);
        return { name: bucket.Name, arn: bucket.BucketArn, error: err.message };
      }
    }) || []);
  }
}

// 3. KMS Crawler (The "Silent Killer")
export class KMSCrawler extends BaseCrawler {
  async crawl() {
    const client = new KMSClient({ region: this.region });
    const { Keys } = await client.send(new ListKeysCommand({}));
    // For prototype: Just get the default policy of the first key
    if (Keys?.[0]) {
      const { Policy } = await client.send(new GetKeyPolicyCommand({ KeyId: Keys[0].KeyId, PolicyName: "default" }));
      return { keyId: Keys[0].KeyId, policy: JSON.parse(Policy || "{}") };
    }
    return null;
  }
}