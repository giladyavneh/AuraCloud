import { runSyncCycle } from './sync.js';

type RedisClient = Parameters<typeof runSyncCycle>[0];

export interface UserSyncWorkerHandle {
    stop: () => Promise<void>;
}

// Starts a background worker that runs the user sync cycle at regular intervals defined by environment variables.
export function startUserSyncWorker(redis: RedisClient): UserSyncWorkerHandle {
    const intervalMs = parseInt(process.env.USER_SYNC_INTERVAL_MS ?? '10000', 10);
    const enabled = (process.env.USER_SYNC_ENABLED ?? 'true').toLowerCase() === 'true';

    // When disabled via env var, the worker will never start, sync cycles will be skipped
    // In cases we do not really want to read from redis and write to mongo
    if (!enabled) {
        console.log('userSyncWorker: disabled via USER_SYNC_ENABLED=false');
        return { stop: async () => {} };
    }

    console.log(`userSyncWorker: starting, intervalMs=${intervalMs}`);

    let stopRequested = false;

    // IIFE: starts the loop immediately when js created in the background; runs until stop is called, if stop called,
    // current cycle will be finished and the next one won't start
    const loopPromise = (async () => {
        while (!stopRequested) {
            const start = Date.now();
            try {
                await runSyncCycle(redis);
            } catch (err) {
                console.error('userSyncWorker: cycle threw', err);
            }
            if (stopRequested) break;
            // Each cycle runs at least every intervalMs, but if runSyncCycle takes a long time, the next cycle starts immediately after
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