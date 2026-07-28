import { AwsResourceModel, INTERNAL_AWS_USER_ARNS, ResourceActionModel } from "utils";

export interface AwsResourceSummary {
  arn: string;
  resourceType: string;
  name: string;
  accountId: string | null;
  region: string | null;
}

export interface ResourceActionSummary {
  actionName: string;
  policySource: string | null;
  policyArn: string | null;
  lastSeenAt: Date;
}

export interface ResourceActionsResult {
  arn: string;
  serviceKey: string;
  actions: ResourceActionSummary[];
}

export interface ListAwsResourcesFilter {
  resourceType?: string;
  nameContains?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 100;

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listAwsResources = async (
  filter: ListAwsResourcesFilter,
): Promise<AwsResourceSummary[]> => {
  // Internal Aura identities are never listed as monitorable resources — same
  // filter as the api-server routes (today the catalogue holds only S3 buckets;
  // this matters once IAM/SSO resources join it).
  const query: Record<string, unknown> = { arn: { $nin: INTERNAL_AWS_USER_ARNS } };
  if (filter.resourceType) query.resourceType = filter.resourceType;
  if (filter.nameContains) {
    query.name = { $regex: escapeRegex(filter.nameContains), $options: "i" };
  }

  const docs = await AwsResourceModel.find(query)
    .limit(filter.limit ?? DEFAULT_LIMIT)
    .select("arn resourceType name accountId region")
    .lean()
    .exec();

  return docs.map((doc) => ({
    arn: doc.arn,
    resourceType: doc.resourceType,
    name: doc.name,
    accountId: doc.accountId ?? null,
    region: doc.region ?? null,
  }));
};

/**
 * Map an ARN to the ResourceAction service key. Ported from
 * api-server GET /api/resources/:arn/actions: prefer the discovered
 * resourceType, fall back to the ARN's service segment.
 */
const serviceKeyForArn = async (arn: string): Promise<string> => {
  const resource = await AwsResourceModel.findOne({ arn }).lean().exec();
  const resourceType = resource?.resourceType;

  let serviceKey = "";
  if (resourceType) {
    const lowerType = resourceType.toLowerCase();
    if (lowerType.includes("s3")) {
      serviceKey = "s3";
    } else if (lowerType.includes("iam")) {
      serviceKey = "iam";
    } else if (lowerType.includes("sso") || lowerType.includes("permissionset")) {
      serviceKey = "sso";
    }
  }

  // Fallback to ARN-based service key if database lookup didn't yield a type
  if (!serviceKey) {
    const parts = arn.split(":");
    if (parts.length > 2) {
      serviceKey = parts[2].toLowerCase();
    }
  }

  return serviceKey;
};

export const getResourceActions = async (arn: string): Promise<ResourceActionsResult> => {
  const serviceKey = await serviceKeyForArn(arn);
  const docs = await ResourceActionModel.find({ resourceType: serviceKey }).lean().exec();

  return {
    arn,
    serviceKey,
    actions: docs.map((doc) => ({
      actionName: doc.actionName,
      policySource: doc.policySource ?? null,
      policyArn: doc.policyArn ?? null,
      lastSeenAt: doc.lastSeenAt,
    })),
  };
};
