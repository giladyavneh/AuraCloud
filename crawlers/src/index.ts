import 'dotenv/config';
import { SsoCrawler } from './ssoCrawler.js';
import { PermissionSetsCrawler } from './permissionSetsCrawler.js';
import { BasicIamCrawler } from './basicIamCrawler.js';
import { S3Crawler } from './s3Crawler.js';
import { getRedisClient, connectMongo, CustomerModel } from 'utils';
import type { BaseCrawler, AwsCredentials } from './crawlerBase.js';

type CrawlerCtor = new (credentials: AwsCredentials) => BaseCrawler;

// Customers we've already spawned crawler loops for. Loops live forever
// (paused via runCrawler when status flips), so we only need to track who
// already has a loop, not their current credentials — runCrawler handles that.
const activeCustomers = new Set<string>();

// How often the reconciler re-queries Mongo to spot newly-onboarded customers.
const RECONCILE_INTERVAL_MS = 30_000;

async function main() {
  await connectMongo();
  const redis = await getRedisClient();
  console.log("🚀 AuraCloud: Identity Sync Initiated");

  await reconcileCustomers(redis);
  setInterval(() => { void reconcileCustomers(redis); }, RECONCILE_INTERVAL_MS);
}

async function reconcileCustomers(redis: any) {
  try {
    const customers = await CustomerModel
      .find({ 'awsCredentials.status': 'connected' })
      .lean();

    for (const customer of customers) {
      const customerId = customer._id.toString();
      if (activeCustomers.has(customerId)) continue;
      activeCustomers.add(customerId);

      const tag = `${customer.name}:${customerId.slice(-6)}`;
      console.log(`🆕 Starting crawlers for ${tag}`);

      runCrawler(SsoCrawler,            customerId, `SSO[${tag}]`,            redis);
      runCrawler(PermissionSetsCrawler, customerId, `PermissionSets[${tag}]`, redis);
      runCrawler(BasicIamCrawler,       customerId, `IAM[${tag}]`,            redis);
      runCrawler(S3Crawler,             customerId, `S3[${tag}]`,             redis);
    }
  } catch (err: any) {
    console.error('reconcileCustomers failed:', err.message);
  }
}

async function runCrawler(Ctor: CrawlerCtor, customerId: string, name: string, redis: any) {
  let crawler: BaseCrawler | null = null;
  let cachedFingerprint: string | undefined;
  // Fallback poll interval used when there is no crawler instance yet (e.g.,
  // customer disconnected before we ever built one). Once a crawler exists we
  // use its own intervalMs.
  const idleSleepMs = 5000;

  while (true) {
    const start = Date.now();
    try {
      const customer = await CustomerModel.findById(customerId).lean();
      const creds = customer?.awsCredentials;

      if (!creds || creds.status !== 'connected' || !creds.accessKeyId || !creds.secretAccessKey) {
        if (crawler) {
          console.warn(`⏸️  ${name}: customer not connected — pausing until credentials are restored`);
          crawler = null;
          cachedFingerprint = undefined;
        }
      } else {
        // Fingerprint captures both fields so rotations that change only the
        // secret are also detected.
        const fingerprint = `${creds.accessKeyId}:${creds.secretAccessKey}`;
        if (!crawler || fingerprint !== cachedFingerprint) {
          crawler = new Ctor({ accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey });
          cachedFingerprint = fingerprint;
          console.log(`🔄 ${name}: credentials loaded`);
        }
        const data = await crawler.crawl();
        await crawler.save(redis, data);
        console.log(`[${new Date().toLocaleTimeString()}] ✅ ${name} Sync Complete`);
      }
    } catch (err: any) {
      console.error(`❌ ${name} Error:`, err.message);
    }
    const intervalMs = crawler?.intervalMs ?? idleSleepMs;
    const sleep = Math.max(intervalMs - (Date.now() - start), 0);
    await new Promise(r => setTimeout(r, sleep));
  }
}

main().catch(console.error);
