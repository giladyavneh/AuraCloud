# AWS Onboarding — Backend Design

**Date:** 2026-05-23
**Scope:** Backend only (no frontend). Database schema, onboarding API endpoint, crawler refactor to consume per-customer credentials.

## Context

AuraCloud is a multi-tenant SaaS. Today, the `crawlers` workspace authenticates to AWS via the operator's local `~/.aws/credentials` — there is no concept of a paying customer in the data model. We are introducing the first piece of multi-tenancy: a Customer record that stores AWS credentials per tenant, an API endpoint to receive credentials from the frontend (or Postman during MVP), and a crawler refactor that consumes those stored credentials instead of the local credential chain.

### End-to-end onboarding flow this work enables

1. Customer receives a magic link (out of scope for this spec).
2. Customer runs the CloudFormation stack in `templates/aura-onboarding.yaml` against their AWS account. The stack provisions an `Aura-SaaS-Crawler` IAM user with `ReadOnlyAccess` and outputs `AuraAccessKeyId` + `AuraSecretAccessKey`.
3. Customer pastes those two values into the AuraCloud UI (during MVP: submitted manually via Postman — UI is not yet built).
4. UI/Postman calls `POST /api/aws/onboard-credentials` with `{ customerId, accessKeyId, secretAccessKey }`.
5. `api-server` persists the credentials onto the Customer document.
6. Crawlers, at startup, query MongoDB for all customers whose credentials are in `connected` state, then instantiate AWS SDK clients with those credentials — replacing the local credential chain.

### Hard constraint

> "After the crawler logs in, all the logic, worker, crawlers work should remain the same."

The crawl logic, Redis writes, throttling behavior, and inter-process boundaries must be unchanged. Only the AWS SDK client construction changes — `new S3Client({ region })` becomes `new S3Client({ region, credentials })`.

## Architecture

### Credential delivery: constructor injection (Design A)

`crawlers/src/index.ts` (the orchestrator) is responsible for the Mongo lookup. It fetches every customer with `awsCredentials.status === 'connected'` at startup, then instantiates one set of crawlers per customer with the credentials passed into the constructor. Crawler subclasses do not import Mongo or `CustomerModel`.

**Rationale (vs. crawler-fetches-from-Mongo):**
- Honors the hard constraint above — subclasses change by exactly one line per AWS client.
- Crawlers remain testable in isolation (pass them credentials, no Mongo needed).
- `logic/` cannot deliver credentials over an existing channel — `logic/` and `crawlers/` communicate only through Redis today, and inventing an RPC path is out of proportion to this work.
- Trade-off: rotating a customer's keys requires a crawler-process restart. This is the same operational model as the previous `~/.aws/credentials` setup, so no regression.

## Data model

New `CustomerModel` in `utils/src/index.ts`, alongside the existing models and re-exported the same way they are (`api-server/src/db.ts` re-exports for the api-server side).

```ts
const customerSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String },
  awsCredentials: {
    accessKeyId:     { type: String },
    secretAccessKey: { type: String }, // TODO: encrypt before persisting (MVP plaintext)
    status:          { type: String, enum: ['connected', 'disconnected', 'error'], default: 'connected' },
    connectedAt:     { type: Date },
  },
}, { timestamps: true });

export type Customer = InferSchemaType<typeof customerSchema>;
export type CustomerDoc = HydratedDocument<Customer>;

export const CustomerModel =
  (mongoose.models.Customer as mongoose.Model<Customer>) ??
  mongoose.model<Customer>('Customer', customerSchema);
```

**Notes:**
- `awsCredentials` is intentionally optional — a customer can exist before they've completed onboarding.
- `secretAccessKey` is stored as plaintext for the MVP, with a `TODO` comment marking the encryption work. The user has explicitly accepted this for the MVP testing phase.
- We do not modify the existing `UserModel` (which represents IAM/SSO identities crawled out of AWS, not SaaS tenants). Customer is a distinct concept.

## API endpoint

`POST /api/aws/onboard-credentials` in `api-server/src/index.ts`.

**Request body:**
```json
{ "customerId": "string (Mongo ObjectId)", "accessKeyId": "string", "secretAccessKey": "string" }
```

**Behavior:**
- Validate all three fields are present non-empty strings → `400 { message: 'Missing required fields' }` otherwise.
- `CustomerModel.findByIdAndUpdate(customerId, { $set: { awsCredentials: { accessKeyId, secretAccessKey, status: 'connected', connectedAt: new Date() } } }, { new: true })`.
- `// TODO: encrypt secretAccessKey before saving` placed adjacent to the `$set` payload.
- `404 { message: 'Customer not found' }` if no document matches.
- `200` with the updated customer document **with `secretAccessKey` omitted** from the response payload.
- `500 { message: 'Server Error' }` on unexpected errors. Matches the existing handler style in `api-server/src/index.ts`.

**Out of scope for the endpoint:**
- Authentication. No auth layer exists in this repo yet; the endpoint is open like the existing routes.
- Validating the credentials actually work against AWS. We trust the input. If they're wrong, the crawlers will surface errors on next run.

## Crawler refactor

### `crawlers/src/crawlerBase.ts`

`BaseCrawler` gains a required `credentials` field.

```ts
type AwsCredentials = { accessKeyId: string; secretAccessKey: string };

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
  // ...rest unchanged
}
```

`getRegions()` continues to use `EC2Client` — it needs credentials too, so update that call to pass `this.credentials`.

### Each crawler subclass (`s3Crawler.ts`, `basicIamCrawler.ts`, `ssoCrawler.ts`, `permissionSetsCrawler.ts`)

- Change each AWS SDK client field initializer from `new XClient({ region: this.region })` to `new XClient({ region: this.region, credentials: this.credentials })`.
- No other changes to crawl logic, Redis writes, or throttling.
- Subclasses that override the constructor (none currently do explicitly, but `intervalMs` is sometimes set via a field initializer like `protected intervalMs = 1000`) continue to work — the base default of 5000 is overridden by the field initializer after construction, which is the existing behavior.

### `crawlers/src/permissionSetsCrawler.ts:210`

Remove the stray module-level `new PermissionSetsCrawler().crawl().catch(...)`. It runs on import, is unrelated to the orchestrator loop, and would break under the new required-credentials constructor signature.

### `crawlers/src/index.ts`

Refactored startup:

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

  const customers = await CustomerModel.find({ 'awsCredentials.status': 'connected' }).lean();

  if (customers.length === 0) {
    console.warn("⚠️  No connected customers found — crawlers idle. Onboard a customer to begin.");
    return; // process exits; restart after onboarding
  }

  for (const customer of customers) {
    const creds = customer.awsCredentials;
    if (!creds?.accessKeyId || !creds?.secretAccessKey) {
      console.warn(`⚠️  Customer ${customer._id} marked connected but missing keys — skipping`);
      continue;
    }
    const credentials = { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey };
    const tag = `${customer.name}:${customer._id.toString().slice(-6)}`;

    runCrawler(new SsoCrawler(credentials),             `SSO[${tag}]`,             redis);
    runCrawler(new PermissionSetsCrawler(credentials),  `PermissionSets[${tag}]`,  redis);
    runCrawler(new BasicIamCrawler(credentials),        `IAM[${tag}]`,             redis);
    runCrawler(new S3Crawler(credentials),              `S3[${tag}]`,              redis);
  }
}

async function runCrawler(crawler: any, name: string, redis: any) {
  // unchanged
}

main().catch(console.error);
```

**Behavior on no-customers:** log a warning and exit cleanly. The operator restarts the process after onboarding the first customer. This is the simplest behavior consistent with the constraint that runtime behavior should not change post-login.

## What stays unchanged

- `logic/` workspace: no changes.
- `userSync` worker: no changes.
- Redis schema: no changes.
- API server's existing routes (`GET /api/user-resource-watchlist`, `GET /api/user-permissions/:userId`): no changes.
- Crawl algorithms, Redis writes, throttling: no changes.
- Mock seeding in `api-server/src/db.ts`: no changes (Customer collection starts empty; the first customer is created by Postman during MVP testing).

## Out of scope

- Encryption of `secretAccessKey` (TODO left in code).
- Hot-reload of credentials while crawlers are running.
- Authentication on the onboarding endpoint.
- A separate endpoint to create a Customer record. For MVP, the operator inserts a Customer directly via Mongo or via a future `POST /api/customers` endpoint; the onboarding endpoint only updates `awsCredentials`.
- Frontend changes.
- CloudFormation template work (already shipped in `templates/aura-onboarding.yaml`).
- Multi-region or multi-account-per-customer support.

## Testing plan

Manual, via Postman:
1. Start MongoDB and Redis. Run `npm run start:api-server`.
2. Insert a Customer directly into Mongo: `db.customers.insertOne({ name: 'Test', email: 'test@example.com' })`. Note the `_id`.
3. POST to `http://localhost:3000/api/aws/onboard-credentials` with that `customerId` and a real access key / secret from the CloudFormation stack output.
4. Verify the Customer document now has `awsCredentials` populated with `status: 'connected'` and a `connectedAt` timestamp.
5. Verify the response body omits `secretAccessKey`.
6. Stop and restart the crawlers (`npm run start:crawlers`). Verify they log the onboarded customer's tag and successfully crawl AWS.
7. Verify Redis keys (`aura:resource:s3buckets`, `aura:iam:users`, etc.) populate as before.
8. Negative cases: missing field returns 400; nonexistent customerId returns 404; crawlers with zero connected customers log warning and exit.

## File-level change summary

| File | Change |
|---|---|
| `utils/src/index.ts` | Add `customerSchema`, `Customer`/`CustomerDoc` types, `CustomerModel` export |
| `api-server/src/db.ts` | Re-export `CustomerModel` alongside existing models |
| `api-server/src/index.ts` | Add `POST /api/aws/onboard-credentials` handler |
| `crawlers/src/crawlerBase.ts` | Accept `credentials` in constructor, store on instance, pass to `EC2Client` in `getRegions()` |
| `crawlers/src/s3Crawler.ts` | Pass `this.credentials` into `S3Client` and `STSClient` |
| `crawlers/src/basicIamCrawler.ts` | Pass `this.credentials` into `IAMClient` |
| `crawlers/src/ssoCrawler.ts` | Pass `this.credentials` into `SSOAdminClient` and `IdentitystoreClient` |
| `crawlers/src/permissionSetsCrawler.ts` | Pass `this.credentials` into `SSOAdminClient`, `IAMClient`, `STSClient`; remove stray module-level `.crawl()` invocation |
| `crawlers/src/index.ts` | Add `connectMongo()`, query connected customers, instantiate crawler sets per customer with credentials injected |

**Not touched:** `crawlers/src/callerIdentifier.ts` — `identifyCaller()` is defined but never imported. Leaving it as-is to keep this work scoped.
