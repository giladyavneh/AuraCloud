import dotenv from 'dotenv';
import {
  connectMongo,
  UserResourceWatchlistModel,
  UserPermissionModel,
  CustomerModel,
  CompanyModel,
  TeamModel,
  WatchlistPresetModel,
} from 'utils';

dotenv.config();

// Re-export models so other modules can import from this file
export { UserResourceWatchlistModel, UserPermissionModel, CustomerModel, CompanyModel, TeamModel, WatchlistPresetModel };

export const connectDB = async (): Promise<void> => {
  await connectMongo();
};
