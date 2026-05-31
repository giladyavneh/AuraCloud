import dotenv from 'dotenv';
import { connectMongo, UserResourceWatchlistModel, UserPermissionModel, CustomerModel } from 'utils';

dotenv.config();

// Re-export models so other modules can import from this file
export { UserResourceWatchlistModel, UserPermissionModel, CustomerModel };

export const connectDB = async (): Promise<void> => {
  await connectMongo();
};
