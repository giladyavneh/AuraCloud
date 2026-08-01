import { API_BASE_URL } from '@/constants';
import { getStoredToken } from '@/services/auth.service';
import type {
  Employee,
  PresetUpsertPayload,
  Team,
  WatchlistPreset,
} from '@/services/types/team.types';

const API_BASE = `${API_BASE_URL}/api`;

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

/**
 * Throws an Error whose message is prefixed with the HTTP status code
 * (e.g. "409: Cannot remove the last manager"), so callers can branch on
 * specific status codes (last-manager 409, self-removal 400) without a
 * second round trip — mirrors the `${response.status}:` convention already
 * used by `fetchUserPermissions` in resources.service.ts.
 */
async function throwApiError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(`${response.status}: ${body?.message ?? fallback}`);
}

// ── Employees ────────────────────────────────────────────────────────────────

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await fetch(`${API_BASE}/employees`, { headers: authHeaders() });
  if (!response.ok) await throwApiError(response, 'Failed to fetch employees');
  return response.json() as Promise<Employee[]>;
};

export const removeEmployee = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/employees/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) await throwApiError(response, 'Failed to remove employee');
};

export const updateEmployeeRole = async (
  id: string,
  role: 'manager' | 'employee',
): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/employees/${id}/role`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ role }),
  });
  if (!response.ok) await throwApiError(response, 'Failed to update role');
  return response.json() as Promise<Employee>;
};

export const updateEmployeeTeam = async (
  id: string,
  teamId: string | null,
): Promise<Employee> => {
  const response = await fetch(`${API_BASE}/employees/${id}/team`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ teamId }),
  });
  if (!response.ok) await throwApiError(response, 'Failed to update team assignment');
  return response.json() as Promise<Employee>;
};

// ── Teams ────────────────────────────────────────────────────────────────────

export const fetchTeams = async (): Promise<Team[]> => {
  const response = await fetch(`${API_BASE}/teams`, { headers: authHeaders() });
  if (!response.ok) await throwApiError(response, 'Failed to fetch teams');
  return response.json() as Promise<Team[]>;
};

export const createTeam = async (name: string): Promise<Team> => {
  const response = await fetch(`${API_BASE}/teams`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) await throwApiError(response, 'Failed to create team');
  return response.json() as Promise<Team>;
};

export const renameTeam = async (id: string, name: string): Promise<Team> => {
  const response = await fetch(`${API_BASE}/teams/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) await throwApiError(response, 'Failed to rename team');
  return response.json() as Promise<Team>;
};

export const deleteTeam = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/teams/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) await throwApiError(response, 'Failed to delete team');
};

// ── Watchlist presets ──────────────────────────────────────────────────────

export const fetchWatchlistPresets = async (): Promise<WatchlistPreset[]> => {
  const response = await fetch(`${API_BASE}/watchlist-presets`, { headers: authHeaders() });
  if (!response.ok) await throwApiError(response, 'Failed to fetch presets');
  return response.json() as Promise<WatchlistPreset[]>;
};

export const upsertWatchlistPreset = async (
  payload: PresetUpsertPayload,
): Promise<WatchlistPreset> => {
  const response = await fetch(`${API_BASE}/watchlist-presets`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) await throwApiError(response, 'Failed to save preset');
  return response.json() as Promise<WatchlistPreset>;
};

export const deleteWatchlistPreset = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/watchlist-presets/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) await throwApiError(response, 'Failed to delete preset');
};
