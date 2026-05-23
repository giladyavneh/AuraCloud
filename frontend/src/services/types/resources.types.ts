export interface ResourceWatchlistItem {
  _id: string;
  name: string;
  userId: string;
  resources: Array<{
    arn: string;
    actions: string[];
    _id: string;
  }>;
}

export type PermissionStatus = 'valid' | 'error' | 'stale' | 'warning';

export interface ActionData {
  status: PermissionStatus;
  reason: string | null;
  timestamp: string;
}

export type ArnPermissionData = ActionData | Record<string, ActionData>;

export interface UserPermission {
  _id: string;
  name: string;
  userId: string;
  permissionsData: Record<string, ArnPermissionData>;
}
