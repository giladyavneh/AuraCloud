// Node 22+/24 defaults to IPv6 DNS (link-local) which causes querySrv ECONNREFUSED
// on residential routers that don't handle DNS-over-IPv6. Force IPv4 DNS servers
// before any network call is made.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  connectDB,
  UserResourceWatchlistModel,
  UserPermissionModel,
  CustomerModel,
  CompanyModel,
} from "./db.js";
import {
  AwsResourceModel,
  ResourceActionModel,
  UserModel,
  encryptSecret,
} from "utils";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ?? "aura-dev-secret-change-in-production";
const BCRYPT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generates a random 6-digit numeric invite code. */
function generateInviteCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/** Converts a company name to a URL-safe slug suggestion. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

/**
 * Builds the safe customer object sent to the frontend.
 * Looks up the company to derive companySlug and hasAwsConnected.
 * hasAwsConnected = linkedAwsUserId is set (applies to both managers and employees).
 */
async function toCustomerResponse(customer: {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: string;
  companyId: string;
  linkedAwsUserId?: string | null;
}) {
  const company = await CompanyModel.findById(customer.companyId).lean();
  return {
    _id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    roleTitle: customer.roleTitle,
    role: customer.role,
    companyId: customer.companyId,
    companyName: company?.name ?? "",
    companySlug: company?.slug ?? "",
    hasAwsConnected: Boolean(customer.linkedAwsUserId),
    // Managers also see the company AWS key ID (non-secret)
    ...(customer.role === "manager" && company?.awsCredentials?.accessKeyId
      ? { companyAwsAccessKeyId: company.awsCredentials.accessKeyId }
      : {}),
  };
}

// ── Company routes (public) ────────────────────────────────────────────────────

app.get("/api/companies/:slug", async (req, res) => {
  try {
    const company = await CompanyModel.findOne(
      { slug: req.params.slug },
      { name: 1, slug: 1 },
    ).lean();
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }
    res.json({ _id: company._id, name: company.name, slug: company.slug });
  } catch (err) {
    console.error("GET /api/companies/:slug failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/companies/:slug/aws-users", async (req, res) => {
  try {
    const company = await CompanyModel.findOne({
      slug: req.params.slug,
    }).lean();
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }
    // Return discovered AWS (IAM + SSO) users — no credentials exposed
    const users = await UserModel.find(
      {},
      { name: 1, source: 1, externalId: 1, arn: 1 },
    ).lean();
    res.json(users);
  } catch (err) {
    console.error("GET /api/companies/:slug/aws-users failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Auth routes ────────────────────────────────────────────────────────────────

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { role, firstName, lastName, email, roleTitle, password } =
      req.body ?? {};

    if (!role || !firstName || !lastName || !email || !roleTitle || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (role !== "manager" && role !== "employee") {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const existing = await CustomerModel.findOne({
      email: (email as string).toLowerCase().trim(),
    }).lean();
    if (existing) {
      res
        .status(409)
        .json({ message: "An account with this email already exists" });
      return;
    }

    let companyId: string;

    if (role === "manager") {
      // Manager creates a new company
      const { companyName, companySlug } = req.body ?? {};
      if (!companyName || !companySlug) {
        res.status(400).json({
          message: "companyName and companySlug are required for managers",
        });
        return;
      }
      const slug = toSlug(companySlug as string);
      const slugConflict = await CompanyModel.findOne({ slug }).lean();
      if (slugConflict) {
        res.status(409).json({ message: "This company URL is already taken" });
        return;
      }
      const company = await CompanyModel.create({
        name: (companyName as string).trim(),
        slug,
        inviteCode: generateInviteCode(),
      });
      companyId = company._id.toString();
    } else {
      // Employee joins an existing company by slug + invite code
      const { companySlug, inviteCode } = req.body ?? {};
      if (!companySlug || !inviteCode) {
        res.status(400).json({
          message: "companySlug and inviteCode are required for employees",
        });
        return;
      }
      const company = await CompanyModel.findOne({ slug: companySlug }).lean();
      if (!company) {
        res.status(404).json({ message: "Company not found" });
        return;
      }
      if (company.inviteCode !== String(inviteCode).trim()) {
        res.status(400).json({ message: "Invalid invite code" });
        return;
      }
      companyId = company._id.toString();
    }

    const passwordHash = await bcrypt.hash(password as string, BCRYPT_ROUNDS);
    const customer = await CustomerModel.create({
      firstName: (firstName as string).trim(),
      lastName: (lastName as string).trim(),
      email: (email as string).toLowerCase().trim(),
      roleTitle: (roleTitle as string).trim(),
      passwordHash,
      role,
      companyId,
      linkedAwsUserId: null,
    });

    const token = signToken({
      customerId: customer._id.toString(),
      email: customer.email,
    });
    res
      .status(201)
      .json({ token, customer: await toCustomerResponse(customer) });
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

    const customer = await CustomerModel.findOne({
      email: (email as string).toLowerCase().trim(),
    });
    if (!customer) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(
      password as string,
      customer.passwordHash,
    );
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken({
      customerId: customer._id.toString(),
      email: customer.email,
    });
    res.json({ token, customer: await toCustomerResponse(customer) });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    res.json(await toCustomerResponse(customer));
  } catch (err) {
    console.error("GET /api/auth/me failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Watchlist routes ───────────────────────────────────────────────────────────

app.get("/api/user-resource-watchlist", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer?.linkedAwsUserId) {
      // No AWS identity linked yet — nothing to watch
      res.json([]);
      return;
    }
    const watchlists = await UserResourceWatchlistModel.find({
      userId: customer.linkedAwsUserId,
    })
      .lean()
      .exec();
    res.json(watchlists);
  } catch (err) {
    console.error("GET /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/user-resource-watchlist", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer?.linkedAwsUserId) {
      res
        .status(409)
        .json({ message: "Link an AWS user before creating a watchlist" });
      return;
    }
    const existing = await UserResourceWatchlistModel.findOne({
      userId: customer.linkedAwsUserId,
    });
    if (existing) {
      // Watchlist already exists — return it without creating a duplicate
      res
        .status(409)
        .json({ message: "Watchlist already exists", watchlist: existing });
      return;
    }
    const doc = await UserResourceWatchlistModel.create({
      userId: customer.linkedAwsUserId,
      name: `${customer.firstName} ${customer.lastName}'s Watchlist`,
      resources: req.body.resources ?? [],
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error("POST /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/user-resource-watchlist/:id", requireAuth, async (req, res) => {
  try {
    // Ensure the watchlist belongs to the requesting customer's linked AWS identity
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer?.linkedAwsUserId) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }
    const doc = await UserResourceWatchlistModel.findOneAndUpdate(
      { _id: req.params.id, userId: customer.linkedAwsUserId },
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

// ── Resource routes ────────────────────────────────────────────────────────────

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
    const rawArn = req.params.arn;
    const arn = decodeURIComponent(Array.isArray(rawArn) ? rawArn[0] : rawArn);
    const actions = await ResourceActionModel.find({ resourceArn: arn })
      .lean()
      .exec();
    res.json(actions);
  } catch (err) {
    console.error("GET /api/resources/:arn/actions failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Permission routes ──────────────────────────────────────────────────────────

app.get("/api/user-permissions", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer?.linkedAwsUserId) {
      res.status(404).json({ message: "No AWS user linked yet" });
      return;
    }
    const permission = await UserPermissionModel.findOne({
      userId: customer.linkedAwsUserId,
    });
    if (!permission) {
      res.status(404).json({ message: "No permissions data yet" });
      return;
    }
    res.json(permission);
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

// ── User profile routes ────────────────────────────────────────────────────────

app.put("/api/user/profile", requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, roleTitle } = req.body ?? {};

    if (!firstName || !lastName || !roleTitle) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const updated = await CustomerModel.findByIdAndUpdate(
      req.customer!.customerId,
      {
        $set: {
          firstName: (firstName as string).trim(),
          lastName: (lastName as string).trim(),
          roleTitle: (roleTitle as string).trim(),
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.json(await toCustomerResponse(updated));
  } catch (err) {
    console.error("PUT /api/user/profile failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/user/link-aws-user", requireAuth, async (req, res) => {
  try {
    const { awsUserId } = req.body ?? {};
    if (!awsUserId || typeof awsUserId !== "string") {
      res.status(400).json({ message: "awsUserId is required" });
      return;
    }

    // awsUserId carries the AWS externalId (SSO/IAM UserId) — the stable identity key.
    // Verify the AWS identity exists before linking it to the customer.
    const awsUser = await UserModel.findOne({ externalId: awsUserId }).lean();
    if (!awsUser) {
      res.status(404).json({ message: "AWS user not found" });
      return;
    }

    const updated = await CustomerModel.findByIdAndUpdate(
      req.customer!.customerId,
      { $set: { linkedAwsUserId: awsUserId } },
      { new: true },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.json(await toCustomerResponse(updated));
  } catch (err) {
    console.error("PUT /api/user/link-aws-user failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── AWS credential routes (manager only) ──────────────────────────────────────

app.post("/api/aws/onboard-credentials", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    if (customer.role !== "manager") {
      res
        .status(403)
        .json({ message: "Only managers can update AWS credentials" });
      return;
    }

    const { accessKeyId, secretAccessKey } = req.body ?? {};
    if (
      typeof accessKeyId !== "string" ||
      !accessKeyId.trim() ||
      typeof secretAccessKey !== "string" ||
      !secretAccessKey.trim()
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      customer.companyId,
      {
        $set: {
          awsCredentials: {
            accessKeyId: accessKeyId.trim(),
            secretAccessKey: encryptSecret(secretAccessKey.trim()),
            status: "connected",
            connectedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    if (!updatedCompany) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    res.json(await toCustomerResponse(customer));
  } catch (err) {
    console.error("POST /api/aws/onboard-credentials failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Manager-only: get the company invite code (for sharing with employees)
app.get("/api/company/invite-code", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(
      req.customer!.customerId,
    ).lean();
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    if (customer.role !== "manager") {
      res
        .status(403)
        .json({ message: "Only managers can view the invite code" });
      return;
    }
    const company = await CompanyModel.findById(customer.companyId, {
      inviteCode: 1,
      slug: 1,
    }).lean();
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }
    res.json({ inviteCode: company.inviteCode, slug: company.slug });
  } catch (err) {
    console.error("GET /api/company/invite-code failed:", err);
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
