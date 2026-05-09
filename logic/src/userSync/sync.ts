import { UserModel } from 'utils';
import { getUsersFromRedis } from "./redisRead.js";
import { iamEntryToUser, ssoEntryToUser, type UserSyncRecord } from './transform.js';

// Extract the RedisClient type from the getUsersFromRedis function signature
type RedisClient = Parameters<typeof getUsersFromRedis>[0];

export async function runSyncCycle(redis: RedisClient): Promise<void> {
    const cycleStart = Date.now();
    const cycleStartDate = new Date();

    // Fetch raw user entries from Redis (IAM and SSO sources)
    const {iam, sso} = await getUsersFromRedis(redis);

    // Transform raw entries into UserSyncRecord objects, filtering out nulls
    const records: UserSyncRecord[] = [
        ...iam.flatMap(json => iamEntryToUser(json) ?? []),
        ...sso.flatMap(json => ssoEntryToUser(json) ?? []),
    ];

    let upsertedCount = 0;

    if (records.length === 0) {
        console.warn('runSyncCycle: no records read from Redis, skipping delete');
        console.log(`runSyncCycle: upserted=${upsertedCount} deleted=0 duration=${Date.now() - cycleStart}ms`);
        return;
    }

        try {
            // Build bulk operations: upsert records by source + externalId, updating lastSeenAt
            const ops = records.map(record => ({
                updateOne: {
                    filter: {source: record.source, externalId: record.externalId},
                    update: {$set: {...record, lastSeenAt: cycleStartDate}},
                    upsert: true,
                },
            }));
            // Execute batched upserts and count affected documents, data that mongo gives back
            const result = await UserModel.bulkWrite(ops);
            upsertedCount = result.upsertedCount + result.modifiedCount;
        } catch (err) {
            console.error('runSyncCycle: bulkWrite failed', err);
            return;  // skip delete to avoid partial-then-wipe
        }

    // if user has lastSeenAt older than the start of this cycle,
    // it means it was not present in the current Redis data and should be deleted
    const deleteResult = await UserModel.deleteMany({ lastSeenAt: { $lt: cycleStartDate } });
    const deletedCount = deleteResult.deletedCount;

    // Log sync cycle statistics (upserted/deleted count and duration)
    console.log(
        `runSyncCycle: upserted=${upsertedCount} deleted=${deletedCount} duration=${Date.now() - cycleStart}ms`
    );
}
