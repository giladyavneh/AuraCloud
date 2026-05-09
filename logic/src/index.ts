import 'dotenv/config';
import { connectMongo, disconnectMongo, disconnectRedis, getRedisClient, print, printAllRedisData } from 'utils';
import { evaluateUser, getUsersFromMongo } from './utils.js';
import { startUserSyncWorker } from './userSync/worker.js';


async function main() {
  const [, redis] = await Promise.all([connectMongo(), getRedisClient()]);
  startUserSyncWorker(redis);

  const users = await getUsersFromMongo();
  for (const user of users) {
    print(await evaluateUser(user, redis as any));
  }
}

async function shutdown(code = 0) {
  try {
    await disconnectRedis();
    await disconnectMongo();
  } catch (err) {
    console.error('Error during shutdown:', err);
  } finally {
    process.exit(code);
  }
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

main()
  .then(() => shutdown(0))
  .catch((err) => {
    console.error('Logic module failed to start:', err);
    void shutdown(1);
  });
