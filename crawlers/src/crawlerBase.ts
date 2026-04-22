import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";

export abstract class BaseCrawler {
  protected accountId: string;
  protected region: string;
  protected intervalMs: number;

  constructor(intervalMs: number = 5000 ) {
    this.accountId = process.env.TARGET_ACCOUNT_ID || "";
    this.region = process.env.AWS_REGION || "eu-central-1";
    this.intervalMs = intervalMs;
  }

  // Necessary because S3, KMS, and Network are regional; IAM is global.
  protected async getRegions(): Promise<string[]> {
    const client = new EC2Client({ region: this.region });
    const { Regions } = await client.send(new DescribeRegionsCommand({}));
    return Regions?.map(r => r.RegionName!).filter(Boolean) || [this.region];
  }

  // Every crawler must implement this to return its "finding"
  abstract crawl(): Promise<any>;
}