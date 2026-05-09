import 'dotenv/config';
import { connectMongo, getRedisClient } from 'utils';

async function main() {
  const [, redis] = await Promise.all([connectMongo(), getRedisClient()]);
  console.log('🧠 AuraCloud Logic Module ready');

  process.on('SIGINT', async () => {
    console.log('Shutting down logic module...');
    try {
      await redis.quit();
    } catch {}
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Logic module failed to start:', err);
  process.exit(1);
});
