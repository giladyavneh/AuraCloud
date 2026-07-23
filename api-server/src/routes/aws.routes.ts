import { Router } from "express";
import { CompanyModel } from "../db.js";
import { encryptSecret } from "utils";
import { toCustomerResponse } from "../helpers/response.helpers.js";
import { requireAuth, requireManager } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/api/aws/onboard-credentials", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
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
      manager.companyId,
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
      { returnDocument: "after" },
    ).lean();

    if (!updatedCompany) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    res.json(await toCustomerResponse(manager));
  } catch (err) {
    console.error("POST /api/aws/onboard-credentials failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
