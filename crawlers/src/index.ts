// Node 22+/24 defaults to IPv6 DNS (link-local) which causes querySrv ECONNREFUSED
// on residential routers. Force IPv4 DNS servers before any network call is made.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import { SsoCrawler } from "./ssoCrawler.js";
import { PermissionSetsCrawler } from "./permissionSetsCrawler.js";
import { BasicIamCrawler } from "./basicIamCrawler.js";
import { S3Crawler } from "./s3Crawler.js";
import {
  getRedisClient,
  connectMongo,
  CompanyModel,
  decryptSecret,
} from "utils";
import type { BaseCrawler, AwsCredentials } from "./crawlerBase.js";

type CrawlerCtor = new (credentials: AwsCredentials) => BaseCrawler;

// Companies we've already spawned crawler loops for. Loops live forever
// (paused via runCrawler when status flips), so we only need to track who
// already has a loop, not their current credentials — runCrawler handles that.
const activeCompanies = new Set<string>();

// How often the reconciler re-queries Mongo to spot newly-onboarded companies.
const RECONCILE_INTERVAL_MS = 30_000;

async function main() {
  const [redis] = await Promise.all([getRedisClient(), connectMongo()]);
  console.log("🚀 AuraCloud: Identity Sync Initiated");

  await reconcileCompanies(redis);
  setInterval(() => {
    void reconcileCompanies(redis);
  }, RECONCILE_INTERVAL_MS);
}

async function reconcileCompanies(redis: any) {
  try {
    const companies = await CompanyModel.find({
      "awsCredentials.status": "connected",
    }).lean();

    for (const company of companies) {
      const companyId = company._id.toString();
      if (activeCompanies.has(companyId)) continue;
      activeCompanies.add(companyId);

      const tag = `${company.name}:${companyId.slice(-6)}`;
      console.log(`🆕 Starting crawlers for ${tag}`);

      runCrawler(SsoCrawler, companyId, `SSO[${tag}]`, redis);
      runCrawler(
        PermissionSetsCrawler,
        companyId,
        `PermissionSets[${tag}]`,
        redis,
      );
      runCrawler(BasicIamCrawler, companyId, `IAM[${tag}]`, redis);
      runCrawler(S3Crawler, companyId, `S3[${tag}]`, redis);
    }
  } catch (err: any) {
    console.error("reconcileCompanies failed:", err.message);
  }
}

async function runCrawler(
  Ctor: CrawlerCtor,
  companyId: string,
  name: string,
  redis: any,
) {
  let crawler: BaseCrawler | null = null;
  let cachedFingerprint: string | undefined;
  // Fallback poll interval used when there is no crawler instance yet (e.g.,
  // company disconnected before we ever built one). Once a crawler exists we
  // use its own intervalMs.
  const idleSleepMs = 5000;

  while (true) {
    const start = Date.now();
    try {
      const company = await CompanyModel.findById(companyId).lean();
      const creds = company?.awsCredentials;

      if (
        !creds ||
        creds.status !== "connected" ||
        !creds.accessKeyId ||
        !creds.secretAccessKey
      ) {
        if (crawler) {
          console.warn(
            `⏸️  ${name}: company not connected — pausing until credentials are restored`,
          );
          crawler = null;
          cachedFingerprint = undefined;
        }
      } else {
        // Fingerprint uses the ciphertext (cheap, deterministic per rotation).
        // When it changes we rebuild the crawler with freshly decrypted creds.
        const fingerprint = `${creds.accessKeyId}:${creds.secretAccessKey}`;
        if (fingerprint !== cachedFingerprint) {
          try {
            const decrypted = decryptSecret(creds.secretAccessKey);
            crawler = new Ctor({
              accessKeyId: creds.accessKeyId,
              secretAccessKey: decrypted,
            });
            console.log(`🔄 ${name}: credentials loaded`);
          } catch (err: any) {
            console.warn(
              `⏸️  ${name}: secret could not be decrypted (${err.message}) — pausing`,
            );
            crawler = null;
          }
          // Cache even on failure so we don't spam the warning each tick;
          // only retry once the ciphertext actually changes.
          cachedFingerprint = fingerprint;
        }
        if (crawler) {
          const data = await crawler.crawl();
          await crawler.save(redis, data);
          console.log(
            `[${new Date().toLocaleTimeString()}] ✅ ${name} Sync Complete`,
          );
        }
      }
    } catch (err: any) {
      console.error(`❌ ${name} Error:`, err.message);
    }
    const intervalMs = crawler?.intervalMs ?? idleSleepMs;
    const sleep = Math.max(intervalMs - (Date.now() - start), 0);
    await new Promise((r) => setTimeout(r, sleep));
  }
}

main().catch(console.error);
