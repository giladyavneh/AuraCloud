import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import type {
  ArnPermissionData,
  ActionData,
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

/** Returns action names for per-action ARN data; empty array for top-level status. */
export const getActionsFromArnData = (data: ArnPermissionData): string[] => {
  if (isTopLevelArnData(data)) return [];
  return Object.keys(data as Record<string, ActionData>);
};

const toStatusTagVariant = (status: string): StatusTagVariant => {
  if (status === "error") return "blocked";
  if (status === "warning") return "warning";
  if (status === "stale") return "stale";
  return "healthy";
};

const STATUS_PRIORITY: Record<string, number> = {
  error: 3,
  warning: 2,
  stale: 2,
  valid: 1,
};

/** Derives the card StatusTagVariant from ARN permission data. */
export const deriveStatusFromArnData = (
  data: ArnPermissionData,
): StatusTagVariant => {
  if (isTopLevelArnData(data)) return toStatusTagVariant(data.status);

  const actionValues = Object.values(data as Record<string, ActionData>);
  const worstStatus = actionValues.reduce<string>((worst, action) => {
    return (STATUS_PRIORITY[action.status] ?? 0) > (STATUS_PRIORITY[worst] ?? 0)
      ? action.status
      : worst;
  }, "valid");

  return toStatusTagVariant(worstStatus);
};

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

export interface SystemStatus {
  variant: StatusTagVariant;
  labelKey?: string;
}

/**
 * Derives the system-health tag from the permissions query — the only live health
 * signal available until a dedicated health endpoint exists. A 404 means the Brain
 * has not produced data yet, which is a waiting state rather than an outage.
 */
export const deriveSystemStatus = (
  isLoading: boolean,
  isError: boolean,
  errorMessage?: string,
): SystemStatus => {
  if (isLoading) return { variant: "stale", labelKey: "dashboard.systemStatus.checking" };

  if (isError) {
    return errorMessage?.includes("404")
      ? { variant: "stale", labelKey: "dashboard.systemStatus.awaitingData" }
      : { variant: "warning", labelKey: "dashboard.systemStatus.degraded" };
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
  hasPermissionData: boolean;
  blockedCount: number;
  staleCount: number;
}

// Unmeasurable states first: their zero counts would otherwise read as healthy.
export const deriveStatusMessage = ({
  isLoading,
  monitoredCount,
  hasPermissionData,
  blockedCount,
  staleCount,
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

  if (!hasPermissionData) {
    return {
      headingKey: "dashboard.healthHeading.awaitingScan",
      adviceKey: "dashboard.statusAdvice.awaitingScan",
    };
  }

  if (blockedCount > 0 && staleCount > 0) {
    return {
      headingKey: "dashboard.healthHeading.mixed",
      headingValues: { blockers: blockedCount, stale: staleCount },
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

  if (staleCount > 0) {
    return {
      headingKey: "dashboard.healthHeading.stale",
      headingValues: { count: staleCount },
      adviceKey: "dashboard.statusAdvice.stale",
    };
  }

  return {
    headingKey: "dashboard.healthHeading.healthy",
    adviceKey: "dashboard.statusAdvice.healthy",
  };
};
