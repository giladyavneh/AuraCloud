import { Router } from "express";
import { CustomerModel, TeamModel } from "../db.js";
import { mongoose } from "utils";
import { applyPresetsToMember } from "../presets.js";
import { toEmployeeResponse } from "../helpers/response.helpers.js";
import { withLastManagerGuard } from "../helpers/lastManagerGuard.helpers.js";
import { requireAuth, requireManager } from "../middleware/auth.middleware.js";
import { validateObjectIdParam } from "../middleware/objectId.middleware.js";

const router = Router();
router.param("id", validateObjectIdParam);

router.get("/api/employees", requireAuth, requireManager, async (req, res) => {
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

router.delete("/api/employees/:id", requireAuth, requireManager, async (req, res) => {
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
      const wasRemoved = await withLastManagerGuard(manager.companyId, target, (session) =>
        CustomerModel.deleteOne({ _id: target._id }, { session }).then(() => undefined),
      );
      if (!wasRemoved) {
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

router.put("/api/employees/:id/role", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
    const { role } = req.body ?? {};

    if (role !== "manager" && role !== "employee") {
      res.status(400).json({ message: "role must be 'manager' or 'employee'" });
      return;
    }

    const target = await CustomerModel.findOne({
      _id: req.params.id,
      companyId: manager.companyId,
    });
    if (!target) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const isDemotion = target.role === "manager" && role === "employee";

    if (isDemotion) {
      const wasDemoted = await withLastManagerGuard(manager.companyId, target, (session) =>
        CustomerModel.updateOne({ _id: target._id }, { $set: { role } }, { session }).then(
          () => undefined,
        ),
      );
      if (!wasDemoted) {
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

router.put("/api/employees/:id/team", requireAuth, requireManager, async (req, res) => {
  try {
    const manager = req.managerCustomer!;
    const { teamId } = req.body ?? {};

    if (teamId !== null && typeof teamId !== "string") {
      res.status(400).json({ message: "teamId must be a string or null" });
      return;
    }
    // An empty string passes the typeof check above and would CastError in Mongoose
    if (teamId !== null && !mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(404).json({ message: "Team not found" });
      return;
    }

    const target = await CustomerModel.findOne({
      _id: req.params.id,
      companyId: manager.companyId,
    });
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

    // A preset can only be materialised once the member has an AWS identity to key it on
    if (teamId !== null && target.linkedAwsUserId) {
      await applyPresetsToMember(target._id.toString(), target.linkedAwsUserId);
    }

    res.json(toEmployeeResponse(target));
  } catch (err) {
    console.error("PUT /api/employees/:id/team failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
