// Node 22+/24 defaults to IPv6 DNS (link-local) which causes querySrv ECONNREFUSED
// on residential routers that don't handle DNS-over-IPv6. Force IPv4 DNS servers
// before any network call is made.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import { PORT } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import awsRoutes from "./routes/aws.routes.js";
import companiesRoutes from "./routes/companies.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import resourcesRoutes from "./routes/resources.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import userRoutes from "./routes/user.routes.js";
import watchlistPresetsRoutes from "./routes/watchlistPresets.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(companiesRoutes);
app.use(authRoutes);
app.use(watchlistRoutes);
app.use(resourcesRoutes);
app.use(userRoutes);
app.use(awsRoutes);
app.use(employeesRoutes);
app.use(teamsRoutes);
app.use(watchlistPresetsRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`;
      console.log(`API Server is running on ${publicUrl}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
