import { runResourceSyncCycle } from './sync.js';

type RedisClient = Parameters<typeof runResourceSyncCycle>[0];

export interface ResourceSyncWorkerHandle {
    stop: () => Promise<void>;
}

export function startResourceSyncWorker(redis: RedisClient): ResourceSyncWorkerHandle {
    const intervalMs = parseInt(process.env.RESOURCE_SYNC_INTERVAL_MS ?? '60000', 10);
    const enabled = (process.env.RESOURCE_SYNC_ENABLED ?? 'true').toLowerCase() === 'true';

    if (!enabled) {
        console.log('resourceSyncWorker: disabled via RESOURCE_SYNC_ENABLED=false');
        return { stop: async () => {} };
    }

    console.log(`resourceSyncWorker: starting, intervalMs=${intervalMs}`);

    let stopRequested = false;

    const loopPromise = (async () => {
        while (!stopRequested) {
            const start = Date.now();
            try {
                await runResourceSyncCycle(redis);
            } catch (err) {
                console.error('resourceSyncWorker: cycle threw', err);
            }
            if (stopRequested) break;
            const sleep = Math.max(intervalMs - (Date.now() - start), 0);
            await new Promise(r => setTimeout(r, sleep));
        }
    })();

    return {
        stop: async () => {
            stopRequested = true;
            await loopPromise;
        },
    };
}
