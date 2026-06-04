import dotenv from 'dotenv';
import { connectMongo, UserResourceWatchlistModel, UserPermissionModel, CustomerModel, CompanyModel } from 'utils';

dotenv.config();

// Re-export models so other modules can import from this file
export { UserResourceWatchlistModel, UserPermissionModel, CustomerModel, CompanyModel };

export const connectDB = async (): Promise<void> => {
  await connectMongo();
};
