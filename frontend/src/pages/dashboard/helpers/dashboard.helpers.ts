import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';
import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import type { ArnPermissionData, ActionData } from '@/services/resources.service';

const SERVICE_ARN_MAP: Array<{ segment: string; service: AwsService; title: string }> = [
  { segment: ':s3',       service: 's3',     title: 'S3'           },
  { segment: ':sqs',      service: 'sqs',    title: 'SQS'          },
  { segment: ':ecr',      service: 'ecr',    title: 'ECR • versions' },
  { segment: ':lambda',   service: 'lambda', title: 'Lambda'       },
  { segment: ':ec2',      service: 'ec2',    title: 'EC2'          },
  { segment: ':rds',      service: 'rds',    title: 'RDS'          },
];

const FALLBACK_SERVICE: AwsService = 's3';

/** Derives the AwsService key from a resource ARN. Falls back to 's3'. */
export const inferServiceFromArn = (arn: string): AwsService => {
  const match = SERVICE_ARN_MAP.find((entry) => arn.includes(entry.segment));

  return match?.service ?? FALLBACK_SERVICE;
};

/** Derives a human-readable service title from a resource ARN. */
export const inferTitleFromArn = (arn: string): string => {
  const match = SERVICE_ARN_MAP.find((entry) => arn.includes(entry.segment));

  return match?.title ?? FALLBACK_SERVICE.toUpperCase();
};

interface HasStatus { status: unknown; }

/** Returns true when the ARN data is a single top-level status entry (not per-action). */
export const isTopLevelArnData = (data: ArnPermissionData): data is ActionData =>
  typeof (data as HasStatus).status === 'string';

/** Returns action names for per-action ARN data; empty array for top-level status. */
export const getActionsFromArnData = (data: ArnPermissionData): string[] => {
  if (isTopLevelArnData(data)) return [];
  return Object.keys(data as Record<string, ActionData>);
};

const toStatusTagVariant = (status: string): StatusTagVariant => {
  if (status === 'error') return 'blocked';
  if (status === 'stale' || status === 'warning') return 'stale';
  return 'healthy';
};

const STATUS_PRIORITY: Record<string, number> = { error: 3, warning: 2, stale: 2, valid: 1 };

/** Derives the card StatusTagVariant from ARN permission data. */
export const deriveStatusFromArnData = (data: ArnPermissionData): StatusTagVariant => {
  if (isTopLevelArnData(data)) return toStatusTagVariant(data.status);

  const actionValues = Object.values(data as Record<string, ActionData>);
  const worstStatus = actionValues.reduce<string>((worst, action) => {
    return (STATUS_PRIORITY[action.status] ?? 0) > (STATUS_PRIORITY[worst] ?? 0)
      ? action.status
      : worst;
  }, 'valid');

  return toStatusTagVariant(worstStatus);
};

/** Returns an error reason string when an action or the ARN itself is in error state. */
export const getErrorReasonFromArnData = (data: ArnPermissionData): string | undefined => {
  if (isTopLevelArnData(data)) return data.reason ?? undefined;

  const perAction = data as Record<string, ActionData>;
  return Object.values(perAction).find((a) => a.status === 'error')?.reason ?? undefined;
};

/** Returns the ISO timestamp from the first available entry in the ARN data. */
export const getTimestampFromArnData = (data: ArnPermissionData): string => {
  if (isTopLevelArnData(data)) return data.timestamp;
  const firstAction = Object.values(data as Record<string, ActionData>)[0];
  return firstAction?.timestamp ?? '';
};

/** Formats an ISO timestamp to a short locale date string (e.g. "Jun 1, 2024"). */
export const formatTimestamp = (isoTimestamp: string): string => {
  if (!isoTimestamp) return 'Unknown';
  return new Date(isoTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
