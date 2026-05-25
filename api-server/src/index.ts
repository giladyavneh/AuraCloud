import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  connectDB,
  UserResourceWatchlistModel,
  UserPermissionModel,
  CustomerModel,
} from "./db.js";
import { AwsResourceModel, ResourceActionModel } from "utils";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET ?? "aura-dev-secret-change-in-production";
const BCRYPT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

// ── Auth middleware ────────────────────────────────────────────────────────────

interface JwtPayload {
  customerId: string;
  email: string;
}

// Extends Express Request so downstream handlers can read req.customer
declare global {
  namespace Express {
    interface Request {
      customer?: JwtPayload;
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const token = header.slice(7);
    req.customer = jwt.verify(token, JWT_SECRET) as JwtPayload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ── Auth routes ────────────────────────────────────────────────────────────────

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, roleTitle, password } = req.body ?? {};

    if (!firstName || !lastName || !email || !companyName || !roleTitle || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const existing = await CustomerModel.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const customer = await CustomerModel.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      companyName: companyName.trim(),
      roleTitle: roleTitle.trim(),
      passwordHash,
    });

    // Create an empty watchlist for the new customer
    await UserResourceWatchlistModel.create({
      userId: customer._id.toString(),
      name: `${firstName.trim()}'s Watchlist`,
      resources: [],
    });

    const token = signToken({ customerId: customer._id.toString(), email: customer.email });
    res.status(201).json({
      token,
      customer: {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        companyName: customer.companyName,
        roleTitle: customer.roleTitle,
        hasAwsConnected: false,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/signup failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const customer = await CustomerModel.findOne({ email: email.toLowerCase().trim() });
    if (!customer) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken({ customerId: customer._id.toString(), email: customer.email });
    res.json({
      token,
      customer: {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        companyName: customer.companyName,
        roleTitle: customer.roleTitle,
        hasAwsConnected: customer.awsCredentials?.status === "connected",
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    res.json({
      _id: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      companyName: customer.companyName,
      roleTitle: customer.roleTitle,
      hasAwsConnected: customer.awsCredentials?.status === "connected",
    });
  } catch (err) {
    console.error("GET /api/auth/me failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Existing routes ────────────────────────────────────────────────────────────

app.get("/api/user-resource-watchlist", requireAuth, async (req, res) => {
  try {
    const watchlists = await UserResourceWatchlistModel
      .find({ userId: req.customer!.customerId })
      .lean()
      .exec();
    res.json(watchlists);
  } catch (err) {
    console.error("GET /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/resources", requireAuth, async (_req, res) => {
  try {
    const resources = await AwsResourceModel.find().lean().exec();
    res.json(resources);
  } catch (err) {
    console.error("GET /api/resources failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/resources/:arn/actions", requireAuth, async (req, res) => {
  try {
    // ARN is URL-encoded since it contains colons and slashes
    const arn = decodeURIComponent(req.params.arn);
    const actions = await ResourceActionModel.find({ resourceArn: arn }).lean().exec();
    res.json(actions);
  } catch (err) {
    console.error("GET /api/resources/:arn/actions failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/user-resource-watchlist/:id", requireAuth, async (req, res) => {
  try {
    // Ensure the watchlist belongs to the requesting customer
    const doc = await UserResourceWatchlistModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.customer!.customerId },
      { resources: req.body.resources },
      { returnDocument: "after" },
    );
    if (!doc) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }
    res.json(doc);
  } catch (err) {
    console.error("PUT /api/user-resource-watchlist/:id failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/user-permissions/:userId", async (req, res) => {
  try {
    const permission = await UserPermissionModel.findOne({ userId: req.params.userId });
    if (!permission) {
      res.status(404).json({ message: "User permissions not found" });
      return;
    }
    res.json(permission);
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/aws/onboard-credentials", requireAuth, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey } = req.body ?? {};

    if (
      typeof accessKeyId !== "string" || !accessKeyId.trim() ||
      typeof secretAccessKey !== "string" || !secretAccessKey.trim()
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const updated = await CustomerModel.findByIdAndUpdate(
      req.customer!.customerId,
      {
        $set: {
          // TODO: encrypt secretAccessKey before saving (use KMS/libsodium/etc).
          awsCredentials: {
            accessKeyId: accessKeyId.trim(),
            secretAccessKey: secretAccessKey.trim(),
            status: "connected",
            connectedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.json({
      _id: updated._id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      companyName: updated.companyName,
      roleTitle: updated.roleTitle,
      hasAwsConnected: updated.awsCredentials?.status === "connected",
    });
  } catch (err) {
    console.error("POST /api/aws/onboard-credentials failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

connectDB()
  .then(() => {
    app.listen(port, () => {
      const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}`;
      console.log(`API Server is running on ${publicUrl}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
