import 'dotenv/config';
import { IdentityCrawler, ResourceCrawler, KMSCrawler } from './crawlers.js';

async function main() {
  console.log("🚀 AuraCloud Prototype: Starting Deep Audit...");

  const identityData = await new IdentityCrawler().crawl();
  const s3Data = await new ResourceCrawler().crawl();
  const kmsData = await new KMSCrawler().crawl();

  console.log("\n--- 📜 Audit Discovery ---");
  console.log(`👤 Identities: Found ${identityData.length} relevant SSO roles.`);
  console.log(JSON.stringify(identityData, null, 2));
  console.log(`📦 Resource: ${s3Data.map(d => d.name).join(", ")} policy extracted.`);
  console.log(JSON.stringify(s3Data, null, 2));
  console.log(`🔑 Encryption: ${kmsData ? "KMS Policy detected" : "No KMS keys found"}.`);
  console.log(JSON.stringify(kmsData, null, 2));

  console.log("\n--- 🚦 Reachability Summary ---");
  
}

main();