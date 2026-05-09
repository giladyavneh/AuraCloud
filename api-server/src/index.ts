import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectMongo, UserResourceWatchlistModel } from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/user-resource-watchlist', async (_req, res) => {
  try {
    const statuses = await UserResourceWatchlistModel.find().lean().exec();
    res.json(statuses);
  } catch (err) {
    console.error('GET /api/user-resource-watchlist failed:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

async function start() {
  await connectDB();
  const server = app.listen(port, () => {
    console.log(`API Server is running on http://localhost:${port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      try {
        await disconnectMongo();
      } catch (err) {
        console.error('Error closing Mongo:', err);
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('API Server failed to start:', err);
  process.exit(1);
});
