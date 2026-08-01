import { Router } from "express";
import bcrypt from "bcryptjs";
import { CompanyModel, CustomerModel } from "../db.js";
import { BCRYPT_ROUNDS } from "../config.js";
import { generateInviteCode, toSlug } from "../helpers/company.helpers.js";
import { toCustomerResponse } from "../helpers/response.helpers.js";
import { requireAuth, signToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/api/auth/signup", async (req, res) => {
  try {
    const { role, firstName, lastName, email, roleTitle, password } = req.body ?? {};

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
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    let companyId: string;

    if (role === "manager") {
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

    const token = signToken({ customerId: customer._id.toString(), email: customer.email });
    res.status(201).json({ token, customer: await toCustomerResponse(customer) });
  } catch (err) {
    console.error("POST /api/auth/signup failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/api/auth/login", async (req, res) => {
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

    const isPasswordValid = await bcrypt.compare(password as string, customer.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken({ customerId: customer._id.toString(), email: customer.email });
    res.json({ token, customer: await toCustomerResponse(customer) });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
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

export default router;
