import { createClient } from 'redis';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import dotenv from "dotenv";

dotenv.config();


let redisServer = new RedisMemoryServer();
let host: string;
let port: number;

export async function getRedisClient() {
    if (!host) host = await redisServer.getHost();
    if (!port) port = await redisServer.getPort();
    const client = createClient({ url: `redis://${host}:${port}` });
    await client.connect();
    console.log(`🚀 Redis Live at ${host}:${port}`);
    return client;
}

export async function connectMongo() {
    if (mongoose.connection.readyState === 1) return mongoose;
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not set');
    await mongoose.connect(uri);
    console.log(`🚀 Mongo Live at ${mongoose.connection.host}`);
    return mongoose;
}

const userResourceWatchlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  resources: [
    {
      arn: { type: String, required: true },
      actions: [{ type: String }],
    },
  ],
});

export const UserResourceWatchlistModel = mongoose.model(
  "UserResourceWatchlist",
  userResourceWatchlistSchema,
);

const userSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    source:     { type: String, enum: ['IAM', 'SSO'], required: true },
    externalId: { type: String, required: true },  // IAM UserId (AIDA…) or SSO UserId (UUID)
    arn:        { type: String, default: null },   // null for SSO
    lastSeenAt: { type: Date,   required: true },
});
userSchema.index({ source: 1, externalId: 1 }, { unique: true });

export const UserModel = mongoose.model('User', userSchema);

export { mongoose };