import { API_BASE_URL } from '@/constants';

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

export const fetchUserResourceWatchlist = async (): Promise<ResourceWatchlistItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user-resource-watchlist`);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource watchlist: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceWatchlistItem[]>;
};

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
  permissionsData: Record<string, ArnPermissionData>;
}

export const fetchUserPermissions = async (): Promise<UserPermission[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user-permissions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user permissions: ${response.statusText}`);
  }
  return response.json() as Promise<UserPermission[]>;
};
