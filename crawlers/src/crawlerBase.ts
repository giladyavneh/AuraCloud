import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";
import { STSClient } from "@aws-sdk/client-sts";

export type AwsCredentials = { accessKeyId: string; secretAccessKey: string };

export abstract class BaseCrawler {
  protected accountId: string;
  protected region: string;
  public intervalMs: number;
  protected credentials: AwsCredentials;
  protected stsClient: STSClient;
  
  constructor(credentials: AwsCredentials, intervalMs: number = 5000) {
    this.credentials = credentials;
    this.accountId = process.env.TARGET_ACCOUNT_ID || "";
    this.region = process.env.AWS_REGION || "eu-central-1";
    this.intervalMs = intervalMs;
    this.stsClient = new STSClient({ region: this.region, credentials: this.credentials });
  }

  // Necessary because S3, KMS, and Network are regional; IAM is global.
  protected async getRegions(): Promise<string[]> {
    const client = new EC2Client({ region: this.region, credentials: this.credentials });
    const { Regions } = await client.send(new DescribeRegionsCommand({}));
    return Regions?.map(r => r.RegionName!).filter(Boolean) || [this.region];
  }

  protected async callAwsAndExtract<T, K extends keyof T>(fn: () => Promise<T>, key: K): Promise<T[K]|null> {
    const response = await this.callAndHandleThrotteling(fn);
    return response ? response[key] : null;
  }

  async callAndHandleThrotteling<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        if (
          (err.name !== "ThrottlingException" &&
            err.name !== "TooManyRequestsException") ||
          attempt >= retries
        ) {
          throw err;
        }

        const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      }
    }
  }

  // Every crawler must implement this to return its "finding"
  abstract crawl(): Promise<any>;

  abstract save(client: any, data: any): Promise<void>;
}
