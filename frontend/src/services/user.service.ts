import type { CurrentUser } from "@/services/types/user.types";

const API_BASE = "http://localhost:3000/api";

// TODO: replace with real GET /api/user/me once auth is implemented
export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const response = await fetch(`${API_BASE}/user/me`);
  if (!response.ok) throw new Error("Failed to fetch current user");
  return response.json() as Promise<CurrentUser>;
};
