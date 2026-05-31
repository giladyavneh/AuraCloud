// Node 22+/24 defaults to IPv6 DNS (link-local) which causes querySrv ECONNREFUSED
// on residential routers. Force IPv4 DNS servers before any network call is made.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import { SsoCrawler } from "./ssoCrawler.js";
import { PermissionSetsCrawler } from "./permissionSetsCrawler.js";
import { BasicIamCrawler } from "./basicIamCrawler.js";
import { S3Crawler } from "./s3Crawler.js";
import { getRedisClient, connectMongo, CustomerModel } from "utils";

async function main() {
  const [redis] = await Promise.all([getRedisClient(), connectMongo()]);
  console.log("🚀 AuraCloud: Identity Sync Initiated");

  const customers = await CustomerModel.find({
    "awsCredentials.status": "connected",
  }).lean();

  if (customers.length === 0) {
    console.warn(
      "⚠️  No connected customers found — crawlers idle. Onboard a customer to begin.",
    );
    return;
  }

  // TODO: credentials are captured here at startup and never refreshed. If a
  // customer rotates their access key, flips status to 'disconnected', or
  // onboards while crawlers are already running, the changes are not picked up
  // until this process restarts. Fix by moving the customer fetch into the
  // per-tick path inside runCrawler (re-query Mongo each cycle, rebuild the
  // crawler instance when accessKeyId changes or status !== 'connected').
  // Mongo cost is negligible at MVP scale.
  for (const customer of customers) {
    const creds = customer.awsCredentials;
    if (!creds || !creds.accessKeyId || !creds.secretAccessKey) {
      console.warn(
        `⚠️  Customer ${customer._id} marked connected but missing keys — skipping`,
      );
      continue;
    }
    const credentials = {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    };
    const tag = `${customer.firstName}:${customer._id.toString().slice(-6)}`;

    runCrawler(new SsoCrawler(credentials), `SSO[${tag}]`, redis);
    runCrawler(
      new PermissionSetsCrawler(credentials),
      `PermissionSets[${tag}]`,
      redis,
    );
    runCrawler(new BasicIamCrawler(credentials), `IAM[${tag}]`, redis);
    runCrawler(new S3Crawler(credentials), `S3[${tag}]`, redis);
  }
}

async function runCrawler(crawler: any, name: string, redis: any) {
  while (true) {
    const start = Date.now();
    try {
      const data = await crawler.crawl();
      await crawler.save(redis, data);
      await crawler.saveToMongo(data);
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ ${name} Sync Complete`,
      );
    } catch (err: any) {
      console.error(`❌ ${name} Error:`, err.message);
    }
    const sleep = Math.max(crawler.intervalMs - (Date.now() - start), 0);
    await new Promise((r) => setTimeout(r, sleep));
  }
}

main().catch(console.error);
