import { Router } from "express";
import { CompanyModel } from "../db.js";
import { UserModel } from "utils";
import { INTERNAL_AWS_USER_ARNS } from "../config.js";
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

router.get("/api/companies/:slug/aws-users", async (req, res) => {
  try {
    const company = await CompanyModel.findOne({ slug: req.params.slug }).lean();
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    const users = await UserModel.find(
      { arn: { $nin: INTERNAL_AWS_USER_ARNS } },
      { name: true, source: true, externalId: true, arn: true },
    ).lean();
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
