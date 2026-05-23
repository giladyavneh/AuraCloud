import dotenv from 'dotenv';
import { connectMongo, UserResourceWatchlistModel, UserPermissionModel, CustomerModel } from 'utils';

dotenv.config();

// Re-export models so other modules can import from this file
export { UserResourceWatchlistModel, UserPermissionModel, CustomerModel };

// ==========================================
// Mock seed data
// ==========================================
const mockUserResourceWatchlist = {
  name: 'shoham',
  userId: '123',
  resources: [
    { arn: 'arn:aws:s3:::mybucket', actions: ['s3:GetObject', 's3:PutObject'] },
    { arn: 'arn:aws:s3:::mybuckety', actions: ['s3:GetObject'] },
    { arn: 'arn:aws:s3:::mybucketu', actions: ['s3:GetObject'] },
    { arn: 'arn:aws:s3:::mybucketttt', actions: ['s3:GetObject'] },
  ],
};

const mockUserPermission = {
  name: 'shoham',
  permissionsData: {
    'arn:aws:s3:::mybucket': {
      getObject: { status: 'valid', reason: null, timestamp: '2024-06-01T12:00:00Z' },
      putObject: { status: 'error', reason: 'policy mismatch', timestamp: '2024-06-01T12:00:00Z' },
    },
    'arn:aws:s3:::mybuckety': {
      status: 'stale',
      reason: 'policy mismatch',
      timestamp: '2024-06-01T12:00:00Z',
    },
    'arn:aws:s3:::mybucketu': {
      status: 'warning',
      reason: 'connect to vpn',
      timestamp: '2024-06-01T12:00:00Z',
    },
  },
};

// ==========================================
// Connect to MongoDB and seed if empty
// ==========================================
export const connectDB = async (): Promise<void> => {
  await connectMongo();

  const count = await UserResourceWatchlistModel.countDocuments();
  if (count === 0) {
    await UserResourceWatchlistModel.create(mockUserResourceWatchlist);
    await UserPermissionModel.create(mockUserPermission);
    console.log('Mock Data Seeded Successfully!');
  } else {
    console.log('Data already exists, skipping seeding.');
  }
};
