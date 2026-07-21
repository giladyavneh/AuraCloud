import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { connectMongo, disconnectMongo, ResourceActionModel } from 'utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const possibleActionsPath = join(__dirname, '../possibleActions.json');
const possibleActions = JSON.parse(readFileSync(possibleActionsPath, 'utf-8'));

async function main() {
  await connectMongo();
  console.log('Connected to MongoDB. Starting database population...');

  let count = 0;
  for (const [resourceType, actions] of Object.entries(possibleActions)) {
    if (!Array.isArray(actions)) continue;
    console.log(`Processing resource type: ${resourceType} (${actions.length} actions)`);
    for (const actionName of actions) {
      await ResourceActionModel.findOneAndUpdate(
        { resourceType, actionName },
        { resourceType, actionName, lastSeenAt: new Date() },
        { upsert: true, returnDocument: 'after' }
      );
      count++;
    }
  }

  console.log(`Successfully populated database with ${count} actions.`);
}

main()
  .then(() => disconnectMongo())
  .catch(async (err) => {
    console.error('Population script failed:', err);
    await disconnectMongo();
    process.exit(1);
  });
