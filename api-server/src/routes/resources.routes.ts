import { Router } from "express";
import { AwsResourceModel, ResourceActionModel, excludingInternalArns } from "utils";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

/** Maps a stored resourceType (or, failing that, an ARN) to the ResourceAction service key. */
function toServiceKey(resourceType: string | undefined, arn: string): string {
  if (resourceType) {
    const lowerType = resourceType.toLowerCase();
    if (lowerType.includes("s3")) return "s3";
    if (lowerType.includes("iam")) return "iam";
    if (lowerType.includes("sso") || lowerType.includes("permissionset")) return "sso";
    if (lowerType.includes("ec2")) return "ec2";
  }

  const arnSegments = arn.split(":");
  return arnSegments.length > 2 ? arnSegments[2].toLowerCase() : "";
}

router.get("/api/resources", requireAuth, async (_req, res) => {
  try {
    const resources = await AwsResourceModel.find(excludingInternalArns())
      .lean()
      .exec();
    res.json(resources);
  } catch (err) {
    console.error("GET /api/resources failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/api/resources/:arn/actions", requireAuth, async (req, res) => {
  try {
    // The ARN is URL-encoded because it contains colons and slashes
    const rawArn = req.params.arn;
    const arn = decodeURIComponent(Array.isArray(rawArn) ? rawArn[0] : rawArn);

    const resource = await AwsResourceModel.findOne({ arn }).lean().exec();
    const serviceKey = toServiceKey(resource?.resourceType, arn);

    const resourceActions = await ResourceActionModel.find({ resourceType: serviceKey })
      .lean()
      .exec();
    res.json(resourceActions.map((action) => ({ ...action, resourceArn: arn })));
  } catch (err) {
    console.error("GET /api/resources/:arn/actions failed:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
