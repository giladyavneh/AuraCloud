import { createClient } from 'redis';

type AppRedisClient = ReturnType<typeof createClient>;
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose, { type InferSchemaType, type HydratedDocument } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.set('strictQuery', true);


function resolveRedisUrl(): string {
  const direct = process.env.REDIS_URL?.trim();
  if (direct) return direct;
  const host = process.env.REDIS_HOST?.trim() || '127.0.0.1';
  const port = process.env.REDIS_PORT?.trim() || '6379';
  return `redis://${host}:${port}`;
}

let redisClientPromise: Promise<AppRedisClient> | null = null;
let memoryServer: RedisMemoryServer | undefined;

async function connectSharedRedis(url: string): Promise<AppRedisClient> {
  const client = createClient({ url });
  client.on('error', (err) => console.error('Redis client error:', err));
  await client.connect();
  const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`🚀 Redis connected (${masked})`);
  return client;
}

async function connectMemoryServerRedis(): Promise<AppRedisClient> {
  memoryServer ??= new RedisMemoryServer();
  const host = await memoryServer.getHost();
  const port = await memoryServer.getPort();
  return connectSharedRedis(`redis://${host}:${port}`);
}

export async function getRedisClient(): Promise<AppRedisClient> {
  redisClientPromise ??= (async () => {
    const useMemory = process.env.REDIS_USE_MEMORY_SERVER === 'true' || process.env.REDIS_USE_MEMORY_SERVER === '1';
    if (useMemory) return connectMemoryServerRedis();
    return connectSharedRedis(resolveRedisUrl());
  })();
  return redisClientPromise;
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClientPromise) return;
  const clientPromise = redisClientPromise;
  redisClientPromise = null;
  const client = await clientPromise.catch(() => null);
  if (client?.isOpen) await client.quit();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}

let mongoConnectPromise: Promise<typeof mongoose> | null = null;
let mongoListenersAttached = false;

function attachMongoListeners() {
  if (mongoListenersAttached) return;
  mongoListenersAttached = true;
  mongoose.connection.on('error', (err) => console.error('Mongo connection error:', err));
  mongoose.connection.on('disconnected', () => console.warn('Mongo disconnected'));
  mongoose.connection.on('reconnected', () => console.log('Mongo reconnected'));
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoConnectPromise) return mongoConnectPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  attachMongoListeners();

  mongoConnectPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
      autoIndex: process.env.NODE_ENV !== 'production',
    })
    .then((m) => {
      console.log(`🚀 Mongo Live at ${m.connection.host}`);
      return m;
    })
    .catch((err) => {
      mongoConnectPromise = null;
      throw err;
    });

  return mongoConnectPromise;
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  mongoConnectPromise = null;
}

const userResourceWatchlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    resources: [
      {
        _id: false,
        arn: { type: String, required: true },
        actions: [{ type: String }],
      },
    ],
  },
  { timestamps: true },
);

const userPermissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    permissionsData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, minimize: false },
);

export type UserResourceWatchlist = InferSchemaType<typeof userResourceWatchlistSchema>;
export type UserResourceWatchlistDoc = HydratedDocument<UserResourceWatchlist>;
export type UserPermission = InferSchemaType<typeof userPermissionSchema>;
export type UserPermissionDoc = HydratedDocument<UserPermission>;

export const UserResourceWatchlistModel =
  (mongoose.models.UserResourceWatchlist as mongoose.Model<UserResourceWatchlist>) ??
  mongoose.model<UserResourceWatchlist>('UserResourceWatchlist', userResourceWatchlistSchema);

export const UserPermissionModel =
  (mongoose.models.UserPermission as mongoose.Model<UserPermission>) ??
  mongoose.model<UserPermission>('UserPermission', userPermissionSchema);

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  source:     { type: String, enum: ['IAM', 'SSO'], required: true },
  externalId: { type: String, required: true },  // IAM UserId (AIDA…) or SSO UserId (UUID)
  arn:        { type: String, default: null },   // null for SSO
  lastSeenAt: { type: Date,   required: true },
});
userSchema.index({ source: 1, externalId: 1 }, { unique: true });

export const UserModel = mongoose.model('User', userSchema);

// ==========================================
// AwsResource — catalogue of every discovered AWS resource
// ==========================================
const awsResourceSchema = new mongoose.Schema(
  {
    arn: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ['S3Bucket', 'IAMUser', 'IAMRole', 'IAMGroup', 'SSOUser', 'SSOGroup', 'PermissionSet'],
      required: true,
    },
    name: { type: String, required: true },
    accountId: { type: String },
    region: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    lastSyncedAt: { type: Date, required: true },
  },
  { timestamps: true },
);
awsResourceSchema.index({ arn: 1 }, { unique: true });
awsResourceSchema.index({ resourceType: 1, accountId: 1 });

export type AwsResource = InferSchemaType<typeof awsResourceSchema>;
export type AwsResourceDoc = HydratedDocument<AwsResource>;

export const AwsResourceModel =
  (mongoose.models.AwsResource as mongoose.Model<AwsResource>) ??
  mongoose.model<AwsResource>('AwsResource', awsResourceSchema);

// ==========================================
// ResourceAction — IAM actions extracted from policies on each resource
// ==========================================
const resourceActionSchema = new mongoose.Schema(
  {
    resourceArn: { type: String, required: true, index: true },
    actionName: { type: String, required: true },
    policySource: { type: String }, // 'BucketPolicy' | 'AttachedPolicy' | 'InlinePolicy' | 'PermissionSet'
    policyArn: { type: String },
    lastSeenAt: { type: Date, required: true },
  },
  { timestamps: true },
);
resourceActionSchema.index({ resourceArn: 1, actionName: 1 }, { unique: true });

export type ResourceAction = InferSchemaType<typeof resourceActionSchema>;
export type ResourceActionDoc = HydratedDocument<ResourceAction>;

export const ResourceActionModel =
  (mongoose.models.ResourceAction as mongoose.Model<ResourceAction>) ??
  mongoose.model<ResourceAction>('ResourceAction', resourceActionSchema);

// ==========================================
// Customer — a company that has onboarded to Aura
// ==========================================
const customerSchema = new mongoose.Schema(
  {
    firstName:    { type: String, required: true },
    lastName:     { type: String, required: true },
    email:        { type: String, required: true },
    companyName:  { type: String, required: true },
    roleTitle:    { type: String, required: true },
    passwordHash: { type: String, required: true },
    awsCredentials: {
      accessKeyId:     { type: String },
      // TODO: encrypt secretAccessKey before persisting (MVP plaintext)
      secretAccessKey: { type: String },
      status:          { type: String, enum: ['connected', 'disconnected', 'error'] },
      connectedAt:     { type: Date },
    },
  },
  { timestamps: true },
);
customerSchema.index({ email: 1 }, { unique: true });

export type Customer = InferSchemaType<typeof customerSchema>;
export type CustomerDoc = HydratedDocument<Customer>;

export const CustomerModel =
  (mongoose.models.Customer as mongoose.Model<Customer>) ??
  mongoose.model<Customer>('Customer', customerSchema);

export { mongoose };
export type { RedisClientType } from 'redis';
export * from './utils.js';