import 'dotenv/config';
import { RedisMemoryServer } from 'redis-memory-server';
import { createClient } from 'redis';
import { SsoCrawler } from './ssoCrawler.js';
import { BasicIamCrawler } from './basicIamCrawler.js';
import { print } from './utils.js';
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
async function printAllRedisData(redis: any) {
  while (true) {
    try {
      const keys = await redis.keys('*');
      const allData: Record<string, any> = {};
      for (const key of keys) {
        const type = await redis.type(key);
        let value;
        if (type === 'string') {
          value = await redis.get(key);
        } else if (type === 'hash') {
          value = await redis.hGetAll(key);
        } else if (type === 'list') {
          value = await redis.lRange(key, 0, -1);
        } else if (type === 'set') {
          value = await redis.sMembers(key);
        } else if (type === 'zset') {
          value = await redis.zRange(key, 0, -1, { WITHSCORES: true });
        } else {
          value = '(unhandled type)';
        }
        allData[key] = value;
      }
      console.log(`[${new Date().toLocaleTimeString()}] 🗄️ Redis Data:`);
      print(allData);
    } catch (err: any) {
      console.error('Error printing Redis data:', err.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
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