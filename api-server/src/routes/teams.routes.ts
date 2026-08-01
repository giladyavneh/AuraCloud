import { Router } from "express";
import { CustomerModel, TeamModel, WatchlistPresetModel } from "../db.js";
import { isDuplicateKeyError } from "../helpers/validation.helpers.js";
import { requireAuth, requireManager } from "../middleware/auth.middleware.js";
import { validateObjectIdParam } from "../middleware/objectId.middleware.js";

const router = Router();
router.param("id", validateObjectIdParam);

router.get("/api/teams", requireAuth, requireManager, async (req, res) => {
  try {
    const teams = await TeamModel.find(
      { companyId: req.managerCustomer!.companyId },
      { name: true, createdAt: true },
    ).lean();
    res.json(teams);
  } catch (err) {
    console.error("GET /api/teams failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/api/teams", requireAuth, requireManager, async (req, res) => {
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

router.put("/api/teams/:id", requireAuth, requireManager, async (req, res) => {
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

router.delete("/api/teams/:id", requireAuth, requireManager, async (req, res) => {
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

export default router;
