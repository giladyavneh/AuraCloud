import dotenv from 'dotenv';
import {
  AwsResourceModel,
  connectMongo,
  UserResourceWatchlistModel,
  UserPermissionModel,
  CustomerModel,
  CompanyModel,
  TeamModel,
  WatchlistPresetModel,
  OAuthClientModel,
  OAuthGrantModel,
  OAuthAuthCodeModel,
} from 'utils';

dotenv.config();

// Re-export models so other modules can import from this file
export {
  AwsResourceModel,
  UserResourceWatchlistModel,
  UserPermissionModel,
  CustomerModel,
  CompanyModel,
  TeamModel,
  WatchlistPresetModel,
  OAuthClientModel,
  OAuthGrantModel,
  OAuthAuthCodeModel,
};

export const connectDB = async (): Promise<void> => {
  await connectMongo();
};
