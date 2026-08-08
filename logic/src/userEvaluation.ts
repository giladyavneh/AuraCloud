import {
  attemptDeepParse,
  getResourceTypeFromArn,
  type RedisClientType,
  type UserResourceWatchlist,
} from 'utils';
import { getResourceField } from './dataAccess.js';
import { evaluate } from './evaluator.js';
import { resolveIdentity, toEvalUser } from './identity/resolveIdentity.js';

export async function evaluateUser(user: UserResourceWatchlist, redis: RedisClientType) {
  const resourceArns = user.resources.map((resource) => resource.arn);
  const identity = await resolveIdentity(redis, user.userId, resourceArns);

  if (!identity) {
    console.warn(
      `User data not found in Redis for user ${user.userId} (checked SSO & IAM). Actions will be marked as 'stale'.`,
    );
    return;
  }

  const evalUser = toEvalUser(identity);

  const resources = user.resources.map(async (resource) => {
    const resourceType = getResourceTypeFromArn(resource.arn);
    const resourceData = await getResourceField(redis, resourceType, resource.arn);
    const parsedData = resourceData ? attemptDeepParse(resourceData) : null;
    const actionResults = resource.actions.map((action) => ({
      [action]: evaluate(parsedData ?? {}, action, evalUser),
    }));
    return { [resource.arn]: actionResults };
  });

  return { userId: user.userId, resources: await Promise.all(resources) };
}