import 'dotenv/config';
import { SsoCrawler } from './ssoCrawler.js';
import { BasicIamCrawler } from './basicIamCrawler.js';
import { printAllRedisData } from './utils.js';
import { S3Crawler } from './s3Crawler.js';
import { getRedisClient } from 'utils';

async function main() {
  const redis = await getRedisClient();
  console.log("🚀 AuraCloud: Identity Sync Initiated");

  const ssoCrawler = new SsoCrawler();
  const iamCrawler = new BasicIamCrawler();
  const s3Crawler = new S3Crawler();

  // Run loops in parallel
  runCrawler(ssoCrawler, "SSO", redis);
  runCrawler(iamCrawler, "IAM", redis);
  runCrawler(s3Crawler, "S3", redis);

  // Print all Redis data every 10 seconds
  printAllRedisData(redis);
}

async function runCrawler(crawler: any, name: string, redis: any) {
  while (true) {
    const start = Date.now();
    try {
      const data = await crawler.crawl();
      await crawler.save(redis, data);
      console.log(`[${new Date().toLocaleTimeString()}] ✅ ${name} Sync Complete`);
    } catch (err: any) {
      console.error(`❌ ${name} Error:`, err.message);
    }
    const sleep = Math.max(crawler.intervalMs - (Date.now() - start), 0);
    await new Promise(r => setTimeout(r, sleep));
  }
}

main().catch(console.error);