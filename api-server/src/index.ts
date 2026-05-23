import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  connectDB,
  UserResourceWatchlistModel,
  UserPermissionModel,
} from "./db.js";
import { AwsResourceModel, ResourceActionModel } from "utils";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/user-resource-watchlist", async (_req, res) => {
  try {
    const statuses = await UserResourceWatchlistModel.find().lean().exec();
    res.json(statuses);
  } catch (err) {
    console.error("GET /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/resources", async (_req, res) => {
  try {
    const resources = await AwsResourceModel.find().lean().exec();
    res.json(resources);
  } catch (err) {
    console.error("GET /api/resources failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/resources/:arn/actions", async (req, res) => {
  try {
    // ARN is URL-encoded since it contains colons and slashes
    const arn = decodeURIComponent(req.params.arn);
    const actions = await ResourceActionModel.find({ resourceArn: arn })
      .lean()
      .exec();
    res.json(actions);
  } catch (err) {
    console.error("GET /api/resources/:arn/actions failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/user-permissions/:userId", async (req, res) => {
  try {
    const permission = await UserPermissionModel.findOne({
      userId: req.params.userId,
    });
    if (!permission) {
      res.status(404).json({ message: "User permissions not found" });
      return;
    }
    res.json(permission);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}`;
      console.log(`API Server is running on ${publicUrl}`);
    });
  })
  .catch((err: any) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
