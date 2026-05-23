import { API_BASE_URL } from '@/constants';
import type { ResourceWatchlistItem, UserPermission } from '@/services/types/resources.types';

export const fetchUserResourceWatchlist = async (): Promise<ResourceWatchlistItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user-resource-watchlist`);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource watchlist: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceWatchlistItem[]>;
};

export const fetchUserPermissions = async (userId: string): Promise<UserPermission> => {
  const response = await fetch(`${API_BASE_URL}/api/user-permissions/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user permissions: ${response.statusText}`);
  }
  return response.json() as Promise<UserPermission>;
};
