import { Router } from "express";
import { CustomerModel, UserPermissionModel } from "../db.js";
import {
  UserModel,
  UserResourceWatchlistModel,
  resolveWatchlistStatuses,
  type ArnPermissionEntry,
} from "utils";
import { applyPresetsToMember } from "../presets.js";
import { toCustomerResponse } from "../helpers/response.helpers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/api/user-permissions", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer?.linkedAwsUserId) {
      res.status(404).json({ message: "No AWS user linked yet" });
      return;
    }

    const [permission, watchlist] = await Promise.all([
      UserPermissionModel.findOne({ userId: customer.linkedAwsUserId }).lean(),
      UserResourceWatchlistModel.findOne({ userId: customer.linkedAwsUserId }).lean(),
    ]);

    // Keyed by the watchlist, so a resource the Brain never reported still appears.
    const watchedArns = (watchlist?.resources ?? []).map((resource) => resource.arn);
    const resourceStatuses = resolveWatchlistStatuses(
      watchedArns,
      permission?.permissionsData as Record<string, ArnPermissionEntry> | undefined,
    );

    // A 404 would throw the statuses away, so watched resources answer as unscanned.
    if (!permission && watchedArns.length === 0) {
      res.status(404).json({ message: "No permissions data yet" });
      return;
    }

    res.json({ ...permission, resourceStatuses });
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/api/user/profile", requireAuth, async (req, res) => {
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
      { returnDocument: "after" },
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

router.put("/api/user/link-aws-user", requireAuth, async (req, res) => {
  try {
    const { awsUserId } = req.body ?? {};
    if (!awsUserId || typeof awsUserId !== "string") {
      res.status(400).json({ message: "awsUserId is required" });
      return;
    }

    // awsUserId carries the AWS externalId (SSO/IAM UserId) — the stable identity key
    const awsUser = await UserModel.findOne({ externalId: awsUserId }).lean();
    if (!awsUser) {
      res.status(404).json({ message: "AWS user not found" });
      return;
    }

    const updated = await CustomerModel.findByIdAndUpdate(
      req.customer!.customerId,
      { $set: { linkedAwsUserId: awsUserId } },
      { returnDocument: "after" },
    ).lean();

    if (!updated) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    await applyPresetsToMember(req.customer!.customerId, awsUserId);

    res.json(await toCustomerResponse(updated));
  } catch (err) {
    console.error("PUT /api/user/link-aws-user failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
