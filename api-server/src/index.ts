import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, UserResourceWatchlistModel } from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB();

app.get("/api/user-resource-watchlist", async (_req, res) => {
  try {
    const statuses = await UserResourceWatchlistModel.find();
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(port, () => {
  console.log(`API Server is running on http://localhost:${port}`);
});
