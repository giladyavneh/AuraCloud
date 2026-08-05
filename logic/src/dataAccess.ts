import { UserResourceWatchlistModel, type UserResourceWatchlist } from 'utils';

export function getUsersFromMongo(): Promise<UserResourceWatchlist[]> {
  return UserResourceWatchlistModel.find().lean<UserResourceWatchlist[]>().exec();
}
