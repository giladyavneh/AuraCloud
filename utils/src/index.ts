import { createClient } from 'redis';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';

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

export { mongoose };