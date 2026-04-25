import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ==========================================
// 1. set up Mongoose models
// ==========================================
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

// ==========================================
// 2. Mock Data
// ==========================================
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

// ==========================================
// 3. Function for connecting to the database and seeding data
// ==========================================
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // בדיקה אם קיים מידע, ואם לא - הזרקת ה-Mock
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
