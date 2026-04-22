import 'dotenv/config';
import { IdentityCrawler, ResourceCrawler, KMSCrawler } from './crawlers.js';

// redis
import { RedisMemoryServer } from 'redis-memory-server';
import { createClient } from 'redis';

async function main() {
  console.log("start redis");
  const redis = await startRedis();
  console.log("🚀 AuraCloud Prototype: Starting Deep Audit...");

  const identityData = await new IdentityCrawler().crawl();
  const s3Data = await new ResourceCrawler().crawl();
  const kmsData = await new KMSCrawler().crawl();

  const bucketsDataInsertion = s3Data.map(bucket => redis.set(`s3/${bucket.arn}`, JSON.stringify({region: bucket.region, policy: bucket.policy})));
  await Promise.all(bucketsDataInsertion);

  console.log("\n--- 📜 Audit Discovery ---");
  console.log(`👤 Identities: Found ${identityData.length} relevant SSO roles.`);
  console.log(JSON.stringify(identityData, null, 2));
  console.log(`📦 Resource: ${s3Data.map(d => d.name).join(", ")} policy extracted.`);
  console.log(JSON.stringify(s3Data, null, 2));
  console.log(`🔑 Encryption: ${kmsData ? "KMS Policy detected" : "No KMS keys found"}.`);
  console.log(JSON.stringify(kmsData, null, 2));

  console.log("\n--- 🚦 Reachability Summary ---");
  const keys = await redis.keys('s3/*');
  const data = await redis.mGet(keys);
  console.log(data);
  redis.quit();
}

async function startRedis() {
  const redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();

  const client = createClient({
    url: `redis://${host}:${port}`
  });

  await client.connect();
  console.log(`🚀 In-memory Redis started at ${host}:${port}`);
  return client;
}

main();