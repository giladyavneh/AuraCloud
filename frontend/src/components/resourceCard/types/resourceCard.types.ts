import type { StatusTagVariant } from '@/components/statusTag/types/statusTag.types';
import type { AwsService } from '@/components/awsServiceIcon/types/awsServiceIcon.types';
import type { PermissionStatus } from '@/services/types/resources.types';

export interface ResourceCardAction {
  name: string;
  /** Absent when the Brain reported nothing for this action. */
  status?: PermissionStatus;
  reason?: string;
}

export interface ResourceCardProps {
  service: AwsService;
  title: string;
  /** Shown under the title — the name is not unique, the ARN is. */
  arn: string;
  lastUpdated: string;
  status: StatusTagVariant;
  actions: ResourceCardAction[];
  maxVisibleActions?: number;
}

export interface ResourceCardActionListProps {
  visibleActions: ResourceCardAction[];
  remainingActions: ResourceCardAction[];
  resourceStatus: StatusTagVariant;
}
