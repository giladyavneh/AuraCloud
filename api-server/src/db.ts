import mongoose from "mongoose";
import { connectMongo } from "utils";

const userResourceWatchlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  resources: [
    {
      arn: { type: String, required: true },
      actions: [{ type: String }],
    },
  ],
});

export const UserResourceWatchlistModel = mongoose.model(
  "UserResourceWatchlist",
  userResourceWatchlistSchema,
);

const userPermissionsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissionsData: { type: mongoose.Schema.Types.Mixed },
});

export const UserPermissionModel = mongoose.model(
  "UserPermission",
  userPermissionsSchema,
);

const mockUserResourceWatchlist = {
  name: "amit",
  userId: "123",
  resources: [
    { arn: "arn:aws:s3:::mybucket", actions: ["s3:GetObject", "s3:PutObject"] },
    { arn: "arn:aws:s3:::mybuckety", actions: ["s3:GetObject"] },
    { arn: "arn:aws:s3:::mybucketu", actions: ["s3:GetObject"] },
    { arn: "arn:aws:s3:::mybucketttt", actions: ["s3:GetObject"] },
  ],
};

const mockUserPermission = {
  name: "shoham",
  permissionsData: {
    "arn:aws:s3:::mybucket": {
      getObject: {
        status: "valid",
        reason: null,
        timestamp: "2024-06-01T12:00:00Z",
      },
      putObject: {
        status: "error",
        reason: "policy mismatch",
        timestamp: "2024-06-01T12:00:00Z",
      },
    },
    "arn:aws:s3:::mybuckety": {
      status: "stale",
      reason: "policy mismatch",
      timestamp: "2024-06-01T12:00:00Z",
    },
    "arn:aws:s3:::mybucketu": {
      status: "warning",
      reason: "connect to vpn",
      timestamp: "2024-06-01T12:00:00Z",
    },
  },
};

export const connectDB = async () => {
  try {
    await connectMongo();

    const statusesCount = await UserResourceWatchlistModel.countDocuments();
    if (statusesCount === 0) {
      await UserResourceWatchlistModel.create(mockUserResourceWatchlist);
      await UserPermissionModel.create(mockUserPermission);
      console.log("Mock Data Seeded Successfully!");
    } else {
      console.log("Data already exists, skipping seeding.");
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};
