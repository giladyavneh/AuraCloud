import {
  connectMongo,
  disconnectMongo,
  UserResourceWatchlistModel,
  UserPermissionModel,
  type UserResourceWatchlist,
  type UserPermission,
} from 'utils';

export {
  connectMongo,
  disconnectMongo,
  UserResourceWatchlistModel,
  UserPermissionModel,
  type UserResourceWatchlist,
  type UserPermission,
};

const mockUserResourceWatchlist = {
  name: 'amit',
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

async function seedMockDataIfEmpty(): Promise<void> {
  const watchlistCount = await UserResourceWatchlistModel.estimatedDocumentCount();
  if (watchlistCount > 0) {
    console.log('Data already exists, skipping seeding.');
    return;
  }
  await Promise.all([
    UserResourceWatchlistModel.create(mockUserResourceWatchlist),
    UserPermissionModel.create(mockUserPermission),
  ]);
  console.log('Mock Data Seeded Successfully!');
}

export async function connectDB(): Promise<void> {
  await connectMongo();
  await seedMockDataIfEmpty();
}
