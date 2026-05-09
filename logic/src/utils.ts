import mongoose from 'mongoose';
import { UserResourceWatchlistModel } from 'utils'

export function getUsersFromMongo(mongo: typeof import('mongoose')) {
  return UserResourceWatchlistModel.find().lean();
}

// export async function evaluateUser(user: any, redis: any) {
//     getUserFromRedis
// }

// async function getUserFromRedis(redis: any, userId: string) {