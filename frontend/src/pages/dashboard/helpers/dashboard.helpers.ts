import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

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
