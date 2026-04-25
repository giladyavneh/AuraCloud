import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';

export interface ResourceCardProps {
  service: AwsService;
  title: string;
  lastUpdated: string;
  status: StatusTagVariant;
  resources: string[];
  errorMessage?: string;
  maxVisibleResources?: number;
}
