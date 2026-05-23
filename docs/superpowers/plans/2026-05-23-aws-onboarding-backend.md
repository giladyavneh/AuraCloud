# AWS Onboarding Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist per-customer AWS credentials in Mongo, expose an endpoint to receive them, and refactor crawlers to use those stored credentials instead of the local `~/.aws/credentials` chain.

**Architecture:** A new `CustomerModel` in `utils/` holds an optional `awsCredentials` sub-document. `api-server` adds `POST /api/aws/onboard-credentials` to write into it. The crawler orchestrator (`crawlers/src/index.ts`) queries connected customers at startup and passes their credentials into crawler constructors (Design A — constructor injection). Crawler subclasses change only their AWS SDK client construction; no crawl logic or Redis-write behavior changes.

**Tech Stack:** TypeScript, Express 5, Mongoose 9, AWS SDK v3 clients (`@aws-sdk/client-s3`, `-iam`, `-sts`, `-sso-admin`, `-identitystore`, `-ec2`). MongoDB Atlas. No test framework — verification is manual via Postman, restart-and-watch, Redis inspection.

**Spec:** `docs/superpowers/specs/2026-05-23-aws-onboarding-design.md`

**Branch:** `clud-formartions` (current branch — do not switch).

---

## Pre-flight

- [ ] **Step 1: Confirm clean working tree (except known unstaged template content)**

Run: `git -C /Users/amit.reich/AuraCloud status`

Expected: `templates/aura-onboarding.yaml` shown as unstaged modification (pre-existing pending work — leave alone). No other changes.

- [ ] **Step 2: Confirm Mongo + Redis are reachable**

Run: `npm run redis:up` (if not already up) and verify `MONGO_URI` is set in `.env` files for `api-server`, `crawlers`, and `utils`.

---

## Task 1: Add Customer model to utils workspace

**Files:**
- Modify: `utils/src/index.ts` (append model near the existing `UserModel` block at line ~142–151)

- [ ] **Step 1: Add the Customer schema, types, and model export**

Open `utils/src/index.ts`. After the `UserModel` block (currently ending at line 151 with `export const UserModel = mongoose.model('User', userSchema);`), and before `export { mongoose };`, insert:

```ts
const customerSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    email: { type: String },
    awsCredentials: {
      accessKeyId:     { type: String },
      // TODO: encrypt secretAccessKey before persisting (MVP plaintext)
      secretAccessKey: { type: String },
      status:          { type: String, enum: ['connected', 'disconnected', 'error'], default: 'connected' },
      connectedAt:     { type: Date },
    },
  },
  { timestamps: true },
);

export type Customer = InferSchemaType<typeof customerSchema>;
export type CustomerDoc = HydratedDocument<Customer>;

export const CustomerModel =
  (mongoose.models.Customer as mongoose.Model<Customer>) ??
  mongoose.model<Customer>('Customer', customerSchema);
```

- [ ] **Step 2: Build utils so consumers can resolve the new export**

Run: `npm run build -w utils`

Expected: `tsc` exits 0. `utils/dist/index.js` and `utils/dist/index.d.ts` are updated with `CustomerModel`.

- [ ] **Step 3: Verify the type surface**

Run: `grep -c "CustomerModel" /Users/amit.reich/AuraCloud/utils/dist/index.d.ts`

Expected: `>= 1`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/amit.reich/AuraCloud add utils/src/index.ts
git -C /Users/amit.reich/AuraCloud commit -m "feat(utils): add Customer model with awsCredentials sub-document"
```

---

## Task 2: Re-export CustomerModel from api-server/src/db.ts

**Files:**
- Modify: `api-server/src/db.ts:1-7`

- [ ] **Step 1: Add CustomerModel to the import and re-export**

Open `api-server/src/db.ts`. Change line 2 from:

```ts
import { connectMongo, UserResourceWatchlistModel, UserPermissionModel } from 'utils';
```

to:

```ts
import { connectMongo, UserResourceWatchlistModel, UserPermissionModel, CustomerModel } from 'utils';
```

Change line 7 from:

```ts
export { UserResourceWatchlistModel, UserPermissionModel };
```

to:

```ts
export { UserResourceWatchlistModel, UserPermissionModel, CustomerModel };
```

- [ ] **Step 2: Verify api-server typechecks**

Run: `npm run build -w api-server`

Expected: `tsc` exits 0.

- [ ] **Step 3: Commit**

```bash
git -C /Users/amit.reich/AuraCloud add api-server/src/db.ts
git -C /Users/amit.reich/AuraCloud commit -m "feat(api-server): re-export CustomerModel from db module"
```

---

## Task 3: Add POST /api/aws/onboard-credentials endpoint

**Files:**
- Modify: `api-server/src/index.ts` (add import + new route handler after the existing `app.get` blocks, before `connectDB().then(...)`)

- [ ] **Step 1: Import CustomerModel**

Open `api-server/src/index.ts`. Change line 4 from:

```ts
import { connectDB, UserResourceWatchlistModel, UserPermissionModel } from "./db.js";
```

to:

```ts
import { connectDB, UserResourceWatchlistModel, UserPermissionModel, CustomerModel } from "./db.js";
```

- [ ] **Step 2: Add the POST handler**

After the existing `app.get("/api/user-permissions/:userId", ...)` handler (ends around line 35) and before `connectDB()`, insert:

```ts
app.post('/api/aws/onboard-credentials', async (req, res) => {
  try {
    const { customerId, accessKeyId, secretAccessKey } = req.body ?? {};

    if (
      typeof customerId !== 'string' || !customerId.trim() ||
      typeof accessKeyId !== 'string' || !accessKeyId.trim() ||
      typeof secretAccessKey !== 'string' || !secretAccessKey.trim()
    ) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const updated = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $set: {
          // TODO: encrypt secretAccessKey before saving (use KMS/libsodium/etc).
          awsCredentials: {
            accessKeyId,
            secretAccessKey,
            status: 'connected',
            connectedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const sanitized = {
      ...updated,
      awsCredentials: updated.awsCredentials
        ? {
            accessKeyId: updated.awsCredentials.accessKeyId,
            status: updated.awsCredentials.status,
            connectedAt: updated.awsCredentials.connectedAt,
          }
        : undefined,
    };

    res.json(sanitized);
  } catch (err) {
    console.error('POST /api/aws/onboard-credentials failed:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
```

- [ ] **Step 3: Build api-server**

Run: `npm run build -w api-server`

Expected: `tsc` exits 0.

- [ ] **Step 4: Manually verify the endpoint with Postman**

In a terminal: `npm run start:api-server` (leave running).

In another terminal or in `mongosh`, insert a test Customer to obtain an `_id`:

```js
db.customers.insertOne({ name: 'Test Customer', email: 'test@example.com' })
// copy the returned _id
```

In Postman:

1. `POST http://localhost:3000/api/aws/onboard-credentials` with JSON body:
   ```json
   { "customerId": "<paste _id>", "accessKeyId": "AKIA-TEST", "secretAccessKey": "secret-test" }
   ```
   Expected: `200` with response body containing `awsCredentials.status: "connected"` and **no `secretAccessKey` field** in the response.

2. Same endpoint, missing `secretAccessKey`. Expected: `400 { "message": "Missing required fields" }`.

3. Same endpoint, with `customerId: "000000000000000000000000"`. Expected: `404 { "message": "Customer not found" }`.

4. In `mongosh`: `db.customers.findOne({ _id: ObjectId("<your id>") })`. Expected: document has `awsCredentials.secretAccessKey: "secret-test"` (plaintext, as designed for MVP).

Stop the api-server.

- [ ] **Step 5: Commit**

```bash
git -C /Users/amit.reich/AuraCloud add api-server/src/index.ts
git -C /Users/amit.reich/AuraCloud commit -m "feat(api-server): add POST /api/aws/onboard-credentials endpoint"
```

---

## Task 4: Refactor BaseCrawler to accept credentials in constructor

**Files:**
- Modify: `crawlers/src/crawlerBase.ts`

- [ ] **Step 1: Add credentials field, update constructor and getRegions()**

Replace the contents of `crawlers/src/crawlerBase.ts` with:

```ts
import { EC2Client, DescribeRegionsCommand } from "@aws-sdk/client-ec2";

export type AwsCredentials = { accessKeyId: string; secretAccessKey: string };

export abstract class BaseCrawler {
  protected accountId: string;
  protected region: string;
  protected intervalMs: number;
  protected credentials: AwsCredentials;

  constructor(credentials: AwsCredentials, intervalMs: number = 5000) {
    this.credentials = credentials;
    this.accountId = process.env.TARGET_ACCOUNT_ID || "";
    this.region = process.env.AWS_REGION || "eu-central-1";
    this.intervalMs = intervalMs;
  }

  // Necessary because S3, KMS, and Network are regional; IAM is global.
  protected async getRegions(): Promise<string[]> {
    const client = new EC2Client({ region: this.region, credentials: this.credentials });
    const { Regions } = await client.send(new DescribeRegionsCommand({}));
    return Regions?.map(r => r.RegionName!).filter(Boolean) || [this.region];
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
```

- [ ] **Step 2: Build crawlers and confirm the subclasses break (proving the contract change took effect)**

Run: `npm run build -w crawlers`

Expected: `tsc` errors in `s3Crawler.ts`, `basicIamCrawler.ts`, `ssoCrawler.ts`, `permissionSetsCrawler.ts` along the lines of "Expected 1-2 arguments, but got 0" — because subclasses use `new XClient({ region: this.region })` without credentials at field-init time, and the abstract base now requires `credentials`. (Some subclasses may compile if they don't override the constructor — the orchestrator-side breakage from no-arg `new SsoCrawler()` will show up in Task 8.) This step intentionally leaves the codebase in a non-compiling state — Tasks 5–8 fix each subclass.

Do NOT commit yet — wait until Task 8 to commit the whole crawler refactor as one unit.

---

## Task 5: Update S3Crawler to inject credentials

**Files:**
- Modify: `crawlers/src/s3Crawler.ts:7-9`

- [ ] **Step 1: Pass credentials into S3Client and STSClient**

Change lines 7-9 of `crawlers/src/s3Crawler.ts` from:

```ts
    protected s3Client = new S3Client({ region: this.region });
    protected stsClient = new STSClient({ region: this.region });
    protected intervalMs = 1000;
```

to:

```ts
    protected s3Client = new S3Client({ region: this.region, credentials: this.credentials });
    protected stsClient = new STSClient({ region: this.region, credentials: this.credentials });
    protected intervalMs = 1000;
```

No other changes in this file.

---

## Task 6: Update BasicIamCrawler to inject credentials

**Files:**
- Modify: `crawlers/src/basicIamCrawler.ts:10-11`

- [ ] **Step 1: Pass credentials into IAMClient**

Change line 11 of `crawlers/src/basicIamCrawler.ts` from:

```ts
    protected iamClient = new IAMClient({ region: this.region });
```

to:

```ts
    protected iamClient = new IAMClient({ region: this.region, credentials: this.credentials });
```

No other changes in this file.

---

## Task 7: Update SsoCrawler to inject credentials

**Files:**
- Modify: `crawlers/src/ssoCrawler.ts:8-9`

- [ ] **Step 1: Pass credentials into SSOAdminClient and IdentitystoreClient**

Change lines 8-9 of `crawlers/src/ssoCrawler.ts` from:

```ts
    protected ssoAdminClient = new SSOAdminClient({ region: this.region });
    protected identityStoreClient = new IdentitystoreClient({ region: this.region });
```

to:

```ts
    protected ssoAdminClient = new SSOAdminClient({ region: this.region, credentials: this.credentials });
    protected identityStoreClient = new IdentitystoreClient({ region: this.region, credentials: this.credentials });
```

No other changes in this file.

---

## Task 8: Update PermissionSetsCrawler — inject credentials + remove stray module-level invocation

**Files:**
- Modify: `crawlers/src/permissionSetsCrawler.ts:36-38` (clients) and `:210` (stray invocation)

- [ ] **Step 1: Pass credentials into all three clients**

Change lines 36-38 of `crawlers/src/permissionSetsCrawler.ts` from:

```ts
  protected ssoAdmin = new SSOAdminClient({ region: this.region });
  protected iam = new IAMClient({ region: this.region });
  protected sts = new STSClient({ region: this.region });
```

to:

```ts
  protected ssoAdmin = new SSOAdminClient({ region: this.region, credentials: this.credentials });
  protected iam = new IAMClient({ region: this.region, credentials: this.credentials });
  protected sts = new STSClient({ region: this.region, credentials: this.credentials });
```

- [ ] **Step 2: Remove the stray module-level `.crawl()` invocation**

Delete line 210 entirely (and any leading blank lines just above it that become trailing whitespace):

```ts
new PermissionSetsCrawler().crawl().catch((err) => console.error("Crawler failed:", err));
```

The file should now end at the closing `}` of the `PermissionSetsCrawler` class.

- [ ] **Step 3: Build crawlers — should compile cleanly except for the now-incompatible orchestrator (index.ts)**

Run: `npm run build -w crawlers`

Expected: remaining error is in `crawlers/src/index.ts` from `new SsoCrawler()` etc. having no arguments. Task 9 fixes this.

---

## Task 9: Refactor crawlers/src/index.ts orchestrator

**Files:**
- Modify: `crawlers/src/index.ts` (replace contents)

- [ ] **Step 1: Replace contents to fetch customers and instantiate per customer**

Replace the entire contents of `crawlers/src/index.ts` with:

```ts
import 'dotenv/config';
import { SsoCrawler } from './ssoCrawler.js';
import { PermissionSetsCrawler } from './permissionSetsCrawler.js';
import { BasicIamCrawler } from './basicIamCrawler.js';
import { S3Crawler } from './s3Crawler.js';
import { getRedisClient, connectMongo, CustomerModel } from 'utils';

async function main() {
  await connectMongo();
  const redis = await getRedisClient();
  console.log("🚀 AuraCloud: Identity Sync Initiated");

  const customers = await CustomerModel
    .find({ 'awsCredentials.status': 'connected' })
    .lean();

  if (customers.length === 0) {
    console.warn("⚠️  No connected customers found — crawlers idle. Onboard a customer to begin.");
    return;
  }

  for (const customer of customers) {
    const creds = customer.awsCredentials;
    if (!creds?.accessKeyId || !creds?.secretAccessKey) {
      console.warn(`⚠️  Customer ${customer._id} marked connected but missing keys — skipping`);
      continue;
    }
    const credentials = {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    };
    const tag = `${customer.name}:${customer._id.toString().slice(-6)}`;

    runCrawler(new SsoCrawler(credentials),            `SSO[${tag}]`,            redis);
    runCrawler(new PermissionSetsCrawler(credentials), `PermissionSets[${tag}]`, redis);
    runCrawler(new BasicIamCrawler(credentials),       `IAM[${tag}]`,            redis);
    runCrawler(new S3Crawler(credentials),             `S3[${tag}]`,             redis);
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
```

- [ ] **Step 2: Build crawlers — should now compile cleanly**

Run: `npm run build -w crawlers`

Expected: `tsc` exits 0.

- [ ] **Step 3: Build everything to confirm no cross-workspace regressions**

Run: `npm run build:all`

Expected: `tsc` exits 0 across all workspaces.

- [ ] **Step 4: Commit the entire crawler refactor as one unit**

```bash
git -C /Users/amit.reich/AuraCloud add \
  crawlers/src/crawlerBase.ts \
  crawlers/src/s3Crawler.ts \
  crawlers/src/basicIamCrawler.ts \
  crawlers/src/ssoCrawler.ts \
  crawlers/src/permissionSetsCrawler.ts \
  crawlers/src/index.ts
git -C /Users/amit.reich/AuraCloud commit -m "$(cat <<'EOF'
refactor(crawlers): inject per-customer AWS credentials via constructor

BaseCrawler now requires { accessKeyId, secretAccessKey } at construction.
Each subclass passes them through to its AWS SDK clients. The orchestrator
(crawlers/src/index.ts) queries Customer documents with
awsCredentials.status === 'connected' and instantiates one crawler set per
customer. Removes the stray module-level PermissionSetsCrawler.crawl() that
ran on import and is incompatible with the new required argument.
EOF
)"
```

---

## Task 10: End-to-end manual verification

- [ ] **Step 1: Reset Redis (optional, for a clean snapshot)**

Run: `npm run redis:up -w utils` if not already up. Optionally `FLUSHALL` via `redis-cli` to start clean.

- [ ] **Step 2: Onboard a real customer**

Start the api-server: `npm run start:api-server` (separate terminal, leave running).

In `mongosh`, insert (or reuse the Test Customer from Task 3 Step 4):

```js
db.customers.insertOne({ name: 'My Real Test', email: 'me@example.com' })
```

Take the `_id`. Run the CloudFormation stack in `templates/aura-onboarding.yaml` against a real AWS account to obtain a real `AuraAccessKeyId` and `AuraSecretAccessKey`.

In Postman, `POST http://localhost:3000/api/aws/onboard-credentials`:

```json
{ "customerId": "<id>", "accessKeyId": "<real AKIA...>", "secretAccessKey": "<real secret>" }
```

Expected: `200`, sanitized response.

- [ ] **Step 3: Start crawlers and verify they pick up the customer**

Run: `npm run start:crawlers`

Expected logs:
- `🚀 Mongo Live at ...`
- `🚀 Redis connected (...)`
- `🚀 AuraCloud: Identity Sync Initiated`
- `✅ SSO[My Real Test:<6chars>] Sync Complete`, `✅ IAM[...]`, `✅ S3[...]`, `✅ PermissionSets[...]` — appearing on their respective interval cadences.
- No `❌` errors about credentials.

- [ ] **Step 4: Verify Redis was populated**

In `redis-cli`:

```
HKEYS aura:resource:s3buckets
HKEYS aura:iam:users
HKEYS aura:sso:users
HKEYS aura:sso:permission-sets
```

Expected: each command returns real data from the connected AWS account, not empty arrays (assuming the account actually has resources).

- [ ] **Step 5: Verify the "no customers" branch**

In `mongosh`:

```js
db.customers.updateOne({ _id: ObjectId("<id>") }, { $set: { "awsCredentials.status": "disconnected" } })
```

Restart crawlers. Expected log: `⚠️  No connected customers found — crawlers idle. Onboard a customer to begin.` Process exits cleanly.

Restore: `db.customers.updateOne({ _id: ObjectId("<id>") }, { $set: { "awsCredentials.status": "connected" } })`.

- [ ] **Step 6: Verify the "no logic regression" path**

Start `logic` (`npm run start:logic`) alongside crawlers. Expected: logic worker processes the watchlist users as before and writes to `UserPermission`. Existing behavior unchanged.

- [ ] **Step 7: Final sanity check — git status clean (except pre-existing template work)**

Run: `git -C /Users/amit.reich/AuraCloud status`

Expected: only `templates/aura-onboarding.yaml` (pre-existing) and untracked items (`.DS_Store`, `.idea/`, `Aura-Cloud-Dummy/`) are shown — no leftover modifications from this work.

---

## Rollback notes

If something goes wrong mid-implementation, each task is committed independently. To roll back the full feature: `git revert <commit-sha>` for each commit in reverse order (Task 9 → Task 3 → Task 2 → Task 1). The CustomerModel commit is safe to keep even if the rest is reverted; it adds an unused export only.
