import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, UserResourceWatchlistModel } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// connect to the database and seed data
connectDB();

// example route to fetch resource statuses for the frontend
app.get("/api/user-resource-watchlist", async (req, res) => {
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
