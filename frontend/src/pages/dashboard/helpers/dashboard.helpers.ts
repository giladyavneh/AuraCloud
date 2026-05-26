import type { StatusTagVariant } from "@/components/statusTag/types/statusTag.types";
import type {
  ArnPermissionData,
  ActionData,
} from "@/services/types/resources.types";
import type { AwsService } from "@/components/awsServiceIcon/types/awsServiceIcon.types";
import i18next from "i18next";

export { inferServiceFromArn, inferTitleFromArn } from "@/helpers/arn.helpers";

export type ResourceCategory = "iam" | "network" | "resource";

/**
 * Maps an AWS service to a high-level category used by the dashboard filter tabs.
 * - iam:      permission / identity services
 * - network:  network / connectivity services
 * - resource: storage / compute / messaging services
 */
export const getServiceCategory = (service: AwsService): ResourceCategory => {
  if (["iam", "sso", "lambda"].includes(service)) return "iam";
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
    Object.values(perAction).find((a) => a.status === "error")?.reason ??
    undefined
  );
};

/** Returns the ISO timestamp from the first available entry in the ARN data. */
export const getTimestampFromArnData = (data: ArnPermissionData): string => {
  if (isTopLevelArnData(data)) return data.timestamp;
  const firstAction = Object.values(data as Record<string, ActionData>)[0];
  return firstAction?.timestamp ?? "";
};

const { t } = i18next;

/** Formats an ISO timestamp as a human-readable relative time string. */
export const formatTimestamp = (isoTimestamp: string): string => {
  if (!isoTimestamp) return t("dashboard.timeAgo.unknown");

  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalMinutes < 1) return t("dashboard.timeAgo.lessThanMinute");
  if (totalMinutes < 60) return t("dashboard.timeAgo.minutesAgo", { count: totalMinutes });

  if (totalHours < 24) {
    const remainingMinutes = totalMinutes % 60;
    if (totalHours === 1) {
      return remainingMinutes > 0
        ? t("dashboard.timeAgo.oneHourAndMinutesAgo", { minutes: remainingMinutes })
        : t("dashboard.timeAgo.oneHourAgo");
    }
    return remainingMinutes > 0
      ? t("dashboard.timeAgo.hoursAndMinutesAgo", { hours: totalHours, minutes: remainingMinutes })
      : t("dashboard.timeAgo.hoursAgo", { count: totalHours });
  }

  const remainingHours = totalHours % 24;
  if (totalDays === 1) {
    return remainingHours > 0
      ? t("dashboard.timeAgo.oneDayAndHoursAgo", { hours: remainingHours })
      : t("dashboard.timeAgo.oneDayAgo");
  }
  return remainingHours > 0
    ? t("dashboard.timeAgo.daysAndHoursAgo", { days: totalDays, hours: remainingHours })
    : t("dashboard.timeAgo.daysAgo", { count: totalDays });
};
