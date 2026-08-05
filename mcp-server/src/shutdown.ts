import { disconnectMongo } from "utils";

/**
 * Idempotent process shutdown shared by both entry points: run the
 * transport-specific pre-close step, disconnect Mongo, exit. The unref'd
 * force-exit timer guarantees termination even when a wedged connection makes
 * cleanup hang (otherwise a stuck disconnect would eat every later Ctrl+C).
 */
export const createShutdown = (preClose?: () => void): (() => void) => {
  let shuttingDown = false;
  return () => {
    if (shuttingDown) return;
    shuttingDown = true;
    setTimeout(() => process.exit(0), 5000).unref();
    preClose?.();
    void disconnectMongo().finally(() => process.exit(0));
  };
};
