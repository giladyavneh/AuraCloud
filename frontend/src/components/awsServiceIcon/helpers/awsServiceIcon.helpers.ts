import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

export interface ServiceConfig {
  bg: string;
  label: string;
}

/**
 * AWS Architecture Icon color coding follows official AWS service category colors.
 * Storage (S3) → green, Compute/Integration (EC2, SQS, Lambda, ECR) → orange,
 * Database (RDS) → blue, Management (CloudWatch) → pink.
 */
export const SERVICE_CONFIG: Record<AwsService, ServiceConfig> = {
  s3:         { bg: '#3d8b37', label: 'S3'  },
  sqs:        { bg: '#e7720b', label: 'SQS' },
  ecr:        { bg: '#e7720b', label: 'ECR' },
  lambda:     { bg: '#e7720b', label: 'λ'   },
  ec2:        { bg: '#e7720b', label: 'EC2' },
  rds:        { bg: '#3232d0', label: 'RDS' },
  cloudwatch: { bg: '#e7157b', label: 'CW'  },
};
