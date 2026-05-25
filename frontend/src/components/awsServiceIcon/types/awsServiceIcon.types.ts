export type AwsService = 's3' | 'sqs' | 'ecr' | 'lambda' | 'ec2' | 'rds' | 'cloudwatch' | 'iam' | 'sso';

export interface AwsServiceIconProps {
  service: AwsService;
  size?: number;
}
