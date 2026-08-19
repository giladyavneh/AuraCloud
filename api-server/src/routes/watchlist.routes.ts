import { Router } from "express";
import { CustomerModel, UserResourceWatchlistModel } from "../db.js";
import { getWatchedResources } from "utils";
import { resolveMemberPresetResources } from "../presets.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateObjectIdParam } from "../middleware/objectId.middleware.js";

const router = Router();
router.param("id", validateObjectIdParam);

/** The resources the caller inherits from presets — their own unioned with their team's. */
router.get("/api/user-resource-watchlist/preset", requireAuth, async (req, res) => {
  try {
    const resources = await resolveMemberPresetResources(req.customer!.customerId);
    res.json({ resources });
  } catch (err) {
    console.error("GET /api/user-resource-watchlist/preset failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/api/user-resource-watchlist", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer?.linkedAwsUserId) {
      res.json([]);
      return;
    }

    const { watchlist, resources } = await getWatchedResources(customer.linkedAwsUserId);
    if (!watchlist) {
      res.json([]);
      return;
    }

    // Still an array: a user has at most one watchlist, but the shape is what
    // the frontend reads today.
    res.json([{ ...watchlist, resources }]);
  } catch (err) {
    console.error("GET /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/api/user-resource-watchlist", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer?.linkedAwsUserId) {
      res.status(409).json({ message: "Link an AWS user before creating a watchlist" });
      return;
    }

    const existing = await UserResourceWatchlistModel.findOne({
      userId: customer.linkedAwsUserId,
    });
    if (existing) {
      res.status(409).json({ message: "Watchlist already exists", watchlist: existing });
      return;
    }

    const watchlist = await UserResourceWatchlistModel.create({
      userId: customer.linkedAwsUserId,
      name: `${customer.firstName} ${customer.lastName}'s Watchlist`,
      resources: req.body.resources ?? [],
    });
    res.status(201).json(watchlist);
  } catch (err) {
    console.error("POST /api/user-resource-watchlist failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/api/user-resource-watchlist/:id", requireAuth, async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.customer!.customerId).lean();
    if (!customer?.linkedAwsUserId) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }

    const watchlist = await UserResourceWatchlistModel.findOneAndUpdate(
      { _id: req.params.id, userId: customer.linkedAwsUserId },
      { resources: req.body.resources },
      { returnDocument: "after" },
    );
    if (!watchlist) {
      res.status(404).json({ message: "Watchlist not found" });
      return;
    }
    res.json(watchlist);
  } catch (err) {
    console.error("PUT /api/user-resource-watchlist/:id failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
