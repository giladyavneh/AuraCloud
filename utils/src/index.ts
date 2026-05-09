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

export { mongoose };
export type { RedisClientType } from 'redis';
export * from './utils.js';