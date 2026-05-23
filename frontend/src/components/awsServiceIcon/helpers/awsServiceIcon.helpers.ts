import type { ComponentType } from "react";
import {
  AmazonSimpleStorageService,
  AmazonSimpleQueueService,
  AmazonElasticContainerRegistry,
  AwsLambda,
  AmazonEc2,
  AmazonRds,
  AmazonCloudWatch,
} from "@nxavis/aws-icons";
import type { AwsService } from "@/components/awsServiceIcon/types/awsServiceIcon.types";

export const SERVICE_CONFIG: Record<
  AwsService,
  ComponentType<{ size?: number }>
> = {
  s3: AmazonSimpleStorageService,
  sqs: AmazonSimpleQueueService,
  ecr: AmazonElasticContainerRegistry,
  lambda: AwsLambda,
  ec2: AmazonEc2,
  rds: AmazonRds,
  cloudwatch: AmazonCloudWatch,
};
