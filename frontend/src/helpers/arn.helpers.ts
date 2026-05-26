import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

const SERVICE_ARN_MAP: Array<{
  segment: string;
  service: AwsService;
  title: string;
}> = [
  { segment: ':s3',     service: 's3',     title: 'S3' },
  { segment: ':sqs',    service: 'sqs',    title: 'SQS' },
  { segment: ':ecr',    service: 'ecr',    title: 'ECR' },
  { segment: ':lambda', service: 'lambda', title: 'Lambda' },
  { segment: ':ec2',    service: 'ec2',    title: 'EC2' },
  { segment: ':rds',    service: 'rds',    title: 'RDS' },
  { segment: ':iam',    service: 'iam',    title: 'IAM' },
  { segment: ':sso',    service: 'sso',    title: 'SSO' },
];

const FALLBACK_SERVICE: AwsService = 'unknown';

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

/**
 * Extracts the resource name from any ARN format.
 *
 * ARN structure: arn:partition:service:region:account-id:resource
 * Splitting by ":" and joining from index 5 handles all cases:
 *   - S3:  arn:aws:s3:::bucket          → "bucket"
 *   - IAM: arn:aws:iam::123:user/name   → "user/name"
 *   - EC2: arn:aws:ec2:us-east-1:123:instance/i-xxx → "instance/i-xxx"
 */
export const extractResourceName = (arn: string): string => {
  const parts = arn.split(':');
  return parts.slice(5).join(':') || arn;
};
