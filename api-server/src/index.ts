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
  TeamModel,
  WatchlistPresetModel,
} from "./db.js";
import {
  AwsResourceModel,
  ResourceActionModel,
  UserModel,
  encryptSecret,
  mongoose,
  type CustomerDoc,
} from "utils";
import { applyPresetsToMember } from "./presets.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ?? "aura-dev-secret-change-in-production";
const BCRYPT_ROUNDS = 10;

// Internal Aura infrastructure identities — never exposed as linkable AWS users.
const INTERNAL_AWS_USER_ARNS = [
  "arn:aws:iam::589523296424:user/Aura-Crawlers-Sevice",
  "arn:aws:iam::589523296424:user/Aura-SaaS-Crawler",
];

app.use(cors());
app.use(express.json());

// A malformed :id would otherwise reach Mongoose and throw a CastError, which the
// route-level catch blocks turn into a 500. Reject it here as a 404 so a bad id is
// indistinguishable from a nonexistent one, for every route that takes an :id.
app.param("id", (_req, res, next, value: string) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
});

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

/** True when `err` is a MongoDB duplicate-key error (code 11000). */
function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000;
}

/** True when `resources` matches the shared UserResourceWatchlist/WatchlistPreset shape. */
function isValidResourcesShape(resources: unknown): resources is { arn: string; actions: string[] }[] {
  return (
    Array.isArray(resources) &&
    resources.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as { arn?: unknown }).arn === "string" &&
        Array.isArray((r as { actions?: unknown }).actions) &&
        (r as { actions: unknown[] }).actions.every((a) => typeof a === "string"),
    )
  );
}

/** Builds the row shape returned by the employees endpoints. */
function toEmployeeResponse(customer: {
  _id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  role: string;
  teamId?: string | null;
  linkedAwsUserId?: string | null;
  createdAt?: Date;
}) {
  return {
    _id: customer._id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    roleTitle: customer.roleTitle,
    role: customer.role,
    teamId: customer.teamId ?? null,
    hasAwsConnected: Boolean(customer.linkedAwsUserId),
    createdAt: customer.createdAt,
  };
}

// ── Auth middleware ────────────────────────────────────────────────────────────

interface JwtPayload {
  customerId: string;
  email: string;
}

// Extends Express Request so downstream handlers can read req.customer / req.managerCustomer
declare global {
  namespace Express {
    interface Request {
      customer?: JwtPayload;
      managerCustomer?: CustomerDoc;
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

/** Runs after requireAuth: loads the Customer, attaches it as req.managerCustomer, 403s if not a manager. */
async function requireManager(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId);
    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    if (customer.role !== "manager") {
      res.status(403).json({ message: "Managers only" });
      return;
    }
    req.managerCustomer = customer;
    next();
  } catch (err) {
    console.error("requireManager failed:", err);
    res.status(500).json({ message: "Server Error" });
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
    // Return discovered AWS (IAM + SSO) users — no credentials exposed, internal identities excluded
    const users = await UserModel.find(
      { arn: { $nin: INTERNAL_AWS_USER_ARNS } },
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

    // Look up the resource to find its resourceType
    const resource = await AwsResourceModel.findOne({ arn }).lean().exec();
    const resourceType = resource?.resourceType;

    // Map resourceType to service key
    let serviceKey = "";
    if (resourceType) {
      const lowerType = resourceType.toLowerCase();
      if (lowerType.includes("s3")) {
        serviceKey = "s3";
      } else if (lowerType.includes("iam")) {
        serviceKey = "iam";
      } else if (lowerType.includes("sso") || lowerType.includes("permissionset")) {
        serviceKey = "sso";
      }
    }

    // Fallback to ARN-based service key if database lookup didn't yield a type
    if (!serviceKey) {
      const parts = arn.split(":");
      if (parts.length > 2) {
        serviceKey = parts[2].toLowerCase();
      }
    }

    // Fetch actions for this resourceType from database
    const dbActions = await ResourceActionModel.find({ resourceType: serviceKey }).lean().exec();
    const actions = dbActions.map((action) => ({
      ...action,
      resourceArn: arn,
    }));
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
      { returnDocument: 'after' },
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
      { returnDocument: 'after' },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    // Seed the new watchlist with the member's team + individual presets, if any (§3)
    await applyPresetsToMember(req.customer!.customerId, awsUserId);

    res.json(await toCustomerResponse(updated));
  } catch (err) {
    console.error("PUT /api/user/link-aws-user failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── AWS credential routes (manager only) ──────────────────────────────────────

app.post("/api/aws/onboard-credentials", requireAuth, requireManager, async (req, res) => {
  try {
    const customer = req.managerCustomer!;

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
      { returnDocument: 'after' },
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
app.get("/api/company/invite-code", requireAuth, requireManager, async (req, res) => {
  try {
    const company = await CompanyModel.findById(req.managerCustomer!.companyId, {
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

// ── Employee routes (manager only) ─────────────────────────────────────────────

app.get("/api/employees", requireAuth, requireManager, async (req, res) => {
  try {
    const employees = await CustomerModel.find({
      companyId: req.managerCustomer!.companyId,
    }).lean();
    res.json(employees.map(toEmployeeResponse));
  } catch (err) {
    console.error("GET /api/employees failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/** Thrown inside withLastManagerGuard; translated to a 409 by the caller. */
class LastManagerError extends Error {}

/**
 * Runs `mutate` only if the company still has at least one manager without `target`.
 * Returns false (and mutates nothing) when `target` is the last manager.
 *
 * Replaces a count-then-write pattern that was a write-skew race: two concurrent
 * demote/remove requests each counted the *other* manager, both passed the check,
 * and the company was left with zero managers and no way back in. A transaction
 * alone does NOT fix this — the two requests write different Customer documents,
 * so snapshot isolation finds no conflict and both commit. The unconditional $inc
 * on the shared Company document materialises the conflict, so MongoDB aborts and
 * retries one of the two; the retry then reads the committed result of the first
 * and correctly rejects.
 *
 * ponytail: requires a replica set (Atlas provides one). On a standalone mongod
 * startSession/withTransaction throws — if local standalone dev is ever needed,
 * fall back to an atomic $inc guard on a denormalised Company.managerCount.
 */
async function withLastManagerGuard(
  companyId: string,
  target: CustomerDoc,
  mutate: (session: mongoose.ClientSession) => Promise<void>,
): Promise<boolean> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await CompanyModel.updateOne(
        { _id: companyId },
        { $inc: { managerOpsSeq: 1 } },
        { session },
      );
      const otherManagers = await CustomerModel.countDocuments(
        { companyId, role: "manager", _id: { $ne: target._id } },
        { session },
      );
      if (otherManagers < 1) throw new LastManagerError();
      await mutate(session);
    });
    return true;
  } catch (err) {
    if (err instanceof LastManagerError) return false;
    throw err;
  } finally {
    await session.endSession();
  }
}

app.delete("/api/employees/:id", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
    const targetId = req.params.id;

    if (targetId === manager._id.toString()) {
      res.status(400).json({ message: "You cannot remove your own account" });
      return;
    }

    const target = await CustomerModel.findOne({ _id: targetId, companyId: manager.companyId });
    if (!target) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    if (target.role === "manager") {
      const removed = await withLastManagerGuard(manager.companyId, target, (session) =>
        CustomerModel.deleteOne({ _id: target._id }, { session }).then(() => undefined),
      );
      if (!removed) {
        res.status(409).json({ message: "Cannot remove the last manager" });
        return;
      }
    } else {
      await CustomerModel.deleteOne({ _id: target._id });
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/employees/:id failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/employees/:id/role", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
    const { role } = req.body ?? {};
    if (role !== "manager" && role !== "employee") {
      res.status(400).json({ message: "role must be 'manager' or 'employee'" });
      return;
    }

    const target = await CustomerModel.findOne({ _id: req.params.id, companyId: manager.companyId });
    if (!target) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    if (target.role === "manager" && role === "employee") {
      const demoted = await withLastManagerGuard(manager.companyId, target, (session) =>
        CustomerModel.updateOne({ _id: target._id }, { $set: { role } }, { session }).then(
          () => undefined,
        ),
      );
      if (!demoted) {
        res.status(409).json({ message: "Cannot demote the last manager" });
        return;
      }
      target.role = role;
    } else {
      target.role = role;
      await target.save();
    }

    res.json(toEmployeeResponse(target));
  } catch (err) {
    console.error("PUT /api/employees/:id/role failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/employees/:id/team", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
    const { teamId } = req.body ?? {};
    // An empty string passes a bare typeof check and then CastErrors in Mongoose —
    // treat any non-ObjectId value as an explicit unassign rather than a 500.
    if (teamId !== null && typeof teamId !== "string") {
      res.status(400).json({ message: "teamId must be a string or null" });
      return;
    }
    if (teamId !== null && !mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(404).json({ message: "Team not found" });
      return;
    }

    const target = await CustomerModel.findOne({ _id: req.params.id, companyId: manager.companyId });
    if (!target) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    if (teamId !== null) {
      const team = await TeamModel.exists({ _id: teamId, companyId: manager.companyId });
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }
    }

    target.teamId = teamId;
    await target.save();

    // Team assignment triggers preset application, but only if already AWS-linked (§3)
    if (teamId !== null && target.linkedAwsUserId) {
      await applyPresetsToMember(target._id.toString(), target.linkedAwsUserId);
    }

    res.json(toEmployeeResponse(target));
  } catch (err) {
    console.error("PUT /api/employees/:id/team failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Team routes (manager only) ─────────────────────────────────────────────────

app.get("/api/teams", requireAuth, requireManager, async (req, res) => {
  try {
    const teams = await TeamModel.find(
      { companyId: req.managerCustomer!.companyId },
      { name: 1, createdAt: 1 },
    ).lean();
    res.json(teams);
  } catch (err) {
    console.error("GET /api/teams failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/teams", requireAuth, requireManager, async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    const team = await TeamModel.create({
      companyId: req.managerCustomer!.companyId,
      name: name.trim(),
    });
    res.status(201).json(team);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ message: "A team with this name already exists" });
      return;
    }
    console.error("POST /api/teams failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/teams/:id", requireAuth, requireManager, async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    const team = await TeamModel.findOneAndUpdate(
      { _id: req.params.id, companyId: req.managerCustomer!.companyId },
      { name: name.trim() },
      { returnDocument: "after" },
    );
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }
    res.json(team);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ message: "A team with this name already exists" });
      return;
    }
    console.error("PUT /api/teams/:id failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.delete("/api/teams/:id", requireAuth, requireManager, async (req, res) => {
  try {
    const team = await TeamModel.findOneAndDelete({
      _id: req.params.id,
      companyId: req.managerCustomer!.companyId,
    });
    if (!team) {
      res.status(404).json({ message: "Team not found" });
      return;
    }

    const teamId = team._id.toString();
    await CustomerModel.updateMany({ teamId }, { teamId: null });
    await WatchlistPresetModel.deleteOne({ scopeType: "team", scopeId: teamId });

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/teams/:id failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ── Watchlist preset routes (manager only) ─────────────────────────────────────

app.get("/api/watchlist-presets", requireAuth, requireManager, async (req, res) => {
  try {
    const presets = await WatchlistPresetModel.find({
      companyId: req.managerCustomer!.companyId,
    }).lean();
    res.json(presets);
  } catch (err) {
    console.error("GET /api/watchlist-presets failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/watchlist-presets", requireAuth, requireManager, async (req, res) => {
  try {
    const { scopeType, scopeId, name, resources } = req.body ?? {};
    if (scopeType !== "team" && scopeType !== "individual") {
      res.status(400).json({ message: "scopeType must be 'team' or 'individual'" });
      return;
    }
    if (typeof scopeId !== "string" || !mongoose.Types.ObjectId.isValid(scopeId)) {
      res.status(400).json({ message: "scopeId is required" });
      return;
    }
    if (!isValidResourcesShape(resources)) {
      res.status(400).json({ message: "resources must be an array of {arn, actions[]}" });
      return;
    }

    const companyId = req.managerCustomer!.companyId;
    const scopeExists =
      scopeType === "team"
        ? await TeamModel.exists({ _id: scopeId, companyId })
        : await CustomerModel.exists({ _id: scopeId, companyId });
    if (!scopeExists) {
      res.status(404).json({ message: scopeType === "team" ? "Team not found" : "Employee not found" });
      return;
    }

    const preset = await WatchlistPresetModel.findOneAndUpdate(
      { scopeType, scopeId },
      {
        companyId,
        scopeType,
        scopeId,
        name: typeof name === "string" ? name : undefined,
        resources,
        createdBy: req.managerCustomer!._id.toString(),
      },
      { upsert: true, returnDocument: "after" },
    );
    res.json(preset);
  } catch (err) {
    console.error("PUT /api/watchlist-presets failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.delete("/api/watchlist-presets/:id", requireAuth, requireManager, async (req, res) => {
  try {
    const preset = await WatchlistPresetModel.findOneAndDelete({
      _id: req.params.id,
      companyId: req.managerCustomer!.companyId,
    });
    if (!preset) {
      res.status(404).json({ message: "Preset not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/watchlist-presets/:id failed:", err);
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
