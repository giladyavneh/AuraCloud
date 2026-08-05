import { API_BASE_URL } from '@/constants';
import { getStoredToken } from '@/services/auth.service';
import type {
  ApprovePayload,
  ApproveResponse,
  CompanyConnectedClient,
  ConnectedClient,
  ConsentRequest,
} from '@/services/types/oauth.types';

const API_BASE = `${API_BASE_URL}/api`;

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Prefixes the status code onto the message — the same convention as team.service.ts.
 * The consent screen has to tell an unknown client (404, a dead end) apart from a
 * network failure (retryable).
 */
async function throwApiError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(`${response.status}: ${body?.message ?? fallback}`);
}

export const fetchConsentRequest = async (
  clientId: string,
  redirectUri: string,
): Promise<ConsentRequest> => {
  const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
  const response = await fetch(`${API_BASE}/oauth/consent?${query.toString()}`, {
    headers: authHeaders(),
  });
  if (!response.ok) await throwApiError(response, 'Failed to load the request');
  return response.json() as Promise<ConsentRequest>;
};

export const approveAuthorization = async (
  payload: ApprovePayload,
): Promise<ApproveResponse> => {
  const response = await fetch(`${API_BASE}/oauth/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await throwApiError(response, 'Failed to complete the connection');
  return response.json() as Promise<ApproveResponse>;
};

export const fetchGrants = async (): Promise<ConnectedClient[]> => {
  const response = await fetch(`${API_BASE}/oauth/grants`, { headers: authHeaders() });
  if (!response.ok) await throwApiError(response, 'Failed to load your connected clients');
  return response.json() as Promise<ConnectedClient[]>;
};

export const fetchCompanyGrants = async (): Promise<CompanyConnectedClient[]> => {
  const response = await fetch(`${API_BASE}/oauth/grants/company`, { headers: authHeaders() });
  if (!response.ok) await throwApiError(response, "Failed to load your company's connections");
  return response.json() as Promise<CompanyConnectedClient[]>;
};

export const revokeGrant = async (grantId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/oauth/grants/${grantId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  // Gone already — a manager revoked it, or a second tab did — is the outcome the user
  // asked for, so it resolves rather than raising an error the UI would have to explain.
  if (!response.ok && response.status !== 404) {
    await throwApiError(response, 'Failed to disconnect the client');
  }
};
