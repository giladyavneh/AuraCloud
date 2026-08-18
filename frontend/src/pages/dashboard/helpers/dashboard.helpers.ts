import { inferServiceFromArn } from "@/helpers/arn.helpers";
import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import type { FilterTabValue } from "@/pages/dashboard/types/dashboard.types";
import type {
  ActionData,
  ArnPermissionData,
  ResourceStatus,
} from "@/services/types/resources.types";
import type { AwsService } from "@/components/awsServiceIcon/types/awsServiceIcon.types";

export { inferServiceFromArn, inferTitleFromArn } from "@/helpers/arn.helpers";
export { formatTimestamp } from "@/helpers/time.helpers";

export type ResourceCategory = "iam" | "network" | "resource";

/**
 * Maps an AWS service to a high-level category used by the dashboard filter tabs.
 * - iam:      permission / identity services
 * - network:  network / connectivity services
 * - resource: storage / compute / messaging services
 */
export const getServiceCategory = (service: AwsService): ResourceCategory => {
  if (["iam", "sso"].includes(service)) return "iam";
  if (["ec2", "rds", "ecr"].includes(service)) return "network";
  return "resource";
};

interface HasStatus {
  status: unknown;
}

/** Returns true when the ARN data is a single top-level status entry (not per-action). */
export const isTopLevelArnData = (
  data: ArnPermissionData,
): data is ActionData => typeof (data as HasStatus).status === "string";

/** Returns an error reason string when an action or the ARN itself is in error state. */
export const getErrorReasonFromArnData = (
  data: ArnPermissionData,
): string | undefined => {
  if (isTopLevelArnData(data)) return data.reason ?? undefined;

  const perAction = data as Record<string, ActionData>;
  return (
    Object.values(perAction).find((action) => action.status === "error")?.reason ??
    undefined
  );
};

/** Returns the ISO timestamp from the first available entry in the ARN data. */
export const getTimestampFromArnData = (data: ArnPermissionData): string => {
  if (isTopLevelArnData(data)) return data.timestamp;
  const firstAction = Object.values(data as Record<string, ActionData>)[0];
  return firstAction?.timestamp ?? "";
};


export const countFilterTabs = (
  watchedResources: Array<{ arn: string }>,
  resourceStatuses: Record<string, ResourceStatus>,
): Record<FilterTabValue, number> => {
  const counts: Record<FilterTabValue, number> = {
    all: watchedResources.length,
    iam: 0,
    resource: 0,
    network: 0,
    healthy: 0,
  };

  for (const { arn } of watchedResources) {
    counts[getServiceCategory(inferServiceFromArn(arn))]++;
    if (resourceStatuses[arn] === "healthy") counts.healthy++;
  }

  return counts;
};

export const filterResourcesByTab = <ResourceWithArn extends { arn: string }>(
  watchedResources: ResourceWithArn[],
  resourceStatuses: Record<string, ResourceStatus>,
  activeFilter: FilterTabValue,
): ResourceWithArn[] => {
  if (activeFilter === "all") return watchedResources;

  return watchedResources.filter(({ arn }) => {
    if (activeFilter === "healthy") return resourceStatuses[arn] === "healthy";

    return getServiceCategory(inferServiceFromArn(arn)) === activeFilter;
  });
};

export type ResourceStatusCounts = Record<ResourceStatus, number>;

/** Keyed by the watchlist, so an ARN the server did not resolve still counts as unscanned. */
export const countResourceStatuses = (
  watchedArns: string[],
  resourceStatuses: Record<string, ResourceStatus>,
): ResourceStatusCounts => {
  const counts: ResourceStatusCounts = { healthy: 0, blocked: 0, stale: 0, unscanned: 0 };

  for (const arn of watchedArns) {
    counts[resourceStatuses[arn] ?? "unscanned"]++;
  }

  return counts;
};

export interface SystemStatus {
  variant: StatusTagVariant;
  labelKey?: string;
}

export const deriveSystemStatus = (
  isLoading: boolean,
  isError: boolean,
  monitoredCount: number,
  staleCount: number,
): SystemStatus => {
  if (isLoading) return { variant: "stale", labelKey: "dashboard.systemStatus.checking" };

  if (isError) return { variant: "stale", labelKey: "dashboard.systemStatus.degraded" };

  // Every watched resource going stale means the Brain stopped writing, which the
  // API answering successfully does not reveal.
  if (monitoredCount > 0 && staleCount === monitoredCount) {
    return { variant: "stale", labelKey: "dashboard.systemStatus.degraded" };
  }

  return { variant: "online" };
};

export interface StatusMessage {
  headingKey: string;
  headingValues?: Record<string, number>;
  adviceKey: string;
}

export interface StatusMessageInput {
  isLoading: boolean;
  monitoredCount: number;
  blockedCount: number;
  staleCount: number;
  unscannedCount: number;
}

// Unmeasurable states first: their zero counts would otherwise read as healthy.
export const deriveStatusMessage = ({
  isLoading,
  monitoredCount,
  blockedCount,
  staleCount,
  unscannedCount,
}: StatusMessageInput): StatusMessage => {
  if (isLoading) {
    return {
      headingKey: "dashboard.healthHeading.awaitingScan",
      adviceKey: "dashboard.statusAdvice.loading",
    };
  }

  if (monitoredCount === 0) {
    return {
      headingKey: "dashboard.healthHeading.nothingMonitored",
      adviceKey: "dashboard.statusAdvice.nothingMonitored",
    };
  }

  if (unscannedCount === monitoredCount) {
    return {
      headingKey: "dashboard.healthHeading.awaitingScan",
      adviceKey: "dashboard.statusAdvice.awaitingScan",
    };
  }

  // Unscanned folds into stale here: both mean there is no verdict worth trusting.
  const unverifiedCount = staleCount + unscannedCount;

  if (blockedCount > 0 && unverifiedCount > 0) {
    return {
      headingKey: "dashboard.healthHeading.mixed",
      headingValues: { blockers: blockedCount, stale: unverifiedCount },
      adviceKey: "dashboard.statusAdvice.mixed",
    };
  }

  if (blockedCount > 0) {
    return {
      headingKey: "dashboard.healthHeading.degraded",
      headingValues: { count: blockedCount },
      adviceKey: "dashboard.statusAdvice.degraded",
    };
  }

  if (unverifiedCount > 0) {
    return {
      headingKey: "dashboard.healthHeading.stale",
      headingValues: { count: unverifiedCount },
      adviceKey: "dashboard.statusAdvice.stale",
    };
  }

  return {
    headingKey: "dashboard.healthHeading.healthy",
    adviceKey: "dashboard.statusAdvice.healthy",
  };
};
