import {
  buildEvaluationSubject,
  evaluateResourceActions,
  type RedisClientType,
  type UserResourceWatchlist,
} from 'utils';

export async function evaluateUser(user: UserResourceWatchlist, redis: RedisClientType) {
  const resourceArns = user.resources.map((resource) => resource.arn);
  const evalUser = await buildEvaluationSubject(redis, user.userId, resourceArns);

  if (!evalUser) {
    console.warn(
      `User data not found in Redis for user ${user.userId} (checked SSO & IAM). Actions will be marked as 'stale'.`,
    );
    return;
  }

  const resources = user.resources.map(async (resource) => {
    const results = await evaluateResourceActions(redis, resource.arn, resource.actions, evalUser);
    const actionResults = resource.actions.map((action) => ({ [action]: results[action] }));
    return { [resource.arn]: actionResults };
  });

  return { userId: user.userId, resources: await Promise.all(resources) };
}
