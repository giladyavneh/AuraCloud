// One-time migration: switch the canonical AWS-identity key from Mongo _id to
// the stable AWS externalId (SSO/IAM UserId), and personalise watchlist names.
//
//   1. Customer.linkedAwsUserId : User._id  ->  User.externalId
//   2. UserResourceWatchlist.userId : Customer._id  ->  externalId
//                           .name : "My Watchlist" -> "{first} {last}'s Watchlist"
//   3. UserPermission.userId        : Customer._id  ->  externalId
//
// Idempotent — safe to re-run. Already-migrated docs (keyed by externalId) are
// detected and left untouched (but their names are still kept in sync).
//
// Run with:  npm run migrate:external-id -w api-server
// Preview without writing:  npm run migrate:external-id -w api-server -- --dry-run

// Node 22+/24 defaults to IPv6 DNS (link-local) which causes querySrv ECONNREFUSED
// on residential routers that don't handle DNS-over-IPv6. Force IPv4 DNS servers
// before any network call is made.
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import {
  connectMongo,
  disconnectMongo,
  mongoose,
  CustomerModel,
  UserModel,
  UserResourceWatchlistModel,
  UserPermissionModel,
} from 'utils';
import type { Model } from 'mongoose';

// When true, the script reports planned changes but never writes to the DB.
const dryRun = process.argv.includes('--dry-run');
const tag = dryRun ? '[DRY RUN] ' : '';

/** Personalised watchlist title for a customer. */
function watchlistName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}'s Watchlist`;
}

interface CustomerMaps {
  // Old Customer._id -> externalId, used to remap watchlist/permission userId.
  customerIdToExternalId: Map<string, string>;
  // externalId -> personalised watchlist name, used to rename watchlists.
  externalIdToName: Map<string, string>;
}

/**
 * Step 1 — rewrite each Customer's linkedAwsUserId from the (fragile) User._id
 * to the (stable) User.externalId. Returns the maps steps 2 and 3 need.
 */
async function migrateCustomers(): Promise<CustomerMaps> {
  const customerIdToExternalId = new Map<string, string>();
  const externalIdToName = new Map<string, string>();
  const customers = await CustomerModel.find({ linkedAwsUserId: { $ne: null } });

  for (const customer of customers) {
    const linked = customer.linkedAwsUserId!;
    const customerId = customer._id.toString();
    const name = watchlistName(customer.firstName, customer.lastName);

    // Already an externalId? (e.g. partially-migrated or fresh data) — keep the
    // link, but still record the name so existing watchlists get renamed.
    const alreadyExternal = await UserModel.findOne({ externalId: linked }).lean();
    if (alreadyExternal) {
      customerIdToExternalId.set(customerId, linked);
      externalIdToName.set(linked, name);
      continue;
    }

    // Otherwise treat it as the old User._id and resolve its externalId.
    let externalId: string | null = null;
    if (mongoose.isValidObjectId(linked)) {
      const awsUser = await UserModel.findById(linked).lean();
      externalId = awsUser?.externalId ?? null;
    }

    if (externalId) {
      if (!dryRun) {
        customer.linkedAwsUserId = externalId;
        await customer.save();
      }
      customerIdToExternalId.set(customerId, externalId);
      externalIdToName.set(externalId, name);
      console.log(`${tag}Customer ${customer.email}: linkedAwsUserId ${linked} -> ${externalId}`);
    } else {
      // The referenced User no longer exists (sync churn) — clear the dangling
      // link so the app prompts the customer to re-select their AWS identity.
      if (!dryRun) {
        customer.linkedAwsUserId = null;
        await customer.save();
      }
      console.warn(`${tag}Customer ${customer.email}: could not resolve AWS user ${linked}; ${dryRun ? 'would clear' : 'cleared'} link (re-link required)`);
    }
  }

  return { customerIdToExternalId, externalIdToName };
}

/**
 * Step 2 — remap each watchlist's userId (old Customer._id -> externalId) and
 * set its personalised name. Naming is keyed by the post-remap externalId, so
 * both freshly-remapped and already-external watchlists get the right title.
 */
async function migrateWatchlists({ customerIdToExternalId, externalIdToName }: CustomerMaps): Promise<void> {
  const docs = await UserResourceWatchlistModel.find({});
  let remapped = 0;
  let renamed = 0;

  for (const doc of docs) {
    const mappedExternalId = customerIdToExternalId.get(doc.userId);
    if (mappedExternalId && mappedExternalId !== doc.userId) {
      if (!dryRun) doc.userId = mappedExternalId;
      remapped += 1;
    }

    // Effective externalId after the (possible) remap — used to pick the name.
    const effectiveExternalId = mappedExternalId ?? doc.userId;
    const desiredName = externalIdToName.get(effectiveExternalId);
    if (desiredName && doc.name !== desiredName) {
      if (!dryRun) doc.name = desiredName;
      renamed += 1;
    }

    if (!dryRun && doc.isModified()) await doc.save();
  }

  console.log(`${tag}watchlist: ${dryRun ? 'would remap' : 'remapped'} ${remapped}, ${dryRun ? 'would rename' : 'renamed'} ${renamed} (of ${docs.length} docs)`);
}

/**
 * Step 3 — remap a collection's userId field from the old Customer._id to the
 * externalId. Docs already keyed by an externalId aren't in the map, so they're
 * left untouched.
 */
async function remapUserId(
  model: Model<{ userId: string }>,
  customerIdToExternalId: Map<string, string>,
  label: string,
): Promise<void> {
  const docs = await model.find({});
  let remapped = 0;

  for (const doc of docs) {
    const externalId = customerIdToExternalId.get(doc.userId);
    if (externalId && externalId !== doc.userId) {
      if (!dryRun) {
        doc.userId = externalId;
        await doc.save();
      }
      remapped += 1;
    }
  }

  console.log(`${tag}${label}: ${dryRun ? 'would remap' : 'remapped'} ${remapped} of ${docs.length} docs`);
}

async function main(): Promise<void> {
  await connectMongo();

  if (dryRun) {
    console.log('Running in dry-run mode — no changes will be written.\n');
  }

  const maps = await migrateCustomers();
  await migrateWatchlists(maps);
  await remapUserId(UserPermissionModel, maps.customerIdToExternalId, 'permission');

  console.log(dryRun ? '\nDry run complete — re-run without --dry-run to apply.' : '\nMigration complete.');
}

main()
  .then(() => disconnectMongo())
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await disconnectMongo();
    process.exit(1);
  });
