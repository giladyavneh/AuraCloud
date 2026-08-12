import { AwsResourceModel, getNormalizedResourceType, getRedisClient, print } from 'utils';

type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

export async function runResourceSyncCycle(redis: RedisClient): Promise<void> {
    const cycleStart = Date.now();
    const cycleStartDate = new Date();

    try {
        const keys = await redis.keys("aura:resource:*");
        const rawResources: Record<string, string> = {};
        for (const key of keys) {
            const hash = await redis.hGetAll(key);
            Object.assign(rawResources, hash);
        }
        const resourceRecords = [];

        for (const [arn, value] of Object.entries(rawResources)) {
            try {
                const parsed = JSON.parse(value);
                const resourceType = getNormalizedResourceType(parsed.resourceType || parsed.ResourceType, arn);
                const instanceNameTag = Array.isArray(parsed.Tags) ? parsed.Tags.find((t: any) => t.Key === 'Name')?.Value : undefined;
                resourceRecords.push({
                    arn,
                    resourceType: resourceType as any,
                    name: parsed.name || parsed.Name || instanceNameTag || parsed.InstanceId || arn.split(':').pop() || '',
                    accountId: parsed.accountId || parsed.AccountId || arn.split(':')[4] || '',
                    region: parsed.region || parsed.Region || arn.split(':')[3] || '',
                    metadata: parsed,
                    lastSyncedAt: cycleStartDate
                });
            } catch (err) {
                console.error(`Failed to parse resource JSON for ARN ${arn}:`, err);
            }
        }

        let upsertedCount = 0;
        let deletedCount = 0;

        if (resourceRecords.length === 0) {
            console.warn('runResourceSyncCycle: no resource records read from Redis pattern "aura:resource:*", skipping delete');
        } else {
            const resourceOps = resourceRecords.map(record => ({
                updateOne: {
                    filter: { arn: record.arn },
                    update: { $set: record },
                    upsert: true,
                }
            }));
            const resResult = await AwsResourceModel.bulkWrite(resourceOps);
            upsertedCount = resResult.upsertedCount + resResult.modifiedCount;

            const deleteResResult = await AwsResourceModel.deleteMany({ lastSyncedAt: { $lt: cycleStartDate } });
            deletedCount = deleteResResult.deletedCount ?? 0;
        }

        console.log(
            `runResourceSyncCycle: upserted=${upsertedCount} deleted=${deletedCount} duration=${Date.now() - cycleStart}ms`
        );
    } catch (err) {
        console.error('runResourceSyncCycle: sync cycle failed', err);
    }
}
