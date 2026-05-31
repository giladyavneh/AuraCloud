import { API_BASE_URL } from '@/constants';
import { getStoredToken } from '@/services/auth.service';
import type {
  AwsResource,
  ResourceAction,
  ResourceWatchlistItem,
  UserPermission,
} from '@/services/types/resources.types';

export type WatchlistResource = ResourceWatchlistItem['resources'][number];

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const fetchUserResourceWatchlist = async (): Promise<ResourceWatchlistItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user-resource-watchlist`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch resource watchlist: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceWatchlistItem[]>;
};

export const fetchUserPermissions = async (): Promise<UserPermission> => {
  const response = await fetch(`${API_BASE_URL}/api/user-permissions`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`${response.status}: Failed to fetch user permissions`);
  }
  return response.json() as Promise<UserPermission>;
};

export const fetchAllResources = async (): Promise<AwsResource[]> => {
  const response = await fetch(`${API_BASE_URL}/api/resources`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch resources: ${response.statusText}`);
  }
  return response.json() as Promise<AwsResource[]>;
};

export const fetchResourceActions = async (arn: string): Promise<ResourceAction[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/resources/${encodeURIComponent(arn)}/actions`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch resource actions: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceAction[]>;
};

export const createWatchlist = async (
  resources: WatchlistResource[],
): Promise<ResourceWatchlistItem> => {
  const response = await fetch(`${API_BASE_URL}/api/user-resource-watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resources }),
  });
  // 409 means a watchlist was already created between renders — treat as success
  if (response.status === 409) {
    const body = (await response.json()) as { watchlist: ResourceWatchlistItem };
    return body.watchlist;
  }
  if (!response.ok) {
    throw new Error(`Failed to create watchlist: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceWatchlistItem>;
};

export const updateWatchlist = async (
  id: string,
  resources: WatchlistResource[],
): Promise<ResourceWatchlistItem> => {
  const response = await fetch(`${API_BASE_URL}/api/user-resource-watchlist/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resources }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update watchlist: ${response.statusText}`);
  }
  return response.json() as Promise<ResourceWatchlistItem>;
};
