import type { getRedisClient } from "utils";

export type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

export async function readJsonHash<T = any>(redis: RedisClient, hashKey: string, field: string): Promise<T | null> {
    const raw = await redis.hGet(hashKey, field);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export async function readJsonHashAll<T = any>(redis: RedisClient, hashKey: string): Promise<Record<string, T>> {
    const raw = await redis.hGetAll(hashKey);
    const out: Record<string, T> = {};
    for (const [k, v] of Object.entries(raw)) {
        try {
            out[k] = JSON.parse(v as string) as T;
        } catch {
            // skip malformed entries
        }
    }
    return out;
}
