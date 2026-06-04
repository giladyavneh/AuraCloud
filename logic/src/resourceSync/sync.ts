import { AwsResourceModel, getRedisClient } from 'utils';

type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

function getResourceTypeFromArn(arn: string): string {
    const parts = arn.split(':');
    if (parts[2] === 's3') return 'S3Bucket';
    return 'S3Bucket';
}

function getNormalizedResourceType(rawType: string, arn: string): string {
    if (!rawType) {
        return getResourceTypeFromArn(arn);
    }
    const lower = rawType.toLowerCase();
    if (lower === 's3bucket' || lower === 's3buckets') return 'S3Bucket';
    return getResourceTypeFromArn(arn);
}

export async function runResourceSyncCycle(redis: RedisClient): Promise<void> {
    const cycleStart = Date.now();
    const cycleStartDate = new Date();

    try {
        const rawResources = await redis.hGetAll("aura:resource");
        const resourceRecords = [];

        for (const [arn, value] of Object.entries(rawResources)) {
            try {
                const parsed = JSON.parse(value);
                const resourceType = getNormalizedResourceType(parsed.resourceType || parsed.ResourceType, arn);
                resourceRecords.push({
                    arn,
                    resourceType: resourceType as any,
                    name: parsed.name || parsed.Name || arn.split(':').pop() || '',
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
            console.warn('runResourceSyncCycle: no resource records read from Redis key "aura:resource", skipping delete');
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
