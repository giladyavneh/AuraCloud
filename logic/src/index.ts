import 'dotenv/config';
import { connectMongo, getRedisClient } from 'utils';
import { getUsersFromMongo } from './utils.js';
import { startUserSyncWorker } from './userSync/worker.js';

async function main() {
  const [mongo, redis] = await Promise.all([connectMongo(), getRedisClient()]);
  // Run worker, the worker's internal while-loop keeps the event loop alive.
  startUserSyncWorker(redis);

  const users = await getUsersFromMongo(mongo);
  console.log(users);
  for (const user of users) {
    // const report = await evaluateUser(user, redis);
  //   await seedMongo(mongo, report);
  }
}

main().catch((err) => {
  console.error('Logic module failed to start:', err);
  process.exit(1);
});
