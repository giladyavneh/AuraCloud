export const SIDEBAR_WIDTH = 260;

/**
 * Base URL of the api-server.
 * Set via `VITE_API_BASE_URL` in `frontend/.env` (or per-environment `.env.{mode}` files).
 * Falls back to localhost for local dev when the env var is not set.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// Placeholder until real auth is implemented
export const MOCK_USER_ID = '123';
