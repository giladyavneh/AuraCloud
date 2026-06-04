import type {
  AuthCustomer,
  AuthResponse,
  LoginPayload,
  SignUpPayload,
  UpdateProfilePayload,
} from "@/services/types/auth.types";

export interface CompanyInfo {
  _id: string;
  name: string;
  slug: string;
}

export interface AwsUserOption {
  _id: string;
  name: string;
  source: 'IAM' | 'SSO';
  externalId: string;
  arn: string | null;
}

const API_BASE = "http://localhost:3000/api";

const AUTH_TOKEN_KEY = "aura_auth_token";

export const getStoredToken = (): string | null =>
  localStorage.getItem(AUTH_TOKEN_KEY);

export const storeToken = (token: string): void =>
  localStorage.setItem(AUTH_TOKEN_KEY, token);

export const clearToken = (): void =>
  localStorage.removeItem(AUTH_TOKEN_KEY);

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const signUp = async (payload: SignUpPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Sign up failed" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AuthResponse>;
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AuthResponse>;
};

export const fetchMe = async (): Promise<AuthCustomer> => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Not authenticated");
  return response.json() as Promise<AuthCustomer>;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<AuthCustomer> => {
  const response = await fetch(`${API_BASE}/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update profile" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AuthCustomer>;
};

export const submitAwsCredentials = async (payload: {
  accessKeyId: string;
  secretAccessKey: string;
}): Promise<AuthCustomer> => {
  const response = await fetch(`${API_BASE}/aws/onboard-credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to save credentials" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AuthCustomer>;
};

export interface CompanyInviteInfo {
  inviteCode: string;
  slug: string;
}

export const fetchCompanyInviteCode = async (): Promise<CompanyInviteInfo> => {
  const response = await fetch(`${API_BASE}/company/invite-code`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch invite code' }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<CompanyInviteInfo>;
};

export const fetchCompanyBySlug = async (slug: string): Promise<CompanyInfo> => {
  const response = await fetch(`${API_BASE}/companies/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Company not found" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<CompanyInfo>;
};

export const fetchCompanyAwsUsers = async (slug: string): Promise<AwsUserOption[]> => {
  const response = await fetch(`${API_BASE}/companies/${encodeURIComponent(slug)}/aws-users`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch users" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AwsUserOption[]>;
};

export const linkAwsUser = async (awsUserId: string): Promise<AuthCustomer> => {
  const response = await fetch(`${API_BASE}/user/link-aws-user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ awsUserId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to link AWS user" }));
    throw new Error((error as { message: string }).message);
  }
  return response.json() as Promise<AuthCustomer>;
};
