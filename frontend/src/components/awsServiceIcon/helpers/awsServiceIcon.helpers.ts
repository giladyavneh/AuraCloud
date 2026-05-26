import type { ComponentType } from "react";
import {
  AmazonSimpleStorageService,
  AmazonSimpleQueueService,
  AmazonElasticContainerRegistry,
  AwsLambda,
  AmazonEc2,
  AmazonRds,
  AmazonCloudWatch,
  AwsIdentityAndAccessManagement,
  AwsIamIdentityCenter,
} from "@nxavis/aws-icons";
import { QuestionIcon } from "@phosphor-icons/react";
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
  iam: AwsIdentityAndAccessManagement,
  sso: AwsIamIdentityCenter,
  unknown: QuestionIcon,
};
