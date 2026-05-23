import { getRedisClient } from 'utils';
type RedisClient = Awaited<ReturnType<typeof getRedisClient>>;

const IAM_USERS_KEY = 'aura:iam:users';
const SSO_USERS_KEY = 'aura:sso:users';

export async function getUsersFromRedis(redis: RedisClient) {
    const [iam, sso] = await Promise.all([
        redis.hVals(IAM_USERS_KEY),
        redis.hVals(SSO_USERS_KEY)
    ]);
    return {iam, sso};
}