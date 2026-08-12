import {
  buildEvaluationSubject,
  evaluateResourceActions,
  type RedisClientType,
  type UserResourceWatchlist,
} from 'utils';

export async function evaluateUser(user: UserResourceWatchlist, redis: RedisClientType) {
  const accountFromResourceArn = user.resources.map((r) => r.arn.split(':')[4]).find(Boolean) ?? '';
  const evalUser = await buildEvaluationSubject(redis, user.userId, accountFromResourceArn);
  if (!evalUser) {
    console.warn(`User data not found in Redis for user ${user.userId}. Actions will be marked as 'stale'.`);
    return;
  }

  const resources = user.resources.map(async (resource) => {
    const results = await evaluateResourceActions(redis, resource.arn, resource.actions, evalUser);
    const actionResults = resource.actions.map((action) => ({ [action]: results[action] }));
    return { [resource.arn]: actionResults };
  });
  return { userId: user.userId, resources: await Promise.all(resources) };
}
