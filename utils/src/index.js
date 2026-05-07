import { createClient } from 'redis';
import { RedisMemoryServer } from 'redis-memory-server';
let redisServer = new RedisMemoryServer();
let host;
let port;
export async function getRedisClient() {
    if (!host)
        host = await redisServer.getHost();
    if (!port)
        port = await redisServer.getPort();
    const client = createClient({ url: `redis://${host}:${port}` });
    await client.connect();
    console.log(`🚀 Redis Live at ${host}:${port}`);
    return client;
}
//# sourceMappingURL=index.js.map