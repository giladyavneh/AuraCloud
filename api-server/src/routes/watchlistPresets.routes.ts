import { Router } from "express";
import { CustomerModel, TeamModel, WatchlistPresetModel } from "../db.js";
import { mongoose } from "utils";
import { isValidResourcesShape } from "../helpers/validation.helpers.js";
import { requireAuth, requireManager } from "../middleware/auth.middleware.js";
import { validateObjectIdParam } from "../middleware/objectId.middleware.js";

const router = Router();
router.param("id", validateObjectIdParam);

router.get("/api/watchlist-presets", requireAuth, requireManager, async (req, res) => {
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

router.put("/api/watchlist-presets", requireAuth, requireManager, async (req, res) => {
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
      res
        .status(404)
        .json({ message: scopeType === "team" ? "Team not found" : "Employee not found" });
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

router.delete("/api/watchlist-presets/:id", requireAuth, requireManager, async (req, res) => {
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

export default router;
