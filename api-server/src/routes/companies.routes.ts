import { Router } from "express";
import { CompanyModel, CustomerModel } from "../db.js";
import { UserModel } from "utils";
import { excludingInternalArns } from "utils";
import { requireAuth, requireManager } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/api/companies/:slug", async (req, res) => {
  try {
    const company = await CompanyModel.findOne(
      { slug: req.params.slug },
      { name: true, slug: true },
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

router.get("/api/companies/:slug/aws-users", requireAuth, async (req, res) => {
  try {
    const company = await CompanyModel.findOne({ slug: req.params.slug }).lean();
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer || customer.companyId.toString() !== company._id.toString()) {
      // Cross-company target: respond as if the company doesn't exist rather than confirming it does.
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const users = await UserModel.find(excludingInternalArns(), {
      name: true,
      source: true,
      externalId: true,
      arn: true,
    }).lean();
    res.json(users);
  } catch (err) {
    console.error("GET /api/companies/:slug/aws-users failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/api/company/invite-code", requireAuth, requireManager, async (req, res) => {
  try {
    const company = await CompanyModel.findById(req.managerCustomer!.companyId, {
      inviteCode: true,
      slug: true,
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

export default router;
