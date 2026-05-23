import 'dotenv/config';
import { connectMongo, disconnectMongo, disconnectRedis, getRedisClient, print, UserPermissionModel } from 'utils';
import { getUsersFromMongo } from './dataAccess.js';
import { evaluateUser } from './userEvaluation.js';
import { startUserSyncWorker } from './userSync/worker.js';


async function main() {
  const [, redis] = await Promise.all([connectMongo(), getRedisClient()]);
  startUserSyncWorker(redis);

  const users = await getUsersFromMongo();
  for (const user of users) {
    const findings = await evaluateUser(user, redis as any);

    const permissionsData: Record<string, any> = {};
    const timestamp = new Date().toISOString();

    for (const resEntry of findings.resources) {
      const arn = Object.keys(resEntry)[0];
      if (!arn) continue;
      const actionResults = resEntry[arn];
      if (!actionResults) continue;

      permissionsData[arn] = {};
      for (const actionObj of actionResults) {
        const actionName = Object.keys(actionObj)[0];
        if (!actionName) continue;
        const result = actionObj[actionName];

        let actionStatus;
        if (result === 'stale') {
          actionStatus = {
            status: 'stale',
            reason: 'identity data missing from AWS cache',
            timestamp,
          };
        } else {
          const isAllowed = result === true;
          actionStatus = {
            status: isAllowed ? 'valid' : 'error',
            reason: isAllowed ? null : 'policy mismatch',
            timestamp,
          };
        }

        permissionsData[arn][actionName] = actionStatus;

        // Strip the service prefix and camelCase (e.g. s3:GetObject -> getObject) for frontend compatibility
        const camelCaseAction = actionName.split(':').pop()!;
        const camelCaseName = camelCaseAction.charAt(0).toLowerCase() + camelCaseAction.slice(1);
        if (camelCaseName !== actionName) {
          permissionsData[arn][camelCaseName] = actionStatus;
        }
      }
    }

    await UserPermissionModel.findOneAndUpdate(
      { userId: user.userId },
      {
        $set: {
          name: user.name,
          userId: user.userId,
          permissionsData,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Saved evaluation results for user: ${user.name} (${user.userId})`);
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
